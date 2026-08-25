import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  PhoneCall,
  HeartHandshake,
  UserX,
  Trophy,
  ArrowRight,
  Building2,
  MapPin,
  RefreshCw,
  Phone,
  UserCheck,
  Zap,
  TrendingUp,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { DashboardStats, ILead, LeadStatus } from "../types/index.js";
import { StatsCard } from "../components/StatsCard.js";
import { LeadStatusBadge } from "../components/LeadStatusBadge.js";
import { EmptyState } from "../components/EmptyState.js";
import { LoadingState } from "../components/LoadingState.js";
import { ErrorState } from "../components/ErrorState.js";
import { formatDate } from "../lib/utils.js";
import { useToast } from "../components/Toast.js";

interface DashboardViewProps {
  onNavigate: (view: "dashboard" | "search" | "leads" | "team") => void;
  onViewLeadDetails: (id: string) => void;
  onNavigateToLeadsWithFilter?: (assignee: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onViewLeadDetails,
  onNavigateToLeadsWithFilter,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard metrics from database");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Fetch dashboard stats error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <LoadingState
        message="Aggregating live CRM metrics..."
        subMessage="Fetching dynamic database statistics and team workload"
      />
    );
  }

  if (error || !stats) {
    return (
      <ErrorState
        message={error || "Failed to load dashboard"}
        onRetry={fetchStats}
      />
    );
  }

  const conversionRate =
    stats.total > 0
      ? ((stats.converted / stats.total) * 100).toFixed(1)
      : "0.0";

  const unassigned = stats.unassignedCount || 0;
  const assigned = stats.assignedCount || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Pipeline overview
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Keep track of new prospects, follow-ups, and wins in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="refresh-dashboard-btn"
            onClick={fetchStats}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
            title="Refresh Real Statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            id="dashboard-team-alloc-btn"
            onClick={() => onNavigate("team")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manage Team</span>
          </button>
          <button
            id="dashboard-start-prospecting-btn"
            onClick={() => onNavigate("search")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <span>Prospect Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatsCard
          title="Total Leads"
          value={stats.total}
          icon={Users}
          color="slate"
          subtitle="In your pipeline"
          onClick={() => onNavigate("leads")}
        />
        <StatsCard
          title="New Leads"
          value={stats.new}
          icon={UserPlus}
          color="sky"
          subtitle="Awaiting Contact"
        />
        <StatsCard
          title="Contacted"
          value={stats.contacted}
          icon={PhoneCall}
          color="amber"
          subtitle="Outreach Done"
        />
        <StatsCard
          title="Interested"
          value={stats.interested}
          icon={HeartHandshake}
          color="emerald"
          subtitle="Hot Prospects"
        />
        <StatsCard
          title="Not Interested"
          value={stats.not_interested}
          icon={UserX}
          color="rose"
          subtitle="Disqualified"
        />
        <StatsCard
          title="Converted"
          value={stats.converted}
          icon={Trophy}
          color="indigo"
          subtitle={`${conversionRate}% Win Rate`}
        />
      </div>

      {/* Team Allocation & Workload Overview Bento Box */}
      {stats.teamWorkload && stats.teamWorkload.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Sales Team Lead Allocation
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active team workload, assigned volume, and deal progression
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                ⏳ {unassigned} Unassigned in Queue
              </span>
              <button
                onClick={() => onNavigate("team")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Allocate / Distribute</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Rep Workload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {stats.teamWorkload.map((workload) => (
              <div
                key={workload.memberId}
                onClick={() => {
                  if (onNavigateToLeadsWithFilter) {
                    onNavigateToLeadsWithFilter(workload.memberName);
                  } else {
                    onNavigate("leads");
                  }
                }}
                className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {workload.memberName.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white text-xs truncate group-hover:text-indigo-300">
                        {workload.memberName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {workload.totalAssigned} assigned
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                    {workload.converted} Won
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-500 h-full"
                      style={{
                        width:
                          workload.totalAssigned > 0
                            ? `${(workload.uncontacted / workload.totalAssigned) * 100}%`
                            : "0%",
                      }}
                      title={`${workload.uncontacted} New`}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{
                        width:
                          workload.totalAssigned > 0
                            ? `${(workload.contacted / workload.totalAssigned) * 100}%`
                            : "0%",
                      }}
                      title={`${workload.contacted} Contacted`}
                    />
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width:
                          workload.totalAssigned > 0
                            ? `${(workload.interested / workload.totalAssigned) * 100}%`
                            : "0%",
                      }}
                      title={`${workload.interested} Interested`}
                    />
                    <div
                      className="bg-indigo-500 h-full"
                      style={{
                        width:
                          workload.totalAssigned > 0
                            ? `${(workload.converted / workload.totalAssigned) * 100}%`
                            : "0%",
                      }}
                      title={`${workload.converted} Converted`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-medium">
                    <span className="text-sky-400">
                      {workload.uncontacted} New
                    </span>
                    <span className="text-amber-400">
                      {workload.contacted} Contacted
                    </span>
                    <span className="text-emerald-400">
                      {workload.interested} Interested
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Breakdown & Top Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pipeline Bar */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">
              Lead Pipeline Breakdown
            </h3>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {conversionRate}% Won
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: "New Leads", count: stats.new, color: "bg-slate-500" },
              {
                label: "Contacted",
                count: stats.contacted,
                color: "bg-amber-500",
              },
              {
                label: "Interested",
                count: stats.interested,
                color: "bg-emerald-500",
              },
              {
                label: "Not Interested",
                count: stats.not_interested,
                color: "bg-rose-500",
              },
              {
                label: "Converted",
                count: stats.converted,
                color: "bg-indigo-500",
              },
            ].map((item) => {
              const pct =
                stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-slate-200">
                      {item.count}{" "}
                      <span className="text-slate-500 font-normal font-mono text-[10px]">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Top Prospect Categories
            </h3>
          </div>
          {stats.categoriesCount.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {stats.categoriesCount.map((item) => (
                <div
                  key={item.category}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-300 truncate">
                    {item.category}
                  </span>
                  <span className="font-semibold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/80 font-mono text-[11px]">
                    {item.count} {item.count === 1 ? "lead" : "leads"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No categories saved yet.
            </p>
          )}
        </div>

        {/* Top Cities */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Geographic Distribution
            </h3>
          </div>
          {stats.citiesCount.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {stats.citiesCount.map((item) => (
                <div
                  key={item.city}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-300 truncate">
                    {item.city}
                  </span>
                  <span className="font-semibold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700/80 font-mono text-[11px]">
                    {item.count} {item.count === 1 ? "lead" : "leads"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No geographic data saved yet.
            </p>
          )}
        </div>
      </div>

      {/* Recent Real Leads Section */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Recent Saved Leads
            </h3>
            <p className="text-xs text-slate-400">
              Most recently stored records in your database
            </p>
          </div>
          {stats.total > 0 && (
            <button
              onClick={() => onNavigate("leads")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All {stats.total} Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {stats.recentLeads && stats.recentLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Business</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Assigned Rep</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recentLeads.map((lead) => (
                  <tr
                    key={String(lead._id)}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 font-semibold text-slate-100">
                      {lead.businessName}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80 text-[10px] font-medium">
                        {lead.category}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{lead.city}</td>
                    <td className="py-3">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-slate-200 hover:text-emerald-400 font-semibold font-mono text-xs inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">
                          Unlisted
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {lead.assignedTo ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
                          {lead.assignedTo}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <LeadStatusBadge status={lead.status} size="sm" />
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onViewLeadDetails(String(lead._id))}
                        className="px-2.5 py-1 text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="You don't have any saved leads yet"
            description="Search for real businesses and save them to your database to start tracking prospects and analytics."
            actionLabel="Start Business Search"
            onAction={() => onNavigate("search")}
            icon="search"
          />
        )}
      </div>
    </div>
  );
};
