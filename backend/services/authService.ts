/**
 * ============================================================================
 * SERVICE: AuthService
 * ============================================================================
 * Handles user authentication, credential verification, cryptographic password
 * hashing with random salts, JWT-style signed token issuance & validation,
 * and dual storage (MongoDB / JSON persistent store).
 *
 * Pre-seeds default credentials:
 *   - Admin: akhilesh@gmail.com / pass: akhilesh
 *   - Sales Rep 1: dhananjay@company.sales / pass: password123
 *   - Sales Rep 2: harsh@company.sales / pass: password123
 * ============================================================================
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { User, IUserDocument } from "../models/User.js";
import { DashboardPermission, IUser, UserRole } from "../../src/types/index.js";

export const DASHBOARD_PERMISSIONS: DashboardPermission[] = [
  "overview",
  "search",
  "leads",
  "team",
];
const DEFAULT_MEMBER_PERMISSIONS: DashboardPermission[] = ["overview", "leads"];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  permissions?: DashboardPermission[];
  teamMemberId?: string | null;
  avatarColor?: string;
  phone?: string | null;
  active: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

const JWT_SECRET =
  process.env.JWT_SECRET || "prospectpulse_secure_jwt_secret_key_2026";
const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

/**
 * Hash a plaintext password with a unique salt using PBKDF2 (10,000 iterations)
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

/**
 * Generate a cryptographically strong random salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generates the default pre-seeded users list
 */
function createDefaultUsers(): StoredUser[] {
  const akhileshSalt = generateSalt();
  const dhananjaySalt = generateSalt();
  const harshSalt = generateSalt();

  const now = new Date().toISOString();

  return [
    {
      id: "usr_akhilesh_admin",
      name: "Akhilesh",
      email: "akhilesh@gmail.com",
      passwordHash: hashPassword("akhilesh", akhileshSalt),
      salt: akhileshSalt,
      role: "admin",
      teamMemberId: "tm_akhilesh",
      avatarColor: "#f59e0b",
      phone: "+1 (555) 432-1098",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_dhananjay",
      name: "Dhananjay",
      email: "dhananjay@company.sales",
      passwordHash: hashPassword("password123", dhananjaySalt),
      salt: dhananjaySalt,
      role: "sales_rep",
      teamMemberId: "tm_dhananjay",
      avatarColor: "#10b981",
      phone: "+1 (555) 234-8901",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "usr_harsh",
      name: "Harsh",
      email: "harsh@company.sales",
      passwordHash: hashPassword("password123", harshSalt),
      salt: harshSalt,
      role: "sales_rep",
      teamMemberId: "tm_harsh",
      avatarColor: "#6366f1",
      phone: "+1 (555) 876-5432",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Ensure storage directory and users JSON file exist
 */
function ensureUsersFile(): StoredUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      const defaults = createDefaultUsers();
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const defaults = createDefaultUsers();
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }

    // Ensure akhilesh@gmail.com admin exists
    const hasAkhilesh = parsed.some(
      (u) => u.email.toLowerCase() === "akhilesh@gmail.com",
    );
    if (!hasAkhilesh) {
      const salt = generateSalt();
      parsed.unshift({
        id: "usr_akhilesh_admin",
        name: "Akhilesh",
        email: "akhilesh@gmail.com",
        passwordHash: hashPassword("akhilesh", salt),
        salt,
        role: "admin",
        teamMemberId: "tm_akhilesh",
        avatarColor: "#f59e0b",
        phone: "+1 (555) 432-1098",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      fs.writeFileSync(USERS_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }

    return parsed;
  } catch (err) {
    console.error("Error in ensureUsersFile:", err);
    return createDefaultUsers();
  }
}

/**
 * Write updated users array to local persistent JSON file
 */
function writeUsersFile(users: StoredUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users file:", err);
  }
}

/**
 * Strips sensitive password hashes and returns clean IUser object
 */
export function sanitizeUser(u: StoredUser | IUserDocument | any): IUser {
  const id = u.id || (u._id ? String(u._id) : `usr_${Date.now()}`);
  return {
    id,
    _id: id,
    name: u.name,
    email: u.email,
    role: u.role || "sales_rep",
    permissions:
      u.role === "admin"
        ? [...DASHBOARD_PERMISSIONS]
        : Array.isArray(u.permissions)
          ? u.permissions.filter((permission: string) =>
              DASHBOARD_PERMISSIONS.includes(permission as DashboardPermission),
            )
          : [...DEFAULT_MEMBER_PERMISSIONS],
    teamMemberId: u.teamMemberId || null,
    avatarColor: u.avatarColor || "#6366f1",
    phone: u.phone || null,
    active: u.active ?? true,
    lastLogin: u.lastLogin || null,
    createdAt: u.createdAt,
  };
}

/**
 * Generates an HMAC signed token with payload and expiration
 */
export function generateAuthToken(user: IUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamMemberId: user.teamMemberId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed authentication token
 */
export function verifyAuthToken(token: string): {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  teamMemberId?: string;
} | null {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(encodedPayload)
      .digest("base64url");

    if (signature !== expectedSig) {
      return null;
    }

    const json = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(json);

    if (payload.exp && payload.exp < Date.now()) {
      return null; // Token expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Authenticates a user by email & password
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<IUser | null> {
  const cleanEmail = email.trim().toLowerCase();

  // Try MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await User.findOne({ email: cleanEmail });
      if (doc) {
        const testHash = hashPassword(password, doc.salt);
        if (testHash === doc.passwordHash) {
          doc.lastLogin = new Date();
          await doc.save();
          return sanitizeUser(doc);
        }
      }
    } catch (err) {
      console.warn(
        "MongoDB auth lookup error, falling back to local store:",
        err,
      );
    }
  }

  // Fallback to local store
  const users = ensureUsersFile();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) return null;

  const testHash = hashPassword(password, user.salt);
  if (testHash !== user.passwordHash) return null;

  user.lastLogin = new Date().toISOString();
  writeUsersFile(users);

  return sanitizeUser(user);
}

/**
 * Registers / Creates a new user in the system (Admin feature or registration)
 */
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
  teamMemberId?: string;
  avatarColor?: string;
  permissions?: DashboardPermission[];
}): Promise<IUser> {
  const cleanEmail = data.email.trim().toLowerCase();
  const salt = generateSalt();
  const passwordHash = hashPassword(data.password, salt);
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
  const avatarColor =
    data.avatarColor || colors[Math.floor(Math.random() * colors.length)];
  const now = new Date();

  // Check if user already exists
  const existingUsers = ensureUsersFile();
  if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error(`A user with email "${cleanEmail}" already exists.`);
  }

  // Save to MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const existsInMongo = await User.findOne({ email: cleanEmail });
      if (existsInMongo) {
        throw new Error(`A user with email "${cleanEmail}" already exists.`);
      }

      const newDoc = new User({
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash,
        salt,
        role: data.role || "sales_rep",
        permissions: data.permissions || DEFAULT_MEMBER_PERMISSIONS,
        phone: data.phone?.trim() || null,
        teamMemberId: data.teamMemberId || null,
        avatarColor,
        active: true,
      });

      await newDoc.save();
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        throw err;
      }
      console.warn("MongoDB user create error, saving to local store:", err);
    }
  }

  // Save to local file
  const newStoredUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    email: cleanEmail,
    passwordHash,
    salt,
    role: data.role || "sales_rep",
    permissions: data.permissions || [...DEFAULT_MEMBER_PERMISSIONS],
    teamMemberId: data.teamMemberId || null,
    avatarColor,
    phone: data.phone?.trim() || null,
    active: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  existingUsers.push(newStoredUser);
  writeUsersFile(existingUsers);

  return sanitizeUser(newStoredUser);
}

export async function updateUserPermissions(
  id: string,
  permissions: DashboardPermission[],
): Promise<IUser | null> {
  const cleanPermissions = [...new Set(permissions)].filter((permission) =>
    DASHBOARD_PERMISSIONS.includes(permission),
  );

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await User.findByIdAndUpdate(
        id,
        { permissions: cleanPermissions },
        { new: true },
      );
      if (doc) return sanitizeUser(doc);
    } catch (err) {
      console.warn("MongoDB permission update fallback:", err);
    }
  }

  const users = ensureUsersFile();
  const user = users.find((item) => item.id === id);
  if (!user) return null;
  user.permissions = cleanPermissions;
  user.updatedAt = new Date().toISOString();
  writeUsersFile(users);
  return sanitizeUser(user);
}

/**
 * Retrieves a user by their unique ID
 */
export async function findUserById(id: string): Promise<IUser | null> {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await User.findById(id);
      if (doc) return sanitizeUser(doc);
    } catch {
      // fallback
    }
  }

  const users = ensureUsersFile();
  const found = users.find((u) => u.id === id);
  return found ? sanitizeUser(found) : null;
}

/**
 * Returns all active system users
 */
export async function listAllUsers(): Promise<IUser[]> {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await User.find({}).sort({ createdAt: -1 });
      if (docs && docs.length > 0) {
        return docs.map(sanitizeUser);
      }
    } catch (err) {
      console.warn("MongoDB list users fallback:", err);
    }
  }

  const users = ensureUsersFile();
  return users.map(sanitizeUser);
}

/**
 * Deletes a user from the system
 */
export async function removeUser(id: string): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    try {
      await User.findByIdAndDelete(id);
    } catch {
      // fallback
    }
  }

  const users = ensureUsersFile();
  const filtered = users.filter(
    (u) => u.id !== id && u.email.toLowerCase() !== id.toLowerCase(),
  );
  if (filtered.length === users.length) return false;

  writeUsersFile(filtered);
  return true;
}
