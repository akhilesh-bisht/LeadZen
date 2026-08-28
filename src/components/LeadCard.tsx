import React, { useState } from 'react';
import {
  Phone,
  Globe,
  MapPin,
  Star,
  ExternalLink,
  Instagram,
  Linkedin,
  Facebook,
  Check,
  BookmarkPlus,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { LeadSearchResult } from '../types/index.js';
import { LeadStatusBadge } from './LeadStatusBadge.js';

interface LeadCardProps {
  lead: LeadSearchResult;
  onSave?: (lead: LeadSearchResult) => void;
  isSaving?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onSave, isSaving }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const cleanDomain = (url: string | null) => {
    if (!url) return '';
    try {
      return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    } catch {
      return url;
    }
  };

  return (
    <div
      id={`lead-card-${lead.externalId || lead.businessName.replace(/\s+/g, '-').toLowerCase()}`}
      className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between group"
    >
      <div>
        {/* Header with Name & Category */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 rounded-md border border-indigo-500/30">
                {lead.category || 'Business'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {lead.source}
              </span>
            </div>
            <h4
              className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1 group-hover:text-indigo-300 transition-colors"
              title={lead.businessName}
            >
              {lead.businessName}
            </h4>
          </div>

          {lead.isSaved && (
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </div>
          )}
        </div>

        {/* Rating if available */}
        {lead.rating !== null && lead.rating !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{lead.rating.toFixed(1)}</span>
            </div>
            {lead.reviewCount !== null && (
              <span className="text-[11px] text-slate-500">({lead.reviewCount} verified reviews)</span>
            )}
          </div>
        )}

        {/* Address & City */}
        <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed text-slate-300">
            {lead.address ? `${lead.address}, ${lead.city}` : lead.city}
          </span>
        </div>

        {/* Contact Info List */}
        <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3 mb-3">
          {/* Phone with direct click + copy button */}
          {lead.phone ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-2 text-slate-200 font-semibold hover:text-emerald-400 truncate transition-colors"
                title="Direct call"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs">{lead.phone}</span>
              </a>
              <button
                onClick={(e) => handleCopyPhone(e, lead.phone!)}
                className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Copy phone number"
              >
                {copiedPhone ? (
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 text-[11px] italic px-1">
              <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Phone unlisted in public record</span>
            </div>
          )}

          {/* Website */}
          {lead.website && (
            <div className="flex items-center justify-between gap-2 px-1">
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium truncate group/link"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{cleanDomain(lead.website)}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
              </a>
            </div>
          )}

          {/* Social Icons & Maps */}
          <div className="flex items-center gap-2.5 pt-1 px-1">
            {lead.instagram && (
              <a
                href={lead.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:text-pink-300 transition-colors"
                title="Instagram Profile"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            )}

            {lead.linkedin && (
              <a
                href={lead.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}

            {lead.facebook && (
              <a
                href={lead.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Facebook Page"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Google Maps Link with Full Business Card Search */}
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
              className="text-xs text-slate-400 hover:text-indigo-300 ml-auto font-medium inline-flex items-center gap-1"
              title="Open full business place details on Google Maps"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        {lead.isSaved ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <LeadStatusBadge status={lead.savedStatus || 'new'} size="sm" />
          </div>
        ) : (
          <button
            id={`save-lead-btn-${lead.externalId || 'single'}`}
            type="button"
            disabled={isSaving}
            onClick={() => onSave && onSave(lead)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-200" />
            <span>Save to Database</span>
          </button>
        )}
      </div>
    </div>
  );
};
