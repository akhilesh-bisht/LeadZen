import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Lead } from "./models/Lead.js";
import {
  ILead,
  LeadSearchResult,
  DashboardStats,
  LeadsQueryParams,
  TeamMember,
  TeamWorkloadStats,
} from "../src/types/index.js";

let isConnected = false;
let dbMode: "mongodb" | "local_persistent" = "local_persistent";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "leads.json");
const TEAM_FILE = path.join(DATA_DIR, "team.json");

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm_dhananjay",
    name: "Dhananjay",
    role: "Senior Outreach Specialist",
    email: "dhananjay@company.sales",
    phone: "+1 (555) 234-8901",
    avatarColor: "#10b981",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tm_harsh",
    name: "Harsh",
    role: "Account Executive",
    email: "harsh@company.sales",
    phone: "+1 (555) 876-5432",
    avatarColor: "#6366f1",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tm_akhilesh",
    name: "Akhilesh",
    role: "Team Lead & Growth",
    email: "akhilesh@company.sales",
    phone: "+1 (555) 432-1098",
    avatarColor: "#f59e0b",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// Ensure local persistent storage directory and files exist
function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]), "utf-8");
    }
    if (!fs.existsSync(TEAM_FILE)) {
      fs.writeFileSync(
        TEAM_FILE,
        JSON.stringify(DEFAULT_TEAM_MEMBERS, null, 2),
        "utf-8",
      );
    }
  } catch (err) {
    console.error("Error initializing data directory:", err);
  }
}

// Local store helpers
function readLocalLeads(): ILead[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading local leads:", err);
    return [];
  }
}

function writeLocalLeads(leads: ILead[]) {
  ensureDataFiles();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local leads:", err);
  }
}

// Team member store helpers
export function getTeamMembers(): TeamMember[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(TEAM_FILE, "utf-8");
    let members: TeamMember[] = JSON.parse(raw);
    if (!Array.isArray(members) || members.length === 0) {
      members = [...DEFAULT_TEAM_MEMBERS];
      writeTeamMembers(members);
    }

    // Auto-sync with registered system user accounts so any newly created user dynamically appears in team & assignment lists
    const usersFile = path.join(DATA_DIR, "users.json");
    if (fs.existsSync(usersFile)) {
      try {
        const usersRaw = fs.readFileSync(usersFile, "utf-8");
        const usersList: any[] = JSON.parse(usersRaw);
        let hasNewUser = false;
        for (const user of usersList) {
          if (
            user.active &&
            !members.some(
              (m) =>
                m.email.toLowerCase() === user.email.toLowerCase() ||
                m.name.toLowerCase() === user.name.toLowerCase(),
            )
          ) {
            members.push({
              id: user.teamMemberId || `tm_${user.id || Date.now()}`,
              name: user.name,
              email: user.email,
              role:
                user.role === "admin"
                  ? "Sales Manager / Admin"
                  : "Sales Representative",
              phone: user.phone || "",
              avatarColor: user.avatarColor || "#6366f1",
              active: true,
              createdAt: user.createdAt || new Date().toISOString(),
            });
            hasNewUser = true;
          }
        }
        if (hasNewUser) {
          writeTeamMembers(members);
        }
      } catch (userSyncErr) {
        console.warn("User-to-team sync notice:", userSyncErr);
      }
    }

    return members;
  } catch (err) {
    console.error("Error reading team members:", err);
    return DEFAULT_TEAM_MEMBERS;
  }
}

export function writeTeamMembers(members: TeamMember[]) {
  ensureDataFiles();
  try {
    fs.writeFileSync(TEAM_FILE, JSON.stringify(members, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing team members:", err);
  }
}

export function addTeamMember(data: Partial<TeamMember>): TeamMember {
  const members = getTeamMembers();
  const colors = [
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newMember: TeamMember = {
    id: data.id || `tm_${Date.now()}`,
    name: (data.name || "New Member").trim(),
    email:
      data.email?.trim() ||
      `${(data.name || "member").toLowerCase().replace(/\s+/g, "")}@company.sales`,
    role: data.role?.trim() || "Sales Representative",
    phone: data.phone?.trim() || "",
    avatarColor: data.avatarColor || randomColor,
    active: data.active ?? true,
    createdAt: new Date().toISOString(),
  };

  members.push(newMember);
  writeTeamMembers(members);
  return newMember;
}

export function deleteTeamMember(id: string): boolean {
  const members = getTeamMembers();
  const filtered = members.filter(
    (m) => m.id !== id && m.name.toLowerCase() !== id.toLowerCase(),
  );
  if (filtered.length === members.length) return false;
  writeTeamMembers(filtered);
  return true;
}

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    dbMode = "local_persistent";
    return { isConnected: false, mode: "local_persistent" };
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    dbMode = "mongodb";
    return { isConnected: true, mode: "mongodb" };
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    dbMode = "mongodb";
    console.log("Successfully connected to MongoDB Atlas");
    return { isConnected: true, mode: "mongodb" };
  } catch (error) {
    console.warn(
      "MongoDB connection failed, falling back to local persistent store:",
      (error as Error).message,
    );
    isConnected = false;
    dbMode = "local_persistent";
    return {
      isConnected: false,
      mode: "local_persistent",
      error: (error as Error).message,
    };
  }
}

export function getDatabaseStatus() {
  return {
    mode: dbMode,
    isConnected: isConnected && mongoose.connection.readyState === 1,
    hasMongoUri: Boolean(
      process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== "",
    ),
  };
}

// Helper: Normalize string for comparison
function normalizeStr(str?: string | null): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Helper: Normalize phone
function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

// Check duplicates for a list of search results
export async function checkDuplicates(
  candidates: LeadSearchResult[],
): Promise<LeadSearchResult[]> {
  await connectToDatabase();

  if (dbMode === "mongodb" && isConnected) {
    const allLeads = await Lead.find({}).lean().exec();
    return enrichCandidatesWithDuplicateInfo(
      candidates,
      allLeads as unknown as ILead[],
    );
  } else {
    const localLeads = readLocalLeads();
    return enrichCandidatesWithDuplicateInfo(candidates, localLeads);
  }
}

function enrichCandidatesWithDuplicateInfo(
  candidates: LeadSearchResult[],
  existingLeads: ILead[],
): LeadSearchResult[] {
  return candidates.map((item) => {
    const match = existingLeads.find((lead) => {
      // 1. External ID match
      if (
        item.externalId &&
        lead.externalId &&
        item.externalId === lead.externalId
      ) {
        return true;
      }
      // 2. Phone match
      const p1 = normalizePhone(item.phone);
      const p2 = normalizePhone(lead.phone);
      if (p1 && p2 && p1.length >= 7 && p1 === p2) {
        return true;
      }
      // 3. Name & City match
      const n1 = normalizeStr(item.businessName);
      const n2 = normalizeStr(lead.businessName);
      const c1 = normalizeStr(item.city);
      const c2 = normalizeStr(lead.city);
      if (n1 && n2 && n1 === n2 && c1 === c2) {
        return true;
      }
      // 4. Website match
      const w1 = normalizeStr(item.website);
      const w2 = normalizeStr(lead.website);
      if (w1 && w2 && w1.length > 5 && w1 === w2) {
        return true;
      }
      return false;
    });

    if (match) {
      return {
        ...item,
        isSaved: true,
        savedLeadId: String(match._id),
        savedStatus: match.status,
      };
    }

    return {
      ...item,
      isSaved: false,
    };
  });
}

// Save one or multiple leads
export async function saveLeads(
  leadsToSave: Partial<ILead>[],
): Promise<{ saved: ILead[]; duplicatesCount: number }> {
  await connectToDatabase();
  const savedResults: ILead[] = [];
  let duplicatesCount = 0;

  if (dbMode === "mongodb" && isConnected) {
    for (const leadData of leadsToSave) {
      if (!leadData.businessName || !leadData.city) continue;

      // Check duplicate
      const queryOr: Record<string, unknown>[] = [
        {
          businessName: new RegExp(`^${leadData.businessName.trim()}$`, "i"),
          city: new RegExp(`^${leadData.city.trim()}$`, "i"),
        },
      ];
      if (leadData.externalId)
        queryOr.push({ externalId: leadData.externalId });
      if (leadData.phone) queryOr.push({ phone: leadData.phone.trim() });
      if (leadData.website) queryOr.push({ website: leadData.website.trim() });

      const existing = await Lead.findOne({ $or: queryOr }).lean().exec();
      if (existing) {
        duplicatesCount++;
        savedResults.push(existing as unknown as ILead);
      } else {
        const created = await Lead.create({
          ...leadData,
          status: leadData.status || "new",
        });
        savedResults.push(created.toObject() as unknown as ILead);
      }
    }
  } else {
    const existing = readLocalLeads();
    const now = new Date().toISOString();

    for (const leadData of leadsToSave) {
      if (!leadData.businessName || !leadData.city) continue;

      const n1 = normalizeStr(leadData.businessName);
      const c1 = normalizeStr(leadData.city);
      const p1 = normalizePhone(leadData.phone);
      const w1 = normalizeStr(leadData.website);

      const dup = existing.find((l) => {
        if (leadData.externalId && l.externalId === leadData.externalId)
          return true;
        if (p1 && normalizePhone(l.phone) === p1 && p1.length >= 7) return true;
        if (w1 && normalizeStr(l.website) === w1 && w1.length > 5) return true;
        if (n1 === normalizeStr(l.businessName) && c1 === normalizeStr(l.city))
          return true;
        return false;
      });

      if (dup) {
        duplicatesCount++;
        savedResults.push(dup);
      } else {
        const newLead: ILead = {
          _id: crypto.randomUUID(),
          businessName: leadData.businessName.trim(),
          category: leadData.category || "General Business",
          address: leadData.address || null,
          city: leadData.city.trim(),
          phone: leadData.phone || null,
          email: leadData.email || null,
          website: leadData.website || null,
          instagram: leadData.instagram || null,
          linkedin: leadData.linkedin || null,
          facebook: leadData.facebook || null,
          googleMapsUrl: leadData.googleMapsUrl || null,
          latitude: leadData.latitude || null,
          longitude: leadData.longitude || null,
          rating: leadData.rating ?? null,
          reviewCount: leadData.reviewCount ?? null,
          externalId: leadData.externalId || null,
          source: leadData.source || "OpenStreetMap",
          status: leadData.status || "new",
          notes: leadData.notes || "",
          createdAt: now,
          updatedAt: now,
        };
        existing.unshift(newLead);
        savedResults.push(newLead);
      }
    }
    writeLocalLeads(existing);
  }

  return { saved: savedResults, duplicatesCount };
}

// Assign one or multiple leads to a team member, or round-robin auto-distribute
export async function assignLeads(
  leadIds: string[],
  assignTo: string | null | "round_robin",
  customMemberList?: string[],
): Promise<{
  updatedCount: number;
  assignments: { leadId: string; assignedTo: string | null }[];
}> {
  await connectToDatabase();
  const now = new Date().toISOString();
  const assignments: { leadId: string; assignedTo: string | null }[] = [];

  const teamMembers = getTeamMembers().filter((m) => m.active);
  const activeNames =
    customMemberList && customMemberList.length > 0
      ? customMemberList
      : teamMembers.map((m) => m.name);

  if (dbMode === "mongodb" && isConnected) {
    if (assignTo === "round_robin") {
      if (activeNames.length === 0) return { updatedCount: 0, assignments: [] };
      for (let i = 0; i < leadIds.length; i++) {
        const id = leadIds[i];
        const member = activeNames[i % activeNames.length];
        await Lead.findByIdAndUpdate(id, {
          assignedTo: member,
          assignedAt: new Date(),
          updatedAt: new Date(),
        }).exec();
        assignments.push({ leadId: id, assignedTo: member });
      }
    } else if (
      assignTo === null ||
      assignTo === "" ||
      assignTo === "unassigned"
    ) {
      await Lead.updateMany(
        { _id: { $in: leadIds } },
        { $set: { assignedTo: null, assignedAt: null, updatedAt: new Date() } },
      ).exec();
      leadIds.forEach((id) =>
        assignments.push({ leadId: id, assignedTo: null }),
      );
    } else {
      await Lead.updateMany(
        { _id: { $in: leadIds } },
        {
          $set: {
            assignedTo: assignTo,
            assignedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ).exec();
      leadIds.forEach((id) =>
        assignments.push({ leadId: id, assignedTo: assignTo }),
      );
    }
    return { updatedCount: assignments.length, assignments };
  } else {
    const leads = readLocalLeads();
    let updatedCount = 0;

    if (assignTo === "round_robin") {
      if (activeNames.length === 0) return { updatedCount: 0, assignments: [] };
      let cycleIdx = 0;
      for (const id of leadIds) {
        const lead = leads.find((l) => String(l._id) === String(id));
        if (lead) {
          const member = activeNames[cycleIdx % activeNames.length];
          cycleIdx++;
          lead.assignedTo = member;
          lead.assignedAt = now;
          lead.updatedAt = now;
          updatedCount++;
          assignments.push({ leadId: id, assignedTo: member });
        }
      }
    } else {
      const targetAssignee =
        assignTo === "unassigned" || !assignTo ? null : assignTo;
      for (const id of leadIds) {
        const lead = leads.find((l) => String(l._id) === String(id));
        if (lead) {
          lead.assignedTo = targetAssignee;
          lead.assignedAt = targetAssignee ? now : null;
          lead.updatedAt = now;
          updatedCount++;
          assignments.push({ leadId: id, assignedTo: targetAssignee });
        }
      }
    }

    writeLocalLeads(leads);
    return { updatedCount, assignments };
  }
}

// Get paginated and filtered leads
export async function getLeads(params: LeadsQueryParams) {
  await connectToDatabase();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  if (dbMode === "mongodb" && isConnected) {
    const filter: Record<string, unknown> = {};
    if (params.status && params.status !== "all") {
      filter.status = params.status;
    }
    if (params.category && params.category !== "all") {
      filter.category = params.category;
    }
    if (params.city && params.city !== "all") {
      filter.city = new RegExp(`^${params.city}$`, "i");
    }
    if (params.assignedTo && params.assignedTo !== "all") {
      if (params.assignedTo === "unassigned") {
        filter.$or = [
          { assignedTo: null },
          { assignedTo: "" },
          { assignedTo: { $exists: false } },
        ];
      } else if (params.assignedTo === "assigned") {
        filter.assignedTo = { $nin: [null, ""] };
      } else {
        filter.assignedTo = new RegExp(`^${params.assignedTo}$`, "i");
      }
    }
    if (params.search && params.search.trim()) {
      const s = params.search.trim();
      filter.$or = [
        { businessName: { $regex: s, $options: "i" } },
        { city: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { category: { $regex: s, $options: "i" } },
        { assignedTo: { $regex: s, $options: "i" } },
        { notes: { $regex: s, $options: "i" } },
      ];
    }

    const sortField = params.sortBy || "createdAt";
    const sortDirection = params.sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const leadsQuery = Lead.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    const countQuery = Lead.countDocuments(filter).exec();
    const categoriesQuery = Lead.distinct("category", {}).exec();
    const citiesQuery = Lead.distinct("city", {}).exec();
    const assigneesQuery = Lead.distinct("assignedTo", {}).exec();

    const [leads, total, allCategories, allCities, allAssignees] =
      await Promise.all([
        leadsQuery,
        countQuery,
        categoriesQuery,
        citiesQuery,
        assigneesQuery,
      ]);

    return {
      leads: leads as unknown as ILead[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableCategories: (allCategories as string[]).filter(Boolean),
      availableCities: (allCities as string[]).filter(Boolean),
      availableAssignees: (allAssignees as string[]).filter(Boolean),
    };
  } else {
    let leads = readLocalLeads();

    // Extract all unique categories, cities, and assignees
    const availableCategories = Array.from(
      new Set(leads.map((l) => l.category).filter(Boolean)),
    );
    const availableCities = Array.from(
      new Set(leads.map((l) => l.city).filter(Boolean)),
    );
    const availableAssignees = Array.from(
      new Set(
        leads
          .map((l) => l.assignedTo)
          .filter((a): a is string => Boolean(a && a.trim())),
      ),
    );

    // Filtering
    if (params.status && params.status !== "all") {
      leads = leads.filter((l) => l.status === params.status);
    }
    if (params.category && params.category !== "all") {
      leads = leads.filter(
        (l) => l.category.toLowerCase() === params.category!.toLowerCase(),
      );
    }
    if (params.city && params.city !== "all") {
      leads = leads.filter(
        (l) => l.city.toLowerCase() === params.city!.toLowerCase(),
      );
    }
    if (params.assignedTo && params.assignedTo !== "all") {
      if (params.assignedTo === "unassigned") {
        leads = leads.filter(
          (l) => !l.assignedTo || l.assignedTo.trim() === "",
        );
      } else if (params.assignedTo === "assigned") {
        leads = leads.filter((l) =>
          Boolean(l.assignedTo && l.assignedTo.trim() !== ""),
        );
      } else {
        leads = leads.filter(
          (l) =>
            l.assignedTo &&
            l.assignedTo.toLowerCase() === params.assignedTo!.toLowerCase(),
        );
      }
    }
    if (params.search && params.search.trim()) {
      const s = params.search.toLowerCase().trim();
      leads = leads.filter((l) => {
        return (
          l.businessName.toLowerCase().includes(s) ||
          l.city.toLowerCase().includes(s) ||
          (l.phone && l.phone.toLowerCase().includes(s)) ||
          (l.email && l.email.toLowerCase().includes(s)) ||
          (l.category && l.category.toLowerCase().includes(s)) ||
          (l.assignedTo && l.assignedTo.toLowerCase().includes(s)) ||
          (l.notes && l.notes.toLowerCase().includes(s))
        );
      });
    }

    // Sorting
    const sortField = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";

    leads.sort((a, b) => {
      let valA = (a as any)[sortField];
      let valB = (b as any)[sortField];
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (sortField === "createdAt") {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    const total = leads.length;
    const paginated = leads.slice(skip, skip + limit);

    return {
      leads: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      availableCategories,
      availableCities,
      availableAssignees,
    };
  }
}

// Get single lead by ID
export async function getLeadById(id: string): Promise<ILead | null> {
  await connectToDatabase();
  if (dbMode === "mongodb" && isConnected) {
    const lead = await Lead.findById(id).lean().exec();
    return lead ? (lead as unknown as ILead) : null;
  } else {
    const leads = readLocalLeads();
    return leads.find((l) => String(l._id) === String(id)) || null;
  }
}

// Update lead by ID
export async function updateLead(
  id: string,
  updates: Partial<ILead>,
): Promise<ILead | null> {
  await connectToDatabase();
  const updateData = { ...updates };
  if (updates.assignedTo !== undefined) {
    if (updates.assignedTo && updates.assignedTo.trim() !== "") {
      updateData.assignedAt = new Date();
    } else {
      updateData.assignedTo = null;
      updateData.assignedAt = null;
    }
  }

  if (dbMode === "mongodb" && isConnected) {
    const updated = await Lead.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true },
    )
      .lean()
      .exec();
    return updated ? (updated as unknown as ILead) : null;
  } else {
    const leads = readLocalLeads();
    const index = leads.findIndex((l) => String(l._id) === String(id));
    if (index === -1) return null;

    leads[index] = {
      ...leads[index],
      ...updateData,
      assignedTo: updateData.assignedTo || null,
      assignedAt: updateData.assignedAt ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    writeLocalLeads(leads);
    return leads[index];
  }
}

// Delete lead by ID
export async function deleteLead(id: string): Promise<boolean> {
  await connectToDatabase();
  if (dbMode === "mongodb" && isConnected) {
    const res = await Lead.findByIdAndDelete(id).exec();
    return Boolean(res);
  } else {
    const leads = readLocalLeads();
    const filtered = leads.filter((l) => String(l._id) !== String(id));
    if (filtered.length === leads.length) return false;
    writeLocalLeads(filtered);
    return true;
  }
}

// Delete multiple leads by IDs
export async function deleteManyLeads(ids: string[]): Promise<number> {
  await connectToDatabase();
  if (dbMode === "mongodb" && isConnected) {
    const res = await Lead.deleteMany({ _id: { $in: ids } }).exec();
    return res.deletedCount || 0;
  } else {
    const leads = readLocalLeads();
    const idSet = new Set(ids.map(String));
    const filtered = leads.filter((l) => !idSet.has(String(l._id)));
    const deletedCount = leads.length - filtered.length;
    writeLocalLeads(filtered);
    return deletedCount;
  }
}

// Get Dynamic Dashboard Stats calculated from real database records including Team Workload
export async function getDashboardStats(): Promise<DashboardStats> {
  await connectToDatabase();
  const teamMembers = getTeamMembers();

  if (dbMode === "mongodb" && isConnected) {
    const [
      total,
      newCount,
      contacted,
      interested,
      notInterested,
      converted,
      unassignedCount,
      recentLeads,
      categoriesAgg,
      citiesAgg,
      allLeads,
    ] = await Promise.all([
      Lead.countDocuments().exec(),
      Lead.countDocuments({ status: "new" }).exec(),
      Lead.countDocuments({ status: "contacted" }).exec(),
      Lead.countDocuments({ status: "interested" }).exec(),
      Lead.countDocuments({ status: "not_interested" }).exec(),
      Lead.countDocuments({ status: "converted" }).exec(),
      Lead.countDocuments({
        $or: [
          { assignedTo: null },
          { assignedTo: "" },
          { assignedTo: { $exists: false } },
        ],
      }).exec(),
      Lead.find().sort({ createdAt: -1 }).limit(5).lean().exec(),
      Lead.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]).exec(),
      Lead.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]).exec(),
      Lead.find({}, { assignedTo: 1, status: 1 }).lean().exec(),
    ]);

    const teamWorkload: TeamWorkloadStats[] = teamMembers.map((member) => {
      const assigned = allLeads.filter(
        (l) =>
          l.assignedTo &&
          l.assignedTo.toLowerCase() === member.name.toLowerCase(),
      );
      return {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        avatarColor: member.avatarColor,
        totalAssigned: assigned.length,
        contacted: assigned.filter((l) => l.status === "contacted").length,
        interested: assigned.filter((l) => l.status === "interested").length,
        converted: assigned.filter((l) => l.status === "converted").length,
        uncontacted: assigned.filter((l) => l.status === "new").length,
      };
    });

    return {
      total,
      new: newCount,
      contacted,
      interested,
      not_interested: notInterested,
      converted,
      unassignedCount,
      assignedCount: total - unassignedCount,
      teamWorkload,
      categoriesCount: categoriesAgg.map((c) => ({
        category: c._id || "Uncategorized",
        count: c.count,
      })),
      citiesCount: citiesAgg.map((c) => ({
        city: c._id || "Unknown",
        count: c.count,
      })),
      recentLeads: recentLeads as unknown as ILead[],
      dbType: "mongodb",
    };
  } else {
    const leads = readLocalLeads();
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "new").length;
    const contacted = leads.filter((l) => l.status === "contacted").length;
    const interested = leads.filter((l) => l.status === "interested").length;
    const notInterested = leads.filter(
      (l) => l.status === "not_interested",
    ).length;
    const converted = leads.filter((l) => l.status === "converted").length;
    const unassignedCount = leads.filter(
      (l) => !l.assignedTo || l.assignedTo.trim() === "",
    ).length;

    const teamWorkload: TeamWorkloadStats[] = teamMembers.map((member) => {
      const assigned = leads.filter(
        (l) =>
          l.assignedTo &&
          l.assignedTo.toLowerCase() === member.name.toLowerCase(),
      );
      return {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        avatarColor: member.avatarColor,
        totalAssigned: assigned.length,
        contacted: assigned.filter((l) => l.status === "contacted").length,
        interested: assigned.filter((l) => l.status === "interested").length,
        converted: assigned.filter((l) => l.status === "converted").length,
        uncontacted: assigned.filter((l) => l.status === "new").length,
      };
    });

    // Categories aggregate
    const catMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    leads.forEach((l) => {
      const cat = l.category || "General Business";
      catMap[cat] = (catMap[cat] || 0) + 1;
      const city = l.city || "Unknown";
      cityMap[city] = (cityMap[city] || 0) + 1;
    });

    const categoriesCount = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const citiesCount = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const recentLeads = [...leads]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return {
      total,
      new: newCount,
      contacted,
      interested,
      not_interested: notInterested,
      converted,
      unassignedCount,
      assignedCount: total - unassignedCount,
      teamWorkload,
      categoriesCount,
      citiesCount,
      recentLeads,
      dbType: "local_persistent",
    };
  }
}

// Get leads for Excel export
export async function getLeadsForExport(filterOptions: {
  status?: string;
  category?: string;
  city?: string;
  assignedTo?: string;
  ids?: string[];
}) {
  await connectToDatabase();

  if (dbMode === "mongodb" && isConnected) {
    const query: Record<string, unknown> = {};
    if (filterOptions.ids && filterOptions.ids.length > 0) {
      query._id = { $in: filterOptions.ids };
    } else {
      if (filterOptions.status && filterOptions.status !== "all")
        query.status = filterOptions.status;
      if (filterOptions.category && filterOptions.category !== "all")
        query.category = filterOptions.category;
      if (filterOptions.city && filterOptions.city !== "all")
        query.city = new RegExp(`^${filterOptions.city}$`, "i");
      if (filterOptions.assignedTo && filterOptions.assignedTo !== "all") {
        if (filterOptions.assignedTo === "unassigned") {
          query.$or = [
            { assignedTo: null },
            { assignedTo: "" },
            { assignedTo: { $exists: false } },
          ];
        } else {
          query.assignedTo = new RegExp(`^${filterOptions.assignedTo}$`, "i");
        }
      }
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean().exec();
    return leads as unknown as ILead[];
  } else {
    let leads = readLocalLeads();
    if (filterOptions.ids && filterOptions.ids.length > 0) {
      const idSet = new Set(filterOptions.ids.map(String));
      leads = leads.filter((l) => idSet.has(String(l._id)));
    } else {
      if (filterOptions.status && filterOptions.status !== "all") {
        leads = leads.filter((l) => l.status === filterOptions.status);
      }
      if (filterOptions.category && filterOptions.category !== "all") {
        leads = leads.filter(
          (l) =>
            l.category.toLowerCase() === filterOptions.category!.toLowerCase(),
        );
      }
      if (filterOptions.city && filterOptions.city !== "all") {
        leads = leads.filter(
          (l) => l.city.toLowerCase() === filterOptions.city!.toLowerCase(),
        );
      }
      if (filterOptions.assignedTo && filterOptions.assignedTo !== "all") {
        if (filterOptions.assignedTo === "unassigned") {
          leads = leads.filter(
            (l) => !l.assignedTo || l.assignedTo.trim() === "",
          );
        } else {
          leads = leads.filter(
            (l) =>
              l.assignedTo &&
              l.assignedTo.toLowerCase() ===
                filterOptions.assignedTo!.toLowerCase(),
          );
        }
      }
    }
    return leads.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
