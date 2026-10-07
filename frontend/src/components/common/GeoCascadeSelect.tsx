import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/auth/auth";

export interface GeoValue {
  state: string;
  district: string;
  block: string;
  village: string;
  isManual?: boolean;
}

export interface GeoCascadeSelectProps {
  value: GeoValue;
  onChange: (val: GeoValue) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface StateIndexItem {
  name: string;
  slug: string;
}

interface StateData {
  state: string;
  districts: Record<
    string,
    {
      blocks: Record<string, string[]>;
    }
  >;
}

// In-memory cache for loaded state JSON files
const geoCache = new Map<string, StateData>();

export function GeoCascadeSelect({
  value,
  onChange,
  required = true,
  className = "",
  disabled = false,
}: GeoCascadeSelectProps) {
  const { user } = useAuth();

  // 1. Eagerly load /geo-data/index.json
  const [stateIndex, setStateIndex] = useState<StateIndexItem[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(false);

  // 2. Lazy-loaded current state data
  const [currentStateData, setCurrentStateData] = useState<StateData | null>(null);

  // 3. Manual entry toggle
  const [isManual, setIsManual] = useState<boolean>(Boolean(value.isManual));

  // 4. Village Typeahead search state
  const [villageSearch, setVillageSearch] = useState(value.village || "");
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);
  const typeaheadRef = useRef<HTMLDivElement>(null);

  // Role-aware locks (Part 1 authenticated identity)
  const isAsha = user?.role === "ASHA";
  const isBlock = user?.role === "BLOCK";
  const isDistrict = user?.role === "DISTRICT";

  const lockState = Boolean(user && (isAsha || isBlock || isDistrict));
  const lockDistrict = Boolean(user && (isAsha || isBlock || isDistrict));
  const lockBlock = Boolean(user && (isAsha || isBlock));

  // Fetch /geo-data/index.json eagerly
  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingIndex(true);
    fetch("/geo-data/index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: StateIndexItem[]) => {
        if (mounted) {
          setStateIndex(data);
          setLoadingIndex(false);
        }
      })
      .catch((err) => {
        console.warn("Could not load /geo-data/index.json:", err);
        if (mounted) {
          // Fallback static state index
          setStateIndex([
            { name: "West Bengal", slug: "west-bengal" },
            { name: "Bihar", slug: "bihar" },
            { name: "Jharkhand", slug: "jharkhand" },
            { name: "Odisha", slug: "odisha" },
            { name: "Assam", slug: "assam" },
          ]);
          setLoadingIndex(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync villageSearch with external value.village
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVillageSearch(value.village || "");
  }, [value.village]);

  // Role-Aware Initialization & Enforcement:
  // Pre-fill and lock State, District, Block from user profile
  useEffect(() => {
    if (!user) return;

    let updated = false;
    const next: GeoValue = { ...value };

    // Locked values can NEVER be overridden outside role scope
    if (lockState && user.state && value.state !== user.state) {
      next.state = user.state;
      updated = true;
    }
    if (lockDistrict && user.district && value.district !== user.district) {
      next.district = user.district;
      updated = true;
    }
    if (lockBlock && user.block && value.block !== user.block) {
      next.block = user.block;
      updated = true;
    }
    // ASHA default village if empty
    if (isAsha && user.village && !value.village) {
      next.village = user.village;
      updated = true;
    }

    if (updated) {
      onChange(next);
    }
  }, [user, lockState, lockDistrict, lockBlock, isAsha, value, onChange]);

  const selectedStateName = value.state?.trim();
  const stateItem = selectedStateName
    ? stateIndex.find((s) => s.name.toLowerCase() === selectedStateName.toLowerCase())
    : null;
  const currentSlug = selectedStateName
    ? stateItem ? stateItem.slug : selectedStateName.toLowerCase().replace(/\s+/g, "-")
    : null;

  const activeStateData = (currentSlug ? geoCache.get(currentSlug) : null) || currentStateData;
  const loadingStateData = Boolean(currentSlug && !geoCache.has(currentSlug) && !currentStateData);

  // Lazy-load state JSON when value.state changes
  useEffect(() => {
    if (!currentSlug || geoCache.has(currentSlug)) {
      return;
    }

    let mounted = true;

    fetch(`/geo-data/${currentSlug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: StateData) => {
        if (mounted) {
          geoCache.set(currentSlug, data);
          setCurrentStateData(data);
        }
      })
      .catch((err) => {
        console.warn(`Could not load /geo-data/${currentSlug}.json:`, err);
      });

    return () => {
      mounted = false;
    };
  }, [currentSlug]);

  // Close typeahead suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target as Node)) {
        setShowVillageSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute available districts for the selected state
  const availableDistricts = useMemo(() => {
    if (!activeStateData?.districts) return [];
    return Object.keys(activeStateData.districts);
  }, [activeStateData]);

  // Compute available blocks for the selected district
  const availableBlocks = useMemo(() => {
    if (!activeStateData?.districts || !value.district) return [];
    const districtObj = activeStateData.districts[value.district];
    if (!districtObj?.blocks) return [];
    return Object.keys(districtObj.blocks);
  }, [activeStateData, value.district]);

  // Compute available villages for the selected block
  const availableVillages = useMemo(() => {
    if (!activeStateData?.districts || !value.district || !value.block) return [];
    const districtObj = activeStateData.districts[value.district];
    const villages = districtObj?.blocks?.[value.block];
    return Array.isArray(villages) ? villages : [];
  }, [activeStateData, value.district, value.block]);

  // Filter village typeahead options
  const filteredVillages = useMemo(() => {
    if (!villageSearch.trim()) return availableVillages;
    const q = villageSearch.toLowerCase();
    return availableVillages.filter((v) => v.toLowerCase().includes(q));
  }, [availableVillages, villageSearch]);

  // Field change handlers — cascading reset of fields below
  const handleStateChange = (newState: string) => {
    if (lockState) return;
    onChange({
      state: newState,
      district: "",
      block: "",
      village: "",
      isManual,
    });
    setVillageSearch("");
  };

  const handleDistrictChange = (newDistrict: string) => {
    if (lockDistrict) return;
    onChange({
      ...value,
      district: newDistrict,
      block: "",
      village: "",
      isManual,
    });
    setVillageSearch("");
  };

  const handleBlockChange = (newBlock: string) => {
    if (lockBlock) return;
    onChange({
      ...value,
      block: newBlock,
      village: "",
      isManual,
    });
    setVillageSearch("");
  };

  const handleVillageSelect = (villageName: string) => {
    setVillageSearch(villageName);
    setShowVillageSuggestions(false);
    onChange({
      ...value,
      village: villageName,
      isManual: false,
    });
  };

  const handleManualVillageChange = (val: string) => {
    setVillageSearch(val);
    onChange({
      ...value,
      village: val,
      isManual: true,
    });
  };

  const toggleManualEntry = () => {
    const nextManual = !isManual;
    setIsManual(nextManual);
    onChange({
      ...value,
      isManual: nextManual,
    });
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 4 Cascading Fields in Order: State -> District -> Block -> Village */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

        {/* 1. STATE FIELD */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
            <span>State {required && "*"}</span>
            {lockState && (
              <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Locked to profile</span>
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={value.state || ""}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={disabled || lockState || loadingIndex}
              className={`w-full appearance-none rounded-xl border border-outline-variant px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary ${
                lockState || disabled
                  ? "bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200"
                  : "bg-surface-container-low text-on-surface hover:border-slate-400"
              }`}
            >
              <option value="">
                {loadingIndex ? "Loading states..." : "Select State"}
              </option>
              {stateIndex.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
              {lockState ? "lock" : "expand_more"}
            </span>
          </div>
        </div>

        {/* 2. DISTRICT FIELD */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
            <span>District {required && "*"}</span>
            {lockDistrict && (
              <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Locked to profile</span>
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={value.district || ""}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={disabled || lockDistrict || !value.state || loadingStateData}
              className={`w-full appearance-none rounded-xl border border-outline-variant px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary ${
                lockDistrict || disabled || !value.state
                  ? "bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200"
                  : "bg-surface-container-low text-on-surface hover:border-slate-400"
              }`}
            >
              <option value="">
                {loadingStateData
                  ? "Loading districts..."
                  : !value.state
                  ? "Select State first"
                  : "Select District"}
              </option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
              {lockDistrict ? "lock" : "expand_more"}
            </span>
          </div>
        </div>

        {/* 3. BLOCK FIELD */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
            <span>Block {required && "*"}</span>
            {lockBlock && (
              <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Locked to facility</span>
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={value.block || ""}
              onChange={(e) => handleBlockChange(e.target.value)}
              disabled={disabled || lockBlock || !value.district}
              className={`w-full appearance-none rounded-xl border border-outline-variant px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary ${
                lockBlock || disabled || !value.district
                  ? "bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200"
                  : "bg-surface-container-low text-on-surface hover:border-slate-400"
              }`}
            >
              <option value="">
                {!value.district ? "Select District first" : "Select Block"}
              </option>
              {availableBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
              {lockBlock ? "lock" : "expand_more"}
            </span>
          </div>
        </div>

        {/* 4. VILLAGE FIELD (Typeahead / Manual Fallback) */}
        <div ref={typeaheadRef} className="relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1 flex items-center justify-between">
            <span>Village / Ward / Hamlet {required && "*"}</span>
            {isManual && (
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                Manual Entry Mode
              </span>
            )}
          </label>

          {isManual ? (
            /* MANUAL FREE-TEXT INPUT */
            <div className="relative">
              <input
                type="text"
                value={villageSearch}
                onChange={(e) => handleManualVillageChange(e.target.value)}
                placeholder="Type village / hamlet name..."
                disabled={disabled || !value.block}
                className={`w-full rounded-xl border border-outline-variant px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary ${
                  !value.block
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-surface-container-low text-on-surface focus:bg-white"
                }`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                edit
              </span>
            </div>
          ) : (
            /* SEARCHABLE TYPEAHEAD INPUT */
            <div className="relative">
              <input
                type="text"
                value={villageSearch}
                onChange={(e) => {
                  setVillageSearch(e.target.value);
                  setShowVillageSuggestions(true);
                  if (value.village !== e.target.value) {
                    onChange({
                      ...value,
                      village: e.target.value,
                      isManual: false,
                    });
                  }
                }}
                onFocus={() => {
                  if (value.block) setShowVillageSuggestions(true);
                }}
                placeholder={!value.block ? "Select Block first" : "Type to search village..."}
                disabled={disabled || !value.block}
                className={`w-full rounded-xl border border-outline-variant px-3.5 py-2.5 text-sm font-medium outline-none transition focus:border-primary ${
                  !value.block
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-surface-container-low text-on-surface focus:bg-white"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (value.block) setShowVillageSuggestions((prev) => !prev);
                }}
                disabled={disabled || !value.block}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-lg">
                  {showVillageSuggestions ? "expand_less" : "expand_more"}
                </span>
              </button>

              {/* Typeahead Suggestions Dropdown */}
              {showVillageSuggestions && value.block && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-outline-variant bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  {filteredVillages.length > 0 ? (
                    filteredVillages.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleVillageSelect(v)}
                        className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition flex items-center justify-between ${
                          value.village === v
                            ? "bg-primary text-on-primary"
                            : "text-on-surface hover:bg-slate-100"
                        }`}
                      >
                        <span>{v}</span>
                        {value.village === v && (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-on-surface-variant">
                      <p>No directory match found for "{villageSearch}"</p>
                      <button
                        type="button"
                        onClick={toggleManualEntry}
                        className="mt-1.5 text-xs font-bold text-primary underline"
                      >
                        Enter it manually below
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* MANUAL ENTRY FALLBACK TOGGLE */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <button
          type="button"
          onClick={toggleManualEntry}
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-primary transition underline decoration-dotted"
        >
          <span className="material-symbols-outlined text-[15px]">
            {isManual ? "list_alt" : "edit_note"}
          </span>
          <span>
            {isManual
              ? "Switch back to directory village dropdown"
              : "Village/hamlet not listed? Enter it manually."}
          </span>
        </button>

        {value.village && (
          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
            Selected: <strong className="text-slate-800">{value.village}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
