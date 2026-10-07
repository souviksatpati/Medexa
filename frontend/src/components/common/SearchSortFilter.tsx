import React from "react";

export type SortOption =
  | "risk-desc"
  | "risk-asc"
  | "name-asc"
  | "name-desc"
  | "stage"
  | "recent";

export interface FilterState {
  search: string;
  sortBy: SortOption;
  risk: string; // "ALL" | "RED" | "YELLOW" | "GREEN"
  stage: string; // "ALL" | stage name
  category: string; // "ALL" | category name
  viewMode: "cards" | "table";
}

interface SearchSortFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
  availableCategories?: string[];
  availableStages?: string[];
}

export const SearchSortFilter: React.FC<SearchSortFilterProps> = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
  availableCategories = [
    "Maternal Health",
    "Hypertension",
    "Diabetes",
    "Pediatric",
    "Infectious / Fever",
    "Respiratory",
    "Orthopedic / Trauma",
  ],
  availableStages = [
    "Triage / Referred",
    "In Transit",
    "Consultation",
    "Treatment",
    "Back-Referred / Follow-up",
    "Completed",
  ],
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const hasActiveFilters =
    filters.risk !== "ALL" ||
    filters.stage !== "ALL" ||
    filters.category !== "ALL" ||
    filters.search.trim() !== "";

  const resetFilters = () => {
    onChange({
      ...filters,
      search: "",
      sortBy: "risk-desc",
      risk: "ALL",
      stage: "ALL",
      category: "ALL",
    });
  };

  return (
    <div className="sticky top-2 z-10 space-y-3 rounded-2xl border border-outline-variant bg-surface/95 p-3.5 sm:p-4 backdrop-blur-md shadow-sm">
      {/* Top Search & Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by patient name, village, ABHA, or condition..."
            className="w-full h-11 rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-9 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/10 transition"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant hover:text-on-surface"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[150px]">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({ ...filters, sortBy: e.target.value as SortOption })
              }
              className="h-11 w-full appearance-none rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="risk-desc">Sort: High Risk First</option>
              <option value="recent">Sort: Recently Updated</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="stage">Sort: Care Stage</option>
              <option value="risk-asc">Sort: Stable First</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              expand_more
            </span>
          </div>

          {/* Toggle Filter Panel */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-11 inline-flex items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
              hasActiveFilters || showFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </button>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="hidden md:inline-flex rounded-xl border border-outline-variant bg-surface-container p-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...filters, viewMode: "cards" })}
              className={`h-9 w-9 rounded-lg inline-flex items-center justify-center transition ${
                filters.viewMode === "cards"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Card Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filters, viewMode: "table" })}
              className={`h-9 w-9 rounded-lg inline-flex items-center justify-center transition ${
                filters.viewMode === "table"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Risk Badges & Active Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mr-1">
            Risk:
          </span>
          <button
            type="button"
            onClick={() => onChange({ ...filters, risk: "ALL" })}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              filters.risk === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, risk: "RED" })}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              filters.risk === "RED"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Red / High
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, risk: "YELLOW" })}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              filters.risk === "YELLOW"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Yellow
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...filters, risk: "GREEN" })}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              filters.risk === "GREEN"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Green
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              Reset
            </button>
          )}
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
            Showing {filteredCount} of {totalCount} cases
          </span>
        </div>
      </div>

      {/* Expandable Advanced Filters (Care Stage & Condition Category) */}
      {showFilters && (
        <div className="pt-3 border-t border-outline-variant/60 space-y-2.5">
          {/* Care Stage Filter */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
              Care Journey Stage:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, stage: "ALL" })}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                  filters.stage === "ALL"
                    ? "bg-primary text-white"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                All Stages
              </button>
              {availableStages.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => onChange({ ...filters, stage })}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                    filters.stage === stage
                      ? "bg-primary text-white"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Category Filter */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
              Condition Category:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, category: "ALL" })}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                  filters.category === "ALL"
                    ? "bg-teal-700 text-white"
                    : "bg-teal-50 text-teal-800 hover:bg-teal-100"
                }`}
              >
                All Categories
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onChange({ ...filters, category: cat })}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                    filters.category === cat
                      ? "bg-teal-700 text-white"
                      : "bg-teal-50 text-teal-800 hover:bg-teal-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
