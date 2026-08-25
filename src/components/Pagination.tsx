import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return (
      <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-500 border-t border-zinc-200">
        <span>Showing all {totalItems} {totalItems === 1 ? 'lead' : 'leads'}</span>
        <span className="font-mono text-zinc-400">Page 1 of 1</span>
      </div>
    );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 bg-zinc-50/50">
      <div className="text-xs text-zinc-500">
        Showing <span className="font-bold text-zinc-800">{totalItems > 0 ? startItem : 0}</span> to{' '}
        <span className="font-bold text-zinc-800">{endItem}</span> of{' '}
        <span className="font-bold text-zinc-800">{totalItems}</span> leads
      </div>

      <div className="flex items-center gap-2">
        <button
          id="pagination-prev-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1 text-xs font-bold text-zinc-600 font-mono">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          id="pagination-next-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
