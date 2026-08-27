import React, { useState } from "react";
import {
  Search,
  MapPin,
  Building2,
  Layers,
  Loader2,
  Sparkles,
  Compass,
  X,
} from "lucide-react";

interface SearchFormProps {
  onSearch: (params: {
    query: string;
    location: string;
    limit: number;
    provider: string;
  }) => void;
  isLoading: boolean;
}

const CATEGORY_PRESETS = [
  "Dental Clinics",
  "Law Firms",
  "Gyms & Fitness",
  "Real Estate",
  "Cafes & Bakeries",
  "Tech & Software",
  "Plumbers & HVAC",
  "Marketing Agencies",
];

const LOCATION_PRESETS = [
  "New York, NY",
  "London, UK",
  "Toronto, Canada",
  "Sydney, Australia",
  "San Francisco, CA",
  "Austin, TX",
  "Dubai, UAE",
  "Noida, India",
];

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
}) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState<number>(25);
  const [provider, setProvider] = useState<string>("auto");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    onSearch({ query, location, limit, provider });
  };

  return (
    <form
      id="business-search-form"
      onSubmit={handleSubmit}
      className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Prospect Real Businesses
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full">
              Live Provider Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Queries live global business registries with verified phone,
            website, and location data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Business/Category */}
        <div className="md:col-span-5">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Business / Category <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-category-input"
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Dentists, Salons, Software, Gyms"
              className="w-full pl-10 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 transition-all outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* City/Location */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            City / Location <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              id="search-location-input"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 transition-all outline-none cursor-pointer"
            >
              <option value="">Select a location</option>
              {LOCATION_PRESETS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Number of Results */}
        <div className="md:col-span-1">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Limit
          </label>
          <select
            id="search-limit-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full px-2 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 outline-none transition-all cursor-pointer text-center"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 flex items-end">
          <button
            id="search-submit-btn"
            type="submit"
            disabled={isLoading || !query.trim() || !location.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer h-10.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Presets for Instant 1-Click Testing */}
      <div className="pt-2 border-t border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Categories:
          </span>
          {CATEGORY_PRESETS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setQuery(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                query === cat
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Popular Cities:
          </span>
          {LOCATION_PRESETS.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setLocation(city)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                location === city
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                  : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Provider selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
            Engine:
          </span>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300">
            <input
              type="radio"
              name="provider_choice"
              value="auto"
              checked={provider === "auto"}
              onChange={() => setProvider("auto")}
              className="text-indigo-600 focus:ring-indigo-600 bg-slate-950 border-slate-700"
            />
            <span>Auto (OSM / Grounded)</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300">
            <input
              type="radio"
              name="provider_choice"
              value="gemini_grounding"
              checked={provider === "gemini_grounding"}
              onChange={() => setProvider("gemini_grounding")}
              className="text-indigo-600 focus:ring-indigo-600 bg-slate-950 border-slate-700"
            />
            <span>Google Search Grounding</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300">
            <input
              type="radio"
              name="provider_choice"
              value="tomtom"
              checked={provider === "tomtom"}
              onChange={() => setProvider("tomtom")}
              className="text-indigo-600 focus:ring-indigo-600 bg-slate-950 border-slate-700"
            />
            <span>TomTom Search API</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          100% Real Geographic Leads
        </div>
      </div>
    </form>
  );
};
