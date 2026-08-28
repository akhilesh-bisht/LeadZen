import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  ExternalLink,
  Instagram,
  Linkedin,
  Facebook,
  Trash2,
  Edit,
  Save,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  FileText,
  UserCheck,
  User,
  Clock,
} from "lucide-react";
import { ILead, LeadStatus, TeamMember } from "../types/index.js";
import { formatDate, formatDateTime } from "../lib/utils.js";
import { LeadStatusBadge } from "../components/LeadStatusBadge.js";
import { LoadingState } from "../components/LoadingState.js";
import { ErrorState } from "../components/ErrorState.js";
import { EditLeadModal } from "../components/EditLeadModal.js";
import { useToast } from "../components/Toast.js";
import { useAuth } from "../context/AuthContext.js";

interface LeadDetailsViewProps {
  leadId: string;
  onBack: () => void;
  onLeadDeleted: () => void;
}

export const LeadDetailsView: React.FC<LeadDetailsViewProps> = ({
  leadId,
  onBack,
  onLeadDeleted,
}) => {
  const [lead, setLead] = useState<ILead | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedTime, setNotesSavedTime] = useState<string | null>(null);

  // Status state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);

  // Enrichment state
  const [isEnriching, setIsEnriching] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { showToast } = useToast();
  const { isAdmin, token } = useAuth();

  const fetchLeadDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadRes, teamRes] = await Promise.all([
        fetch(`/api/leads/${leadId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch("/api/team"),
      ]);

      if (!leadRes.ok) {
        throw new Error("Lead not found in database");
      }
      const data = await leadRes.json();
      const teamData = await teamRes.json().catch(() => ({ members: [] }));

      setLead(data);
      setNotes(data.notes || "");
      setTeamMembers(teamData.members || []);
    } catch (err) {
      console.error("Fetch lead details error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId, token]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Status update failed");
      const updated = await res.json();
      setLead(updated);
      showToast(`Status updated to ${newStatus}`, "success");
    } catch {
      showToast("Failed to update status in MongoDB", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssigneeChange = async (repName: string) => {
    if (!lead) return;
    setIsUpdatingAssignee(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedTo: repName || null }),
      });

      if (!res.ok) throw new Error("Rep assignment update failed");
      const updated = await res.json();
      setLead(updated);
      showToast(
        repName
          ? `Assigned to ${repName}`
          : "Lead returned to unassigned queue",
        "success",
      );
    } catch {
      showToast("Failed to update assigned rep in MongoDB", "error");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!lead) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error("Failed to save notes");
      const updated = await res.json();
      setLead(updated);
      setNotesSavedTime(new Date().toLocaleTimeString());
      showToast("CRM notes saved to MongoDB", "success");
    } catch {
      showToast("Failed to save notes to database", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleEnrichProfiles = async () => {
    if (!lead) return;
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/leads/${lead._id}/enrich`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Enrichment failed");
      const data = await res.json();
      if (data.updatedLead) {
        setLead(data.updatedLead);
      }
      showToast("Public social profiles lookup completed", "success");
    } catch {
      showToast("Social profile lookup could not find public links", "info");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    if (
      !window.confirm(`Permanently delete "${lead.businessName}" from MongoDB?`)
    )
      return;

    try {
      const res = await fetch(`/api/leads/${lead._id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Lead deleted from database", "success");
      onLeadDeleted();
    } catch {
      showToast("Failed to delete lead from MongoDB", "error");
    }
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Fetching lead details from MongoDB..."
        subMessage="Loading stored record attributes"
      />
    );
  }

  if (error || !lead) {
    return (
      <ErrorState
        message={error || "Lead not found"}
        onRetry={fetchLeadDetails}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          id="lead-details-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              id="lead-details-edit-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Record</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="lead-details-delete-btn"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Lead Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-full border border-slate-200">
                {lead.category || "General Business"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Source: {lead.source}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {lead.businessName}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {lead.address ? `${lead.address}, ${lead.city}` : lead.city}
              </span>
            </div>

            {lead.rating !== null && lead.rating !== undefined && (
              <div className="flex items-center gap-2 text-xs text-slate-700 pt-1">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                  <span>{lead.rating.toFixed(1)}</span>
                </div>
                {lead.reviewCount !== null && (
                  <span className="text-slate-400 font-medium">
                    ({lead.reviewCount} verified reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Card: Status & Team Assignee Controls */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[260px]">
            {/* Rep Assignment Control */}
            {isAdmin && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Assigned Representative</span>
                  </span>
                  {isUpdatingAssignee && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  )}
                </div>

                <select
                  id="lead-details-assign-select"
                  value={lead.assignedTo || ""}
                  disabled={isUpdatingAssignee}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer focus:border-indigo-600"
                >
                  <option value="">⏳ Unassigned (Queue)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.name}>
                      👤 {m.name} ({m.role})
                    </option>
                  ))}
                </select>

                {lead.assignedAt && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Assigned on: {formatDateTime(lead.assignedAt)}
                  </div>
                )}
              </div>
            )}

            {/* Status Selector Card */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  CRM Status
                </span>
                {isUpdatingStatus && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                )}
              </div>

              <select
                id="lead-details-status-select"
                value={lead.status}
                disabled={isUpdatingStatus}
                onChange={(e) =>
                  handleStatusChange(e.target.value as LeadStatus)
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer focus:border-indigo-600"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Current:</span>
                <LeadStatusBadge status={lead.status} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100">
          {/* Call button */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phone Call
              </div>
              {lead.phone ? (
                <a
                  href={`tel:${lead.phone}`}
                  id="lead-call-anchor"
                  className="text-xs font-bold text-slate-900 hover:text-emerald-600 font-mono block truncate mt-0.5 transition-colors"
                >
                  {lead.phone}
                </a>
              ) : (
                <div className="text-xs text-slate-400 italic mt-0.5">
                  Phone unlisted
                </div>
              )}
            </div>
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Call phone number"
              >
                <Phone className="w-4 h-4" />
              </a>
            ) : (
              <div className="p-2 bg-slate-200 text-slate-400 rounded-xl shrink-0">
                <Phone className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Email button */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </div>
              {lead.email ? (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-xs font-bold text-slate-900 hover:text-indigo-600 block truncate mt-0.5 transition-colors"
                >
                  {lead.email}
                </a>
              ) : (
                <div className="text-xs text-slate-400 italic mt-0.5">
                  Email unlisted
                </div>
              )}
            </div>
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Send email"
              >
                <Mail className="w-4 h-4" />
              </a>
            ) : (
              <div className="p-2 bg-slate-200 text-slate-400 rounded-xl shrink-0">
                <Mail className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Website / Maps button */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Web & Location
              </div>
              {lead.website ? (
                <a
                  href={
                    lead.website.startsWith("http")
                      ? lead.website
                      : `https://${lead.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-slate-900 hover:text-indigo-600 block truncate mt-0.5 transition-colors"
                >
                  {lead.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <a
                  href={
                    lead.googleMapsUrl &&
                    lead.googleMapsUrl.includes("query=") &&
                    !lead.googleMapsUrl.match(/query=-?\d+(\.\d+)?,/)
                      ? lead.googleMapsUrl
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [lead.businessName, lead.address, lead.city]
                            .filter(Boolean)
                            .join(", "),
                        )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-slate-700 hover:underline block truncate mt-0.5"
                >
                  View on Google Maps
                </a>
              )}
            </div>
            {lead.website ? (
              <a
                href={
                  lead.website.startsWith("http")
                    ? lead.website
                    : `https://${lead.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Visit website"
              >
                <Globe className="w-4 h-4" />
              </a>
            ) : (
              <a
                href={
                  lead.googleMapsUrl &&
                  lead.googleMapsUrl.includes("query=") &&
                  !lead.googleMapsUrl.match(/query=-?\d+(\.\d+)?,/)
                    ? lead.googleMapsUrl
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [lead.businessName, lead.address, lead.city]
                          .filter(Boolean)
                          .join(", "),
                      )}`
                }
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                title="Open Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Grid: CRM Notes + Business Metadata & Socials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CRM Notes & Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                CRM Notes & Activity
              </h3>
            </div>
            {notesSavedTime && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved at {notesSavedTime}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Keep persistent notes regarding outreach conversations,
            requirements, follow-ups, and deal progress.
          </p>

          {isAdmin && (
            <textarea
              id="lead-notes-textarea"
              rows={7}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type notes here... (e.g. Spoke with front desk, requested a quote proposal, follow up on Friday afternoon)"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none resize-none transition-all"
            />
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <button
                id="save-lead-notes-btn"
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSavingNotes ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Notes to Database</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Verified Socials & Record Metadata (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Social Profiles */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Public Social Profiles
              </h3>
              <button
                id="enrich-social-btn"
                disabled={isEnriching}
                onClick={handleEnrichProfiles}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isEnriching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
                <span>
                  {isEnriching ? "Enriching..." : "Discover Profiles"}
                </span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Instagram */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span className="font-semibold">Instagram</span>
                </div>
                {lead.instagram ? (
                  <a
                    href={lead.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Unlinked
                  </span>
                )}
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Linkedin className="w-4 h-4 text-sky-700" />
                  <span className="font-semibold">LinkedIn</span>
                </div>
                {lead.linkedin ? (
                  <a
                    href={lead.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Unlinked
                  </span>
                )}
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Facebook</span>
                </div>
                {lead.facebook ? (
                  <a
                    href={lead.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-900 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>View Page</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Unlinked
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Database System Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Database Record Audit
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Record ID:</span>
                <span className="font-mono text-[11px] text-slate-800 font-semibold">
                  {String(lead._id)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Rep:</span>
                <span className="font-semibold text-indigo-700">
                  {lead.assignedTo || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data Source:</span>
                <span className="font-semibold text-slate-800">
                  {lead.source}
                </span>
              </div>
              {lead.latitude !== null && lead.longitude !== null && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="font-mono text-[11px] text-slate-800">
                    {lead.latitude?.toFixed(4)}, {lead.longitude?.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {formatDateTime(lead.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Modified:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {formatDateTime(lead.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditLeadModal
        lead={lead}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onLeadUpdated={(updated) => {
          setLead(updated);
          setNotes(updated.notes || "");
        }}
      />
    </div>
  );
};
