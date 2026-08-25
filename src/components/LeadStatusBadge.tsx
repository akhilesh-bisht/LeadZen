import React from 'react';
import { getStatusDetails } from '../lib/utils.js';
import { LeadStatus } from '../types/index.js';

interface LeadStatusBadgeProps {
  status: LeadStatus | string;
  size?: 'sm' | 'md';
}

export const LeadStatusBadge: React.FC<LeadStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const details = getStatusDetails(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${details.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${details.dot}`} />
      {details.label}
    </span>
  );
};
