import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
  Shuffle,
  ChevronDown,
  Loader2,
  Sparkles,
  Zap,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import {
  ILead,
  LeadStatus,
  LeadsResponse,
  TeamMember,
} from "../types/index.js";
import { LeadTable } from "../components/LeadTable.js";
import { LeadFilters } from "../components/LeadFilters.js";
import { Pagination } from "../components/Pagination.js";
import { ExportButton } from "../components/ExportButton.js";
import { LoadingState } from "../components/LoadingState.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { EditLeadModal } from "../components/EditLeadModal.js";
import { useToast } from "../components/Toast.js";
import { useAuth } from "../context/AuthContext.js";

interface LeadsViewProps {
  onNavigateToSearch: () => void;
  onViewLeadDetails: (id: string) => void;
  initialAssignedFilter?: string;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  onNavigateToSearch,
  onViewLeadDetails,
  initialAssignedFilter = "all",
}) => {
  const { currentUser, isAdmin } = useAuth();

  const [leadsData, setLeadsData] = useState<LeadsResponse>({
    leads: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
    availableCategories: [],
    availableCities: [],
    availableAssignees: [],
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState(initialAssignedFilter);
  const [sortBy, setSortBy] = useState<
    "createdAt" | "businessName" | "rating" | "reviewCount" | "status"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Modal State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<ILead | null>(null);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(
    null,
  );
  const [isUpdatingAssignId, setIsUpdatingAssignId] = useState<string | null>(
    null,
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  const [isAssignMenuOpen, setIsAssignMenuOpen] = useState(false);

  const { showToast } = useToast();

  // Load team members
  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setTeamMembers(data.members || []))
      .catch(() => null);
  }, []);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (cityFilter !== "all") params.append("city", cityFilter);
      if (assignedFilter !== "all") params.append("assignedTo", assignedFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to retrieve leads from database");
      }

      const data = await res.json();
      setLeadsData(data);
    } catch (err) {
      console.error("Fetch leads error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchQuery,
    statusFilter,
    categoryFilter,
    cityFilter,
    assignedFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Debounced search query
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleCityFilterChange = (val: string) => {
    setCityFilter(val);
    setCurrentPage(1);
  };

  const handleAssignedFilterChange = (val: string) => {
    setAssignedFilter(val);
    setCurrentPage(1);
  };

  const handleSortByChange = (val: any) => {
    setSortBy(val);
  };

  const handleSortOrderToggle = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.length === leadsData.leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leadsData.leads.map((l) => String(l._id)));
    }
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    setIsUpdatingStatusId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const updatedLead = await res.json();
      setLeadsData((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => (String(l._id) === id ? updatedLead : l)),
      }));

      showToast(`Status updated to ${newStatus.replace("_", " ")}`, "success");
    } catch {
      showToast("Failed to update status in database", "error");
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  // Inline lead rep assignment
  const handleAssignChange = async (leadId: string, assignedTo: string) => {
    setIsUpdatingAssignId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assignedTo || null }),
      });

      if (!res.ok) throw new Error("Failed to assign lead");

      const updatedLead = await res.json();
      setLeadsData((prev) => ({
        ...prev,
        leads: prev.leads.map((l) =>
          String(l._id) === leadId ? updatedLead : l,
        ),
      }));

      showToast(
        assignedTo
          ? `Lead assigned to ${assignedTo}`
          : "Lead returned to unassigned queue",
        "success",
      );
    } catch {
      showToast("Failed to assign lead", "error");
    } finally {
      setIsUpdatingAssignId(null);
    }
  };

  // Bulk assignment
  const handleBulkAssign = async (targetRep: string) => {
    if (selectedIds.length === 0) return;
    setIsBulkAssigning(true);
    setIsAssignMenuOpen(false);

    try {
      const res = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedIds,
          assignTo: targetRep,
          memberList: teamMembers.map((m) => m.name),
        }),
      });

      if (!res.ok) throw new Error("Failed to bulk assign leads");

      const data = await res.json();
      showToast(
        targetRep === "round_robin"
          ? `Evenly distributed ${data.updatedCount} leads across reps!`
          : targetRep === ""
            ? `Unassigned ${data.updatedCount} leads to queue`
            : `Assigned ${data.updatedCount} leads to ${targetRep}`,
        "success",
      );

      setSelectedIds([]);
      fetchLeads();
    } catch (err) {
      showToast(
        (err as Error).message || "Failed to bulk assign leads",
        "error",
      );
    } finally {
      setIsBulkAssigning(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this lead from MongoDB?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete lead");
      }

      showToast("Lead deleted from database", "success");
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchLeads();
    } catch {
      showToast("Failed to delete lead from database", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected leads from MongoDB?`,
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!res.ok) throw new Error("Bulk delete failed");

      const data = await res.json();
      showToast(`Deleted ${data.deletedCount} leads from database`, "success");
      setSelectedIds([]);
      fetchLeads();
    } catch {
      showToast("Failed to delete selected leads", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleLeadUpdated = (updated: ILead) => {
    setLeadsData((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        String(l._id) === String(updated._id) ? updated : l,
      ),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Logged in User Queue Header Banner */}
      {currentUser && (
        <div className="bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-4.5 rounded-2xl border border-indigo-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || "#6366f1" }}
            >
              {currentUser.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="text-xs font-extrabold flex items-center gap-2">
                <span>Working session: {currentUser.name}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {isAdmin ? "👑 Master Admin" : "💼 Sales Specialist"}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80">
                {isAdmin
                  ? "Manage and assign leads to team reps, monitor status updates and outreach."
                  : `Focus on completing tasks and outreach status transitions for your assigned leads.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAssignedFilter(currentUser.name);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                assignedFilter.toLowerCase() === currentUser.name.toLowerCase()
                  ? "bg-emerald-400 text-slate-950 shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>My Assigned Tasks</span>
            </button>

            <button
              onClick={() => {
                setAssignedFilter("unassigned");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assignedFilter === "unassigned"
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <span>Unassigned Pool</span>
            </button>

            {assignedFilter !== "all" && (
              <button
                onClick={() => {
                  setAssignedFilter("all");
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
              >
                View All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Saved leads
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 font-mono">
              {leadsData.total} {leadsData.total === 1 ? "record" : "records"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Your prospect records, contacts, owners, and notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Actions when selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 relative">
              {/* Bulk Assign Menu Button */}
              <div className="relative">
                <button
                  id="leads-bulk-assign-btn"
                  disabled={isBulkAssigning}
                  onClick={() => setIsAssignMenuOpen(!isAssignMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isBulkAssigning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Assign Rep ({selectedIds.length})</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isAssignMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-xl shadow-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 z-50 p-1">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Assign Selected ({selectedIds.length}) To:
                    </div>

                    <button
                      onClick={() => handleBulkAssign("round_robin")}
                      className="w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center gap-2 text-indigo-300 hover:bg-slate-800 font-semibold cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Round-Robin (Split Evenly)</span>
                    </button>

                    {teamMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleBulkAssign(m.name)}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        <span
                          className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: m.avatarColor || "#6366f1",
                          }}
                        >
                          {m.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-200">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-auto">
                          {m.role}
                        </span>
                      </button>
                    ))}

                    <button
                      onClick={() => handleBulkAssign("")}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
                    >
                      <span>Unassign (Send to Queue)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Delete Button */}
              <button
                id="leads-bulk-delete-btn"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          )}

          <ExportButton
            selectedIds={selectedIds}
            currentFilters={{
              status: statusFilter,
              category: categoryFilter,
              city: cityFilter,
              assignedTo: assignedFilter,
            }}
            totalCount={leadsData.total}
          />

          <button
            id="leads-find-more-btn"
            onClick={onNavigateToSearch}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Find More Leads</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <LeadFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusFilterChange}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryFilterChange}
        cityFilter={cityFilter}
        onCityChange={handleCityFilterChange}
        assignedFilter={assignedFilter}
        onAssignedChange={handleAssignedFilterChange}
        teamMembers={teamMembers}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder}
        onSortOrderToggle={handleSortOrderToggle}
        availableCategories={leadsData.availableCategories}
        availableCities={leadsData.availableCities}
      />

      {/* Main Table Content / Loading / Empty */}
      {isLoading ? (
        <LoadingState
          message="Loading leads from MongoDB..."
          subMessage="Fetching dynamic database records"
        />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeads} />
      ) : leadsData.leads.length > 0 ? (
        <div className="space-y-3">
          <LeadTable
            leads={leadsData.leads}
            selectedIds={selectedIds}
            teamMembers={teamMembers}
            onSelectToggle={handleSelectToggle}
            onSelectAllToggle={handleSelectAllToggle}
            onViewDetails={onViewLeadDetails}
            onEditLead={(lead) => setEditingLead(lead)}
            onDeleteLead={handleDeleteLead}
            onStatusChange={handleStatusChange}
            onAssignChange={handleAssignChange}
            isUpdatingStatusId={isUpdatingStatusId}
            isUpdatingAssignId={isUpdatingAssignId}
          />

          <Pagination
            currentPage={leadsData.page}
            totalPages={leadsData.totalPages}
            totalItems={leadsData.total}
            itemsPerPage={leadsData.limit}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      ) : (
        <EmptyState
          title={
            searchQuery ||
            statusFilter !== "all" ||
            categoryFilter !== "all" ||
            cityFilter !== "all" ||
            assignedFilter !== "all"
              ? "No matching leads in database"
              : "You don't have any saved leads yet."
          }
          description={
            searchQuery ||
            statusFilter !== "all" ||
            categoryFilter !== "all" ||
            cityFilter !== "all" ||
            assignedFilter !== "all"
              ? "Try resetting your filter parameters or search term."
              : "Search for businesses to get started."
          }
          actionLabel={
            searchQuery ||
            statusFilter !== "all" ||
            categoryFilter !== "all" ||
            cityFilter !== "all" ||
            assignedFilter !== "all"
              ? "Reset Filters"
              : "Start Business Search"
          }
          onAction={() => {
            if (
              searchQuery ||
              statusFilter !== "all" ||
              categoryFilter !== "all" ||
              cityFilter !== "all" ||
              assignedFilter !== "all"
            ) {
              setSearchQuery("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setCityFilter("all");
              setAssignedFilter("all");
            } else {
              onNavigateToSearch();
            }
          }}
          icon="folder"
        />
      )}

      {/* Edit Lead Modal */}
      <EditLeadModal
        lead={editingLead}
        isOpen={Boolean(editingLead)}
        onClose={() => setEditingLead(null)}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};
