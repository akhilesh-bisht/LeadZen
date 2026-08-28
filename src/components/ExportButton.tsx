import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useToast } from './Toast.js';

interface FilterParams {
  status?: string;
  category?: string;
  city?: string;
  assignedTo?: string;
}

interface ExportButtonProps {
  selectedIds?: string[];
  currentFilters?: FilterParams;
  totalCount?: number;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  selectedIds = [],
  currentFilters = {} as FilterParams,
  totalCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: 'all' | 'filtered' | 'selected') => {
    setIsOpen(false);
    setIsExporting(true);

    try {
      let url = '/api/export';
      const params = new URLSearchParams();

      if (type === 'selected' && selectedIds.length > 0) {
        params.append('ids', selectedIds.join(','));
      } else if (type === 'filtered') {
        if (currentFilters.status && currentFilters.status !== 'all') {
          params.append('status', currentFilters.status);
        }
        if (currentFilters.category && currentFilters.category !== 'all') {
          params.append('category', currentFilters.category);
        }
        if (currentFilters.city && currentFilters.city !== 'all') {
          params.append('city', currentFilters.city);
        }
        if (currentFilters.assignedTo && currentFilters.assignedTo !== 'all') {
          params.append('assignedTo', currentFilters.assignedTo);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to generate Excel file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const today = new Date().toISOString().split('T')[0];
      a.download = `leads-${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showToast(`Exported real leads to ${a.download}`, 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Excel export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const hasSelected = selectedIds.length > 0;
  const hasFilters = Boolean(
    (currentFilters.status && currentFilters.status !== 'all') ||
      (currentFilters.category && currentFilters.category !== 'all') ||
      (currentFilters.city && currentFilters.city !== 'all')
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="export-excel-dropdown-btn"
        type="button"
        disabled={isExporting || totalCount === 0}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        <span>{isExporting ? 'Preparing Excel...' : 'Export Excel'}</span>
        <ChevronDown className="w-3 h-3 text-emerald-200 ml-0.5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-2xl shadow-xl bg-white border border-zinc-200 p-1.5 z-30 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="space-y-1">
            <button
              onClick={() => handleExport('all')}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Export All Leads</span>
              </div>
              <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded-md text-zinc-600 font-mono font-bold">
                {totalCount}
              </span>
            </button>

            {hasFilters && (
              <button
                onClick={() => handleExport('filtered')}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Export Filtered Leads</span>
                </div>
              </button>
            )}

            {hasSelected && (
              <button
                onClick={() => handleExport('selected')}
                className="w-full text-left px-3 py-2 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl flex items-center justify-between transition-colors font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Selected ({selectedIds.length})</span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
