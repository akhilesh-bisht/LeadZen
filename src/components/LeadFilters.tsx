import React from 'react';
import { Search, Filter, ArrowUpDown, X, RotateCcw, UserCheck, User } from 'lucide-react';
import { LeadStatus, TeamMember } from '../types/index.js';

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  cityFilter: string;
  onCityChange: (city: string) => void;
  assignedFilter?: string;
  onAssignedChange?: (assignee: string) => void;
  teamMembers?: TeamMember[];
  sortBy: string;
  onSortByChange: (val: any) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  availableCategories: string[];
  availableCities: string[];
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  cityFilter,
  onCityChange,
  assignedFilter = 'all',
  onAssignedChange,
  teamMembers = [],
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  availableCategories,
  availableCities,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    cityFilter !== 'all' ||
    assignedFilter !== 'all';

  const handleResetFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange('all');
    onCityChange('all');
    if (onAssignedChange) onAssignedChange('all');
  };

  return (
    <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Search text */}
        <div className="lg:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="leads-filter-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search business, phone..."
            className="w-full pl-10 pr-8 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Assigned Rep Filter */}
        {onAssignedChange && (
          <div className="lg:col-span-2">
            <select
              id="leads-filter-assigned-select"
              value={assignedFilter}
              onChange={(e) => onAssignedChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none cursor-pointer"
            >
              <option value="all">👥 All Reps & Queue</option>
              <option value="unassigned">⏳ Unassigned Leads</option>
              <option value="assigned">✅ Any Assigned Rep</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  👤 {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status filter */}
        <div className="lg:col-span-2">
          <select
            id="leads-filter-status-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
            <option value="converted">Converted</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="lg:col-span-2">
          <select
            id="leads-filter-category-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* City filter */}
        <div className="lg:col-span-1">
          <select
            id="leads-filter-city-select"
            value={cityFilter}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none cursor-pointer"
          >
            <option value="all">Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Sort selector */}
        <div className="lg:col-span-2 flex items-center gap-1.5">
          <select
            id="leads-filter-sortby-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-100 outline-none cursor-pointer"
          >
            <option value="createdAt">Date Saved</option>
            <option value="businessName">Name</option>
            <option value="rating">Rating</option>
            <option value="reviewCount">Reviews</option>
            <option value="status">Status</option>
          </select>
          <button
            id="leads-filter-sortorder-btn"
            type="button"
            onClick={onSortOrderToggle}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-slate-300 transition-colors cursor-pointer shrink-0"
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
