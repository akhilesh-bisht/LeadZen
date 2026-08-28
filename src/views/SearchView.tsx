import React, { useState } from "react";
import {
  Search,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { LeadSearchResult } from "../types/index.js";
import { SearchForm } from "../components/SearchForm.js";
import { LeadCard } from "../components/LeadCard.js";
import { LoadingState } from "../components/LoadingState.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { useToast } from "../components/Toast.js";
import { useAuth } from "../context/AuthContext.js";

interface SearchViewProps {
  onNavigateToLeads: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  onNavigateToLeads,
}) => {
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{
    query: string;
    location: string;
    radiusKm?: number;
    limit: number;
    provider: string;
  } | null>(null);
  const [providerUsed, setProviderUsed] = useState<string>("");
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const { showToast } = useToast();
  const { token } = useAuth();

  const handleSearch = async (params: {
    query: string;
    location: string;
    radiusKm?: number;
    limit: number;
    provider: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setLastSearchParams(params);
    setSelectedIndexes([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to fetch business leads from live provider",
        );
      }

      setResults(data.leads || []);
      setProviderUsed(data.providerUsed || "Live Provider");
      setHasSearched(true);

      if (data.leads.length > 0) {
        showToast(
          `Found ${data.leads.length} real businesses in ${params.location}`,
          "success",
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      setError((err as Error).message);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSingleLead = async (
    lead: LeadSearchResult,
    index: number,
  ) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(lead),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save lead");
      }

      // Update state to mark lead as saved
      setResults((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          isSaved: true,
          savedLeadId: data.leads?.[0]?._id,
          savedStatus: "new",
        };
        return copy;
      });

      showToast(`Saved "${lead.businessName}" to database`, "success");
    } catch (err) {
      console.error("Save single lead error:", err);
      showToast("Failed to save lead to database", "error");
    }
  };

  const handleToggleSelect = (index: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleSelectAllUnsaved = () => {
    const unsavedIndices = results
      .map((item, idx) => (!item.isSaved ? idx : -1))
      .filter((idx) => idx !== -1);

    if (selectedIndexes.length === unsavedIndices.length) {
      setSelectedIndexes([]);
    } else {
      setSelectedIndexes(unsavedIndices);
    }
  };

  const handleSaveSelectedLeads = async () => {
    if (selectedIndexes.length === 0) return;

    const leadsToSave = selectedIndexes.map((idx) => results[idx]);
    setIsSavingBatch(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ leads: leadsToSave }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to batch save leads");
      }

      // Mark all saved in UI
      setResults((prev) =>
        prev.map((item, idx) => {
          if (selectedIndexes.includes(idx)) {
            return {
              ...item,
              isSaved: true,
              savedStatus: "new",
            };
          }
          return item;
        }),
      );

      setSelectedIndexes([]);
      showToast(`Saved ${data.savedCount} leads to database`, "success");
    } catch (err) {
      console.error("Batch save error:", err);
      showToast("Failed to batch save leads to database", "error");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const unsavedCount = results.filter((r) => !r.isSaved).length;

  return (
    <div className="space-y-6">
      {/* Search Input Form */}
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Loading State */}
      {isLoading && (
        <LoadingState
          message="Searching businesses from live provider..."
          subMessage="Querying real geographic business registries and validating live records with zero mock data."
        />
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState
          title="Search Provider Error"
          message={error}
          onRetry={() => lastSearchParams && handleSearch(lastSearchParams)}
        />
      )}

      {/* Results Section */}
      {!isLoading && !error && hasSearched && (
        <div className="space-y-4">
          {/* Results Header with Batch Actions */}
          <div className="bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Search Results ({results.length})
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/80">
                  Source: {providerUsed}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Showing live business listings for "{lastSearchParams?.query}"
                in "{lastSearchParams?.location}"
                {lastSearchParams?.radiusKm && (
                  <span className="text-indigo-400 font-medium ml-1">
                    • {lastSearchParams.radiusKm} km radius
                  </span>
                )}
              </p>
            </div>

            {results.length > 0 && unsavedCount > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  id="search-select-all-btn"
                  onClick={handleSelectAllUnsaved}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/70 transition-colors cursor-pointer"
                >
                  {selectedIndexes.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    {selectedIndexes.length > 0
                      ? `Selected (${selectedIndexes.length})`
                      : "Select All Unsaved"}
                  </span>
                </button>

                {selectedIndexes.length > 0 && (
                  <button
                    id="search-batch-save-btn"
                    disabled={isSavingBatch}
                    onClick={handleSaveSelectedLeads}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingBatch ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Save Selected ({selectedIndexes.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Real Results Grid or Empty State */}
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((lead, idx) => (
                <div
                  key={`${lead.externalId || lead.businessName}-${idx}`}
                  className="relative"
                >
                  {!lead.isSaved && (
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <input
                        type="checkbox"
                        checked={selectedIndexes.includes(idx)}
                        onChange={() => handleToggleSelect(idx)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-600 bg-slate-900 shadow-sm cursor-pointer accent-indigo-600"
                      />
                    </div>
                  )}
                  <LeadCard
                    lead={lead}
                    onSave={() => handleSaveSingleLead(lead, idx)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No businesses found. Try another search."
              description="No real businesses matched your query in this location. Try changing your category keyword (e.g. Dentists, Salons, Gyms, Restaurants) or specifying a nearby city."
              icon="search"
            />
          )}

          {/* Bottom Quick Link to Leads */}
          {results.some((r) => r.isSaved) && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  You have saved leads in your database from this search
                  session.
                </span>
              </div>
              <button
                onClick={onNavigateToLeads}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                <span>View saved leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
