import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  Tag,
  FileText,
} from "lucide-react";
import { ILead, LeadStatus } from "../types/index.js";
import { useToast } from "./Toast.js";
import { useAuth } from "../context/AuthContext.js";

interface EditLeadModalProps {
  lead: ILead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updated: ILead) => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}) => {
  const [formData, setFormData] = useState<Partial<ILead>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (lead) {
      setFormData({
        businessName: lead.businessName,
        category: lead.category,
        address: lead.address || "",
        city: lead.city,
        phone: lead.phone || "",
        email: lead.email || "",
        website: lead.website || "",
        instagram: lead.instagram || "",
        linkedin: lead.linkedin || "",
        facebook: lead.facebook || "",
        status: lead.status,
        notes: lead.notes || "",
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead._id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead in database");
      }

      const updatedLead = await response.json();
      onLeadUpdated(updatedLead);
      showToast("Lead details updated successfully", "success");
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      showToast("Failed to update lead. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div>
            <h3 className="text-base font-extrabold text-zinc-900">
              Edit Lead Record
            </h3>
            <p className="text-xs text-zinc-500">
              Changes will be saved directly to the database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6 space-y-4 flex-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.businessName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.category || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-semibold text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Lead Status
              </label>
              <select
                value={formData.status || "new"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as LeadStatus,
                  })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="converted">Converted</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="e.g. +1 555-0199"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@business.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.website || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.org"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
                />
              </div>
            </div>

            {/* Socials */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Instagram URL
              </label>
              <input
                type="text"
                value={formData.instagram || ""}
                onChange={(e) =>
                  setFormData({ ...formData, instagram: e.target.value })
                }
                placeholder="https://instagram.com/profile"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                LinkedIn URL
              </label>
              <input
                type="text"
                value={formData.linkedin || ""}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/company/profile"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                CRM Notes & Activity
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add notes about call discussion, follow-up date, custom requirements..."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 rounded-xl text-xs font-medium text-zinc-900 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
