import { ILead } from '../types/index.js';

export function formatDate(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return String(dateVal);
  }
}

export function formatDateTime(dateVal: string | Date | undefined | null): string {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateVal);
  }
}

export function getStatusDetails(status: string) {
  switch (status) {
    case 'new':
      return {
        label: 'New Lead',
        bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dot: 'bg-sky-400',
      };
    case 'contacted':
      return {
        label: 'Contacted',
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'interested':
      return {
        label: 'Interested',
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'not_interested':
      return {
        label: 'Not Interested',
        bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-400',
      };
    case 'converted':
      return {
        label: 'Converted',
        bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        dot: 'bg-indigo-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-800 text-slate-300 border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

export function cleanUrl(url?: string | null): string | null {
  if (!url) return null;
  let trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

export function formatLeadForExcel(lead: ILead) {
  return {
    'Business Name': lead.businessName,
    Category: lead.category || '',
    'Assigned Rep': lead.assignedTo || 'Unassigned',
    Address: lead.address || '',
    City: lead.city || '',
    Phone: lead.phone || '',
    Email: lead.email || '',
    Website: lead.website || '',
    Instagram: lead.instagram || '',
    LinkedIn: lead.linkedin || '',
    Facebook: lead.facebook || '',
    'Google Maps URL': lead.googleMapsUrl || '',
    Rating: lead.rating !== null && lead.rating !== undefined ? lead.rating : '',
    'Review Count': lead.reviewCount !== null && lead.reviewCount !== undefined ? lead.reviewCount : '',
    Status: lead.status || 'new',
    Notes: lead.notes || '',
    Source: lead.source || '',
    'Assigned At': lead.assignedAt ? formatDate(lead.assignedAt) : '',
    'Created At': formatDate(lead.createdAt),
    'Updated At': formatDate(lead.updatedAt),
  };
}
