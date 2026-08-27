import React, { useState, useEffect } from "react";
import {
  Phone,
  Globe,
  Star,
  ExternalLink,
  Instagram,
  Linkedin,
  Facebook,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  Loader2,
  Copy,
  CheckCheck,
  Building2,
  MapPin,
  Calendar,
  UserCheck,
  User,
  Check,
} from "lucide-react";
import { ILead, LeadStatus, TeamMember } from "../types/index.js";
import { formatDate } from "../lib/utils.js";
import { LeadStatusBadge } from "./LeadStatusBadge.js";
import { useToast } from "./Toast.js";

interface LeadTableProps {
  leads: ILead[];
  selectedIds: string[];
  teamMembers?: TeamMember[];
  onSelectToggle: (id: string) => void;
  onSelectAllToggle: () => void;
  onViewDetails: (id: string) => void;
  onEditLead: (lead: ILead) => void;
  onDeleteLead: (id: string) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onAssignChange?: (leadId: string, assignedTo: string) => void;
  isUpdatingStatusId?: string | null;
  isUpdatingAssignId?: string | null;
  canManageLeads?: boolean;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedIds,
  teamMembers = [],
  onSelectToggle,
  onSelectAllToggle,
  onViewDetails,
  onEditLead,
  onDeleteLead,
  onStatusChange,
  onAssignChange,
  isUpdatingStatusId,
  isUpdatingAssignId,
  canManageLeads = true,
}) => {
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<
    string | null
  >(null);
  const [activeAssignDropdownId, setActiveAssignDropdownId] = useState<
    string | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const allSelected = leads.length > 0 && selectedIds.length === leads.length;

  const handleStatusSelect = (leadId: string, status: LeadStatus) => {
    setActiveStatusDropdownId(null);
    onStatusChange(leadId, status);
  };

  const handleAssignSelect = (leadId: string, assignedTo: string) => {
    setActiveAssignDropdownId(null);
    if (onAssignChange) {
      onAssignChange(leadId, assignedTo);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cleanDomain = (url: string | null) => {
    if (!url) return "";
    try {
      return url
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0];
    } catch {
      return url;
    }
  };

  const getRepColor = (name?: string | null) => {
    if (!name) return "#94a3b8";
    const found = teamMembers.find(
      (m) => m.name.toLowerCase() === name.toLowerCase(),
    );
    return found?.avatarColor || "#6366f1";
  };

  return (
    <div className="space-y-3">
      {/* Desktop & Tablet Table View */}
      <div className="hidden lg:block bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                {canManageLeads && (
                  <th className="py-3.5 px-3.5 w-10 text-center">
                    <input
                      id="lead-table-select-all"
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAllToggle}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600"
                    />
                  </th>
                )}
                <th className="py-3.5 px-3 min-w-[200px]">Business</th>
                <th className="py-3.5 px-3 min-w-[130px]">Category</th>
                <th className="py-3.5 px-3 min-w-[140px]">City & Address</th>
                <th className="py-3.5 px-3 min-w-[150px]">Phone</th>
                <th className="py-3.5 px-3 min-w-[120px]">Website</th>
                <th className="py-3.5 px-3 min-w-[140px]">Assigned Rep</th>
                <th className="py-3.5 px-3 min-w-[130px]">CRM Status</th>
                <th className="py-3.5 px-3 min-w-[80px]">Rating</th>
                <th className="py-3.5 px-3 min-w-[100px]">Date Saved</th>
                <th className="py-3.5 px-3.5 text-right min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {leads.map((lead) => {
                const isSelected = selectedIds.includes(String(lead._id));
                const isStatusUpdating =
                  isUpdatingStatusId === String(lead._id);
                const isAssignUpdating =
                  isUpdatingAssignId === String(lead._id);

                return (
                  <tr
                    key={String(lead._id)}
                    id={`lead-row-${lead._id}`}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelected ? "bg-indigo-500/10" : ""
                    }`}
                  >
                    {/* Select Checkbox */}
                    {canManageLeads && (
                      <td className="py-3.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectToggle(String(lead._id))}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600"
                        />
                      </td>
                    )}

                    {/* Business Name & Notes Pill */}
                    <td className="py-3.5 px-3">
                      <div
                        onClick={() => onViewDetails(String(lead._id))}
                        className="font-bold text-white hover:text-indigo-400 line-clamp-1 cursor-pointer transition-colors"
                        title={lead.businessName}
                      >
                        {lead.businessName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span>{lead.source || "Database"}</span>
                        {(!lead.website || lead.priority === "high") && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[9px] font-sans font-semibold">
                            High Priority
                          </span>
                        )}
                        {lead.notes && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-sans font-semibold">
                            Notes
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700/80 line-clamp-1 max-w-[130px]">
                        {lead.category || "Business"}
                      </span>
                    </td>

                    {/* City & Address */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">
                        {lead.city}
                      </div>
                      <div
                        className="text-[11px] text-slate-400 line-clamp-1 max-w-[140px]"
                        title={lead.address || ""}
                      >
                        {lead.address || "-"}
                      </div>
                    </td>

                    {/* Phone Direct Action */}
                    <td className="py-3.5 px-3">
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            id={`call-btn-${lead._id}`}
                            title={`Call ${lead.phone}`}
                            className="inline-flex items-center gap-1.5 text-slate-200 hover:text-emerald-400 font-semibold group font-mono text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-emerald-400 text-[10px] uppercase tracking-wide">
                              Call
                            </span>
                            <span className="truncate max-w-[110px]">
                              {lead.phone}
                            </span>
                          </a>
                          <button
                            onClick={(e) =>
                              handleCopy(e, lead.phone!, `phone-${lead._id}`)
                            }
                            className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors cursor-pointer"
                            title="Copy phone"
                          >
                            {copiedId === `phone-${lead._id}` ? (
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">
                          Unlisted
                        </span>
                      )}
                    </td>

                    {/* Website */}
                    <td className="py-3.5 px-3">
                      {lead.website ? (
                        <a
                          href={
                            lead.website.startsWith("http")
                              ? lead.website
                              : `https://${lead.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium truncate max-w-[120px]"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">
                            {cleanDomain(lead.website)}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Assigned Sales Rep Column with Inline Quick-Picker */}
                    <td className="py-3.5 px-3 relative">
                      {!canManageLeads ? (
                        <span className="text-slate-400 text-[11px]">
                          {lead.assignedTo || "Unassigned"}
                        </span>
                      ) : (
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            id={`assign-rep-btn-${lead._id}`}
                            disabled={isAssignUpdating}
                            onClick={() => {
                              setActiveStatusDropdownId(null);
                              setActiveAssignDropdownId(
                                activeAssignDropdownId === String(lead._id)
                                  ? null
                                  : String(lead._id),
                              );
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700/80 bg-slate-950/60 hover:bg-slate-800 text-xs transition-colors cursor-pointer focus:outline-none"
                          >
                            {isAssignUpdating ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
                              </span>
                            ) : lead.assignedTo ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: getRepColor(
                                      lead.assignedTo,
                                    ),
                                  }}
                                >
                                  {lead.assignedTo.slice(0, 1).toUpperCase()}
                                </span>
                                <span className="font-semibold text-slate-200 truncate max-w-[85px]">
                                  {lead.assignedTo}
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400 font-medium">
                                <User className="w-3 h-3 text-slate-500" />
                                <span className="italic text-[11px]">
                                  Unassigned
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                          </button>

                          {/* Assign Dropdown Menu */}
                          {activeAssignDropdownId === String(lead._id) && (
                            <div className="origin-top-left absolute left-0 mt-1 w-44 rounded-xl shadow-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 z-50 p-1">
                              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Assign to Rep
                              </div>

                              <button
                                onClick={() =>
                                  handleAssignSelect(String(lead._id), "")
                                }
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                                  !lead.assignedTo
                                    ? "font-semibold text-white bg-slate-800/80"
                                    : "text-slate-400"
                                }`}
                              >
                                <span>Unassign (Queue)</span>
                                {!lead.assignedTo && (
                                  <Check className="w-3.5 h-3.5 text-indigo-400" />
                                )}
                              </button>

                              {teamMembers.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() =>
                                    handleAssignSelect(
                                      String(lead._id),
                                      member.name,
                                    )
                                  }
                                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                                    lead.assignedTo?.toLowerCase() ===
                                    member.name.toLowerCase()
                                      ? "font-semibold text-white bg-slate-800/80"
                                      : "text-slate-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                                      style={{
                                        backgroundColor:
                                          member.avatarColor || "#6366f1",
                                      }}
                                    >
                                      {member.name.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span>{member.name}</span>
                                  </div>
                                  {lead.assignedTo?.toLowerCase() ===
                                    member.name.toLowerCase() && (
                                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3 relative">
                      <div className="relative inline-block text-left">
                        {canManageLeads && (
                          <button
                            type="button"
                            id={`status-select-btn-${lead._id}`}
                            disabled={isStatusUpdating}
                            onClick={() => {
                              setActiveAssignDropdownId(null);
                              setActiveStatusDropdownId(
                                activeStatusDropdownId === String(lead._id)
                                  ? null
                                  : String(lead._id),
                              );
                            }}
                            className="inline-flex items-center gap-1 group cursor-pointer focus:outline-none"
                          >
                            {isStatusUpdating ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Updating...</span>
                              </span>
                            ) : (
                              <>
                                <LeadStatusBadge
                                  status={lead.status}
                                  size="sm"
                                />
                                <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                              </>
                            )}
                          </button>
                        )}

                        {activeStatusDropdownId === String(lead._id) && (
                          <div className="origin-top-left absolute left-0 mt-1 w-36 rounded-xl shadow-xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 z-50 p-1">
                            {(
                              [
                                "new",
                                "contacted",
                                "interested",
                                "not_interested",
                                "converted",
                              ] as LeadStatus[]
                            ).map((st) => (
                              <button
                                key={st}
                                onClick={() =>
                                  handleStatusSelect(String(lead._id), st)
                                }
                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                                  lead.status === st
                                    ? "font-semibold text-white bg-slate-800/80"
                                    : "text-slate-300"
                                }`}
                              >
                                <span>
                                  {st === "new"
                                    ? "New Lead"
                                    : st === "contacted"
                                      ? "Contacted"
                                      : st === "interested"
                                        ? "Interested"
                                        : st === "not_interested"
                                          ? "Not Interested"
                                          : "Converted"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Rating & Reviews */}
                    <td className="py-3.5 px-3">
                      {lead.rating !== null && lead.rating !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-200">
                            {lead.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {canManageLeads && (
                          <button
                            id={`view-lead-btn-${lead._id}`}
                            onClick={() => onViewDetails(String(lead._id))}
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          id={`edit-lead-btn-${lead._id}`}
                          onClick={() => onEditLead(lead)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`delete-lead-btn-${lead._id}`}
                          onClick={() => onDeleteLead(String(lead._id))}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Card List */}
      <div className="lg:hidden space-y-3">
        {/* Mobile Select All Bar */}
        {canManageLeads && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/90 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAllToggle}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600"
              />
              <span>Select All Leads ({leads.length})</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {selectedIds.length} Selected
            </span>
          </div>
        )}

        {leads.map((lead) => {
          const isSelected = selectedIds.includes(String(lead._id));
          return (
            <div
              key={String(lead._id)}
              className={`p-4 rounded-2xl bg-slate-900/90 border transition-all space-y-3 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                  : "border-slate-800/90"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {canManageLeads && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(String(lead._id))}
                      className="mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 cursor-pointer accent-indigo-600"
                    />
                  )}
                  <div className="min-w-0">
                    <h4
                      onClick={() => onViewDetails(String(lead._id))}
                      className="text-sm font-bold text-white leading-snug truncate cursor-pointer hover:text-indigo-300"
                    >
                      {lead.businessName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                        {lead.category || "Business"}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {lead.city}
                      </span>
                      {(!lead.website || lead.priority === "high") && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/15 text-rose-300 rounded-full border border-rose-500/30">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <LeadStatusBadge status={lead.status} size="sm" />
                  {lead.assignedTo && (
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Rep: {lead.assignedTo}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact info quick links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    title={`Call ${lead.phone}`}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 text-slate-200 font-semibold font-mono text-xs hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 text-[10px] uppercase tracking-wide">
                      Call
                    </span>
                    <span className="truncate">{lead.phone}</span>
                  </a>
                ) : (
                  <div className="p-2 text-slate-500 italic text-[11px]">
                    No phone listed
                  </div>
                )}

                {lead.website ? (
                  <a
                    href={
                      lead.website.startsWith("http")
                        ? lead.website
                        : `https://${lead.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 text-indigo-400 font-medium hover:bg-indigo-500/15 transition-colors truncate"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {cleanDomain(lead.website)}
                    </span>
                  </a>
                ) : null}
              </div>

              {/* Mobile Card Action Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatDate(lead.createdAt)}
                </span>

                <div className="flex items-center gap-1.5">
                  {canManageLeads && (
                    <button
                      onClick={() => onViewDetails(String(lead._id))}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Dossier</span>
                    </button>
                  )}

                  {canManageLeads && (
                    <button
                      onClick={() => onEditLead(lead)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteLead(String(lead._id))}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
