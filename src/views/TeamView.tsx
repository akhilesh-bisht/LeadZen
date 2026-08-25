import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  Zap,
  ArrowRight,
  Shuffle,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Loader2,
  RefreshCw,
  Clock,
  Briefcase,
  Flame,
  Plus,
  X,
  Shield,
  Key,
  Lock,
  User,
  Sparkles,
} from "lucide-react";
import {
  TeamMember,
  TeamWorkloadStats,
  DashboardStats,
  IUser,
  UserRole,
} from "../types/index.js";
import { LoadingState } from "../components/LoadingState.js";
import { ErrorState } from "../components/ErrorState.js";
import { useToast } from "../components/Toast.js";
import { useAuth } from "../context/AuthContext.js";

interface TeamViewProps {
  onNavigateToLeadsWithFilter: (assignee: string) => void;
  onNavigateToSearch: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  onNavigateToLeadsWithFilter,
  onNavigateToSearch,
}) => {
  const { currentUser, isAdmin, registerUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"roster" | "accounts">("roster");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [userAccounts, setUserAccounts] = useState<IUser[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto assign state
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTargetRep, setSelectedTargetRep] =
    useState<string>("round_robin");
  const [leadCountToAssign, setLeadCountToAssign] = useState<number | "all">(
    "all",
  );

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Outreach Specialist");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Add User Account Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserAccountName, setNewUserAccountName] = useState("");
  const [newUserAccountEmail, setNewUserAccountEmail] = useState("");
  const [newUserAccountPassword, setNewUserAccountPassword] = useState("");
  const [newUserAccountRole, setNewUserAccountRole] =
    useState<UserRole>("sales_rep");
  const [newUserAccountPhone, setNewUserAccountPhone] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { showToast } = useToast();

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teamRes, statsRes, usersRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/dashboard/stats"),
        fetch("/api/auth/users"),
      ]);

      if (!teamRes.ok || !statsRes.ok) {
        throw new Error("Failed to load team and workload statistics");
      }

      const teamData = await teamRes.json();
      const statsData = await statsRes.json();
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] };

      setMembers(teamData.members || []);
      setStats(statsData);
      setUserAccounts(usersData.users || []);
    } catch (err) {
      console.error("Load team error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Quick Auto-Assign Unassigned Leads
  const handleAutoAssign = async () => {
    if (!stats || stats.unassignedCount === 0) {
      showToast("No unassigned leads found in the queue", "info");
      return;
    }

    setIsAssigning(true);
    try {
      const limit =
        leadCountToAssign === "all" ? 100 : Number(leadCountToAssign);
      const leadsRes = await fetch(
        `/api/leads?assignedTo=unassigned&limit=${limit}`,
      );
      if (!leadsRes.ok) throw new Error("Failed to retrieve unassigned leads");

      const leadsData = await leadsRes.json();
      const leadIds = leadsData.leads.map((l: any) => String(l._id));

      if (leadIds.length === 0) {
        showToast("No unassigned leads found to allocate", "info");
        return;
      }

      const assignRes = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds,
          assignTo: selectedTargetRep,
          memberList: members.filter((m) => m.active).map((m) => m.name),
        }),
      });

      if (!assignRes.ok) throw new Error("Failed to assign leads");

      const assignData = await assignRes.json();
      showToast(
        selectedTargetRep === "round_robin"
          ? `Distributed ${assignData.updatedCount} leads evenly across active team reps!`
          : `Assigned ${assignData.updatedCount} leads to ${selectedTargetRep}!`,
        "success",
      );

      loadAllData();
    } catch (err) {
      console.error("Auto assign error:", err);
      showToast(
        (err as Error).message || "Failed to auto-assign leads",
        "error",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  // Add new team member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showToast("Member name is required", "error");
      return;
    }

    setIsAddingMember(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName.trim(),
          role: newMemberRole.trim() || "Sales Specialist",
          email: newMemberEmail.trim(),
          phone: newMemberPhone.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add team member");

      showToast(`Added ${newMemberName} to sales team`, "success");
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPhone("");
      setIsAddMemberModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast((err as Error).message || "Error adding team member", "error");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Create new User Login Account
  const handleCreateUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUserAccountName.trim() ||
      !newUserAccountEmail.trim() ||
      !newUserAccountPassword.trim()
    ) {
      showToast("Name, email, and password are required", "error");
      return;
    }

    setIsCreatingUser(true);
    try {
      const result = await registerUser({
        name: newUserAccountName.trim(),
        email: newUserAccountEmail.trim(),
        password: newUserAccountPassword,
        role: newUserAccountRole,
        phone: newUserAccountPhone.trim(),
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to create user account");
      }

      // Also ensure member exists in team roster
      const existsInTeam = members.some(
        (m) => m.name.toLowerCase() === newUserAccountName.trim().toLowerCase(),
      );
      if (!existsInTeam && newUserAccountRole === "sales_rep") {
        await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newUserAccountName.trim(),
            role: "Sales Representative",
            email: newUserAccountEmail.trim(),
            phone: newUserAccountPhone.trim(),
          }),
        });
      }

      showToast(
        `Account created for ${newUserAccountName}! They can now log in.`,
        "success",
      );
      setNewUserAccountName("");
      setNewUserAccountEmail("");
      setNewUserAccountPassword("");
      setNewUserAccountPhone("");
      setIsAddUserModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast(
        (err as Error).message || "Error creating user account",
        "error",
      );
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Delete team member
  const handleDeleteMember = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Remove ${name} from team? Existing leads will keep their record.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team member");

      showToast(`Removed ${name} from team`, "success");
      loadAllData();
    } catch {
      showToast("Failed to delete team member", "error");
    }
  };

  // Delete user account
  const handleDeleteUserAccount = async (
    id: string,
    name: string,
    email: string,
  ) => {
    if (email.toLowerCase() === "akhilesh@gmail.com") {
      showToast("Cannot delete master admin account", "error");
      return;
    }

    if (!window.confirm(`Delete login account for ${name} (${email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user account");

      showToast(`User account for ${name} removed`, "success");
      loadAllData();
    } catch {
      showToast("Failed to delete user account", "error");
    }
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Loading team members and user credentials..."
        subMessage="Fetching roster & workload metrics"
      />
    );
  }

  if (error || !stats) {
    return (
      <ErrorState
        message={error || "Failed to load team data"}
        onRetry={loadAllData}
      />
    );
  }

  const unassignedCount = stats.unassignedCount || 0;
  const assignedCount = stats.assignedCount || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Team Allocation & User Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage sales representatives, login user accounts, and
                round-robin lead allocation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("roster")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "roster"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sales Roster & Workload ({members.length})
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "accounts"
                  ? "bg-white text-indigo-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>User Accounts ({userAccounts.length})</span>
            </button>
          </div>

          <button
            onClick={loadAllData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh team & users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeTab === "roster" ? (
            <button
              id="team-add-member-btn"
              onClick={() => setIsAddMemberModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Rep</span>
            </button>
          ) : (
            <button
              id="team-create-user-btn"
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User Login</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "roster" ? (
        <>
          {/* Allocation Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Team */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                  Sales Reps
                </span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {members.length} Active
              </div>
              <p className="text-[11px] text-slate-500">
                In auto-distribution pool
              </p>
            </div>

            {/* Assigned Leads */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                  Assigned Leads
                </span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {assignedCount} Leads
              </div>
              <p className="text-[11px] text-slate-500">
                Currently allocated to reps
              </p>
            </div>

            {/* Unassigned Queue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                  Unassigned Queue
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {unassignedCount} Leads
              </div>
              <p className="text-[11px] text-slate-500">Ready to be assigned</p>
            </div>

            {/* Total Database Pool */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-[10px]">
                  Total Lead Pool
                </span>
                <Briefcase className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats.total} Total
              </div>
              <p className="text-[11px] text-slate-500">Stored in database</p>
            </div>
          </div>

          {/* Auto-Assignment / Lead Allocation Console */}
          <div className="bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-indigo-800/60">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Smart Lead Distributor</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Instant Auto-Assign & Round-Robin Allocation
                </h3>
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Distribute unassigned business prospects automatically. Select
                  Round-Robin to cycle leads evenly across reps (Dhananjay,
                  Harsh, Akhilesh) or assign directly to a specific specialist.
                </p>
              </div>

              {/* Controls */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-3 min-w-70 sm:min-w-85">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-indigo-200 block">
                    Assign To:
                  </label>
                  <select
                    id="team-assign-target-select"
                    value={selectedTargetRep}
                    onChange={(e) => setSelectedTargetRep(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/90 text-white border border-indigo-400/40 rounded-lg text-xs font-semibold outline-none cursor-pointer focus:border-indigo-400"
                  >
                    <option value="round_robin">
                      🔄 Round-Robin (Split Evenly Among All Reps)
                    </option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        👤 {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-indigo-200 block">
                    Quantity:
                  </label>
                  <select
                    id="team-assign-quantity-select"
                    value={leadCountToAssign}
                    onChange={(e) =>
                      setLeadCountToAssign(
                        e.target.value === "all"
                          ? "all"
                          : Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-900/90 text-white border border-indigo-400/40 rounded-lg text-xs font-semibold outline-none cursor-pointer focus:border-indigo-400"
                  >
                    <option value="all">
                      All Unassigned Leads ({unassignedCount})
                    </option>
                    <option value="5">Next 5 Leads</option>
                    <option value="10">Next 10 Leads</option>
                    <option value="25">Next 25 Leads</option>
                    <option value="50">Next 50 Leads</option>
                  </select>
                </div>

                <button
                  id="team-execute-assign-btn"
                  onClick={handleAutoAssign}
                  disabled={isAssigning || unassignedCount === 0}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Allocating Leads...</span>
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>
                        {unassignedCount === 0
                          ? "Queue is Empty (0 Leads)"
                          : `Assign Leads (${leadCountToAssign === "all" ? unassignedCount : leadCountToAssign})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Team member workload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Active Sales Representatives
                </h3>
                <p className="text-xs text-slate-500">
                  Workload and conversion breakdown by member
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const workload = stats.teamWorkload?.find(
                  (w) =>
                    w.memberName.toLowerCase() === member.name.toLowerCase(),
                ) || {
                  totalAssigned: 0,
                  contacted: 0,
                  interested: 0,
                  converted: 0,
                  uncontacted: 0,
                };

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:border-indigo-300 transition-all"
                  >
                    {/* Rep Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-xs"
                          style={{
                            backgroundColor: member.avatarColor || "#6366f1",
                          }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {member.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleDeleteMember(member.id, member.name)
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Rep"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Contact info pills */}
                    <div className="space-y-1 text-xs text-slate-600">
                      {member.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Workload Stats Box */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">
                          Total Leads Assigned
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm">
                          {workload.totalAssigned}
                        </span>
                      </div>

                      {/* Progress / Status Breakdown */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-sky-50 text-sky-800 font-bold border border-sky-100">
                          <div className="text-xs">{workload.uncontacted}</div>
                          <div className="text-[9px] text-sky-600">New</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-100">
                          <div className="text-xs">{workload.contacted}</div>
                          <div className="text-[9px] text-amber-600">
                            Contacted
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                          <div className="text-xs">{workload.interested}</div>
                          <div className="text-[9px] text-emerald-600">
                            Interested
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-100">
                          <div className="text-xs">{workload.converted}</div>
                          <div className="text-[9px] text-indigo-600">Won</div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Action: Filter leads for this rep */}
                    <button
                      onClick={() => onNavigateToLeadsWithFilter(member.name)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View {member.name}'s Leads</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* User Accounts & Login Credentials Tab */
        <div className="space-y-5">
          {/* Header Description */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>System User Accounts & Login Credentials</span>
              </h3>
              <p className="text-xs text-slate-500">
                You can create new email and password credentials for team
                members so they can log in, view their assigned leads, and
                complete sales outreach tasks.
              </p>
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User Account</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userAccounts.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: user.avatarColor || "#6366f1",
                            }}
                          >
                            {user.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-900">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {user.role === "admin" ? "👑 Admin" : "💼 Sales Rep"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {user.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {user.email.toLowerCase() !== "akhilesh@gmail.com" ? (
                          <button
                            onClick={() =>
                              handleDeleteUserAccount(
                                user.id,
                                user.name,
                                user.email,
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            Master Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Add Sales Representative</span>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhananjay or Harsh"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Outreach Specialist"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. rep@company.sales"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 234-8901"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isAddingMember ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Account Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Key className="w-5 h-5 text-indigo-600" />
                <span>Create User Login Credentials</span>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateUserAccount}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanka Verma"
                    value={newUserAccountName}
                    onChange={(e) => setNewUserAccountName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Email Address (Login) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. priyanka@company.com"
                    value={newUserAccountEmail}
                    onChange={(e) => setNewUserAccountEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Set user password"
                    value={newUserAccountPassword}
                    onChange={(e) => setNewUserAccountPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl outline-none font-medium text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    System Role
                  </label>
                  <select
                    value={newUserAccountRole}
                    onChange={(e) =>
                      setNewUserAccountRole(e.target.value as UserRole)
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl font-medium text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="sales_rep">💼 Sales Rep</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={newUserAccountPhone}
                    onChange={(e) => setNewUserAccountPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl font-medium text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreatingUser ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
