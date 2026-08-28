import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPin,
  Building2,
  Loader2,
  X,
  ChevronDown,
  Globe,
  Check,
  LocateFixed,
  Compass,
} from "lucide-react";

interface SearchFormProps {
  onSearch: (params: {
    query: string;
    location: string;
    radiusKm: number;
    limit: number;
    provider: string;
  }) => void;
  isLoading: boolean;
}

const CATEGORY_PRESETS = [
  "All Businesses",
  "Dental Clinics",
  "Law Firms",
  "Gyms & Fitness",
  "Real Estate",
  "Cafes & Bakeries",
  "Tech & Software",
  "Plumbers & HVAC",
  "Marketing Agencies",
  "Restaurants & Food",
  "Salons & Spas",
  "Hospitals & Clinics",
];

// Comprehensive list of Indian Cities across Metros, Tech Hubs & Tier 1/2 Cities
export const INDIAN_CITIES = [
  { name: "Mumbai, Maharashtra, India", shortName: "Mumbai", tier: "Metro" },
  { name: "Delhi / NCR, India", shortName: "Delhi", tier: "Metro" },
  { name: "Bengaluru, Karnataka, India", shortName: "Bengaluru", tier: "Tech Hub" },
  { name: "Hyderabad, Telangana, India", shortName: "Hyderabad", tier: "Tech Hub" },
  { name: "Chennai, Tamil Nadu, India", shortName: "Chennai", tier: "Metro" },
  { name: "Kolkata, West Bengal, India", shortName: "Kolkata", tier: "Metro" },
  { name: "Pune, Maharashtra, India", shortName: "Pune", tier: "Tech Hub" },
  { name: "Ahmedabad, Gujarat, India", shortName: "Ahmedabad", tier: "Metro" },
  { name: "Gurgaon (Gurugram), Haryana, India", shortName: "Gurgaon", tier: "NCR Hub" },
  { name: "Noida, Uttar Pradesh, India", shortName: "Noida", tier: "NCR Hub" },
  { name: "Jaipur, Rajasthan, India", shortName: "Jaipur", tier: "Commercial" },
  { name: "Chandigarh, India", shortName: "Chandigarh", tier: "Commercial" },
  { name: "Lucknow, Uttar Pradesh, India", shortName: "Lucknow", tier: "Commercial" },
  { name: "Indore, Madhya Pradesh, India", shortName: "Indore", tier: "Commercial" },
  { name: "Surat, Gujarat, India", shortName: "Surat", tier: "Commercial" },
  { name: "Kochi, Kerala, India", shortName: "Kochi", tier: "Commercial" },
  { name: "Coimbatore, Tamil Nadu, India", shortName: "Coimbatore", tier: "Commercial" },
  { name: "Bhopal, Madhya Pradesh, India", shortName: "Bhopal", tier: "Commercial" },
  { name: "Vadodara, Gujarat, India", shortName: "Vadodara", tier: "Commercial" },
  { name: "Visakhapatnam, Andhra Pradesh, India", shortName: "Visakhapatnam", tier: "Commercial" },
  { name: "Nagpur, Maharashtra, India", shortName: "Nagpur", tier: "Commercial" },
  { name: "Patna, Bihar, India", shortName: "Patna", tier: "Commercial" },
  { name: "Dehradun, Uttarakhand, India", shortName: "Dehradun", tier: "Commercial" },
  { name: "Goa, India", shortName: "Goa", tier: "Commercial" },
  { name: "Ghaziabad, Uttar Pradesh, India", shortName: "Ghaziabad", tier: "NCR Hub" },
  { name: "Faridabad, Haryana, India", shortName: "Faridabad", tier: "NCR Hub" },
  { name: "Thane, Maharashtra, India", shortName: "Thane", tier: "Metro" },
  { name: "Nashik, Maharashtra, India", shortName: "Nashik", tier: "Commercial" },
  { name: "Varanasi, Uttar Pradesh, India", shortName: "Varanasi", tier: "Commercial" },
  { name: "Agra, Uttar Pradesh, India", shortName: "Agra", tier: "Commercial" },
  { name: "Amritsar, Punjab, India", shortName: "Amritsar", tier: "Commercial" },
  { name: "Ludhiana, Punjab, India", shortName: "Ludhiana", tier: "Commercial" },
  { name: "Rajkot, Gujarat, India", shortName: "Rajkot", tier: "Commercial" },
  { name: "Madurai, Tamil Nadu, India", shortName: "Madurai", tier: "Commercial" },
  { name: "Ranchi, Jharkhand, India", shortName: "Ranchi", tier: "Commercial" },
  { name: "Guwahati, Assam, India", shortName: "Guwahati", tier: "Commercial" },
  { name: "Mysuru (Mysore), Karnataka, India", shortName: "Mysuru", tier: "Tech Hub" },
  { name: "Mangaluru, Karnataka, India", shortName: "Mangaluru", tier: "Commercial" },
  { name: "Thiruvananthapuram, Kerala, India", shortName: "Trivandrum", tier: "Tech Hub" },
  { name: "Kanpur, Uttar Pradesh, India", shortName: "Kanpur", tier: "Commercial" },
  { name: "Prayagraj (Allahabad), Uttar Pradesh, India", shortName: "Prayagraj", tier: "Commercial" },
];

export const GLOBAL_CITIES = [
  { name: "New York, NY, USA", shortName: "New York", tier: "Global Metro" },
  { name: "London, UK", shortName: "London", tier: "Global Metro" },
  { name: "San Francisco, CA, USA", shortName: "San Francisco", tier: "Tech Hub" },
  { name: "Dubai, UAE", shortName: "Dubai", tier: "Global Hub" },
  { name: "Singapore", shortName: "Singapore", tier: "Global Hub" },
  { name: "Toronto, Canada", shortName: "Toronto", tier: "Global Metro" },
  { name: "Sydney, Australia", shortName: "Sydney", tier: "Global Metro" },
  { name: "Austin, TX, USA", shortName: "Austin", tier: "Tech Hub" },
  { name: "Berlin, Germany", shortName: "Berlin", tier: "Tech Hub" },
  { name: "Tokyo, Japan", shortName: "Tokyo", tier: "Global Metro" },
  { name: "Paris, France", shortName: "Paris", tier: "Global Metro" },
  { name: "Amsterdam, Netherlands", shortName: "Amsterdam", tier: "Tech Hub" },
];

// Quick 1-click Preset Pills
const POPULAR_INDIAN_PILLS = [
  "Mumbai, Maharashtra, India",
  "Delhi / NCR, India",
  "Bengaluru, Karnataka, India",
  "Hyderabad, Telangana, India",
  "Pune, Maharashtra, India",
  "Noida, Uttar Pradesh, India",
  "Gurgaon (Gurugram), Haryana, India",
  "Jaipur, Rajasthan, India",
  "Chennai, Tamil Nadu, India",
  "Ahmedabad, Gujarat, India",
  "Indore, Madhya Pradesh, India",
  "Chandigarh, India",
  "Kochi, Kerala, India",
];

const POPULAR_GLOBAL_PILLS = [
  "New York, NY, USA",
  "London, UK",
  "Dubai, UAE",
  "San Francisco, CA, USA",
  "Singapore",
  "Sydney, Australia",
  "Toronto, Canada",
];

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
}) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [limit, setLimit] = useState<number>(25);
  // Default engine: TomTom Search API as requested
  const [provider, setProvider] = useState<string>("tomtom");

  // Dropdown combobox state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownTab, setDropdownTab] = useState<"all" | "india" | "global">("all");
  const [presetTab, setPresetTab] = useState<"india" | "global">("india");

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationFeedback("Detecting GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "User-Agent": "LeadGenPro-LocationLookup/1.0",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.suburb ||
              addr.state_district ||
              "";
            const stateName = addr.state || "";
            const countryName = addr.country || "";

            const parts = [cityName, stateName, countryName].filter(Boolean);
            const resolvedLocation =
              parts.length > 0
                ? parts.join(", ")
                : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            setLocation(resolvedLocation);
            setLocationFeedback(`📍 Detected: ${resolvedLocation}`);
          } else {
            const coordStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(coordStr);
            setLocationFeedback(`📍 Location: ${coordStr}`);
          }
        } catch (err) {
          console.warn("Reverse geocode failed, using coordinates:", err);
          const coordStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(coordStr);
          setLocationFeedback(`📍 Location: ${coordStr}`);
        } finally {
          setIsLocating(false);
          setIsDropdownOpen(false);
          setTimeout(() => setLocationFeedback(null), 4000);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationFeedback(null);
        console.warn("Geolocation error:", error);
        alert(
          error.code === 1
            ? "Location permission was denied. Please allow location access in your browser or type your city manually."
            : "Could not retrieve your location. Please enter your city manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    const effectiveQuery = query.trim() || "All Businesses";
    setIsDropdownOpen(false);
    onSearch({ query: effectiveQuery, location, radiusKm, limit, provider });
  };

  const handleSelectCity = (cityName: string) => {
    setLocation(cityName);
    setIsDropdownOpen(false);
  };

  // Filter cities based on user's manual search input
  const filterQuery = location.trim().toLowerCase();

  const filteredIndianCities = INDIAN_CITIES.filter(
    (c) =>
      !filterQuery ||
      c.name.toLowerCase().includes(filterQuery) ||
      c.shortName.toLowerCase().includes(filterQuery)
  );

  const filteredGlobalCities = GLOBAL_CITIES.filter(
    (c) =>
      !filterQuery ||
      c.name.toLowerCase().includes(filterQuery) ||
      c.shortName.toLowerCase().includes(filterQuery)
  );

  const hasAnyMatches =
    (dropdownTab === "all" && (filteredIndianCities.length > 0 || filteredGlobalCities.length > 0)) ||
    (dropdownTab === "india" && filteredIndianCities.length > 0) ||
    (dropdownTab === "global" && filteredGlobalCities.length > 0);

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
              TomTom & Multi-Provider Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Queries live business registries with verified phone,
            website, and geographic radius coverage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Business/Category */}
        <div className="md:col-span-6 lg:col-span-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Business / Category
            </label>
            <span className="text-[10px] text-slate-400">
              Optional (defaults to All)
            </span>
          </div>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="search-category-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. All Businesses, Dentists, Salons, Tech..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 transition-all outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer"
                title="Clear category"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* City/Location with Manual Input, Combobox & Current Location GPS */}
        <div className="md:col-span-6 lg:col-span-4 relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              City / Location <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              id="search-current-location-btn"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Detect and use current GPS location"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-3 h-3 text-indigo-400" />
                  <span>Current Location</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              id="search-location-input"
              type="text"
              required
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (!isDropdownOpen) setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="e.g. Mumbai, Bengaluru, London, or click Current Location..."
              autoComplete="off"
              className="w-full pl-10 pr-16 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 transition-all outline-none"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {location && (
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer"
                  title="Clear location"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-md cursor-pointer"
                title="Toggle location suggestions"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-indigo-400" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Location Feedback Toast message */}
          {locationFeedback && (
            <div className="text-[11px] text-emerald-400 mt-1 font-medium animate-in fade-in">
              {locationFeedback}
            </div>
          )}

          {/* Interactive Suggestions & Options Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header & Region Tabs */}
              <div className="p-2 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDropdownTab("all")}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      dropdownTab === "all"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    All Locations
                  </button>
                  <button
                    type="button"
                    onClick={() => setDropdownTab("india")}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      dropdownTab === "india"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    🇮🇳 Indian Cities ({INDIAN_CITIES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDropdownTab("global")}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      dropdownTab === "global"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    🌍 Global ({GLOBAL_CITIES.length})
                  </button>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="overflow-y-auto max-h-60 divide-y divide-slate-800/60 text-xs">
                {/* Indian Cities Section */}
                {(dropdownTab === "all" || dropdownTab === "india") &&
                  filteredIndianCities.length > 0 && (
                    <div className="py-1">
                      {dropdownTab === "all" && (
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 flex items-center gap-1.5">
                          <span>🇮🇳</span>
                          <span>Indian Cities</span>
                        </div>
                      )}
                      {filteredIndianCities.map((city) => {
                        const isSelected = location === city.name;
                        return (
                          <button
                            key={city.name}
                            type="button"
                            onClick={() => handleSelectCity(city.name)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/15 text-indigo-300 font-medium"
                                : "text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{city.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700/60">
                                {city.tier}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* Global Cities Section */}
                {(dropdownTab === "all" || dropdownTab === "global") &&
                  filteredGlobalCities.length > 0 && (
                    <div className="py-1">
                      {dropdownTab === "all" && (
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 flex items-center gap-1.5">
                          <span>🌍</span>
                          <span>Global Metros</span>
                        </div>
                      )}
                      {filteredGlobalCities.map((city) => {
                        const isSelected = location === city.name;
                        return (
                          <button
                            key={city.name}
                            type="button"
                            onClick={() => handleSelectCity(city.name)}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/15 text-indigo-300 font-medium"
                                : "text-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{city.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700/60">
                                {city.tier}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                {/* Custom / Manual search notice when no preset matches or user typed custom location */}
                {!hasAnyMatches && filterQuery && (
                  <div className="p-3 text-center text-slate-400">
                    <p className="text-xs font-medium text-slate-300">
                      Use custom location: "{location}"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Press Search to query live businesses directly in this area.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Footer Helper */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between px-3">
                <span>✨ Any city, area, or GPS coordinates supported</span>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Coverage Radius / Area Range */}
        <div className="md:col-span-4 lg:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Area Radius</span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold">{radiusKm} km</span>
          </label>
          <div className="relative">
            <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="search-radius-select"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full pl-9 pr-2 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs sm:text-sm font-medium text-slate-100 outline-none transition-all cursor-pointer"
            >
              <option value={5}>5 km (Local / Suburb)</option>
              <option value={10}>10 km (District Area)</option>
              <option value={25}>25 km (Metro City)</option>
              <option value={50}>50 km (Greater Metro)</option>
            </select>
          </div>
        </div>

        {/* Number of Results */}
        <div className="md:col-span-4 lg:col-span-1">
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
        <div className="md:col-span-4 lg:col-span-1 flex items-end">
          <button
            id="search-submit-btn"
            type="submit"
            disabled={isLoading || !location.trim()}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer h-10.5"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
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
        {/* Categories */}
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

        {/* Popular Cities with Indian / Global Tabs */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Popular Cities:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setPresetTab("india")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  presetTab === "india"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🇮🇳 Indian Cities
              </button>
              <button
                type="button"
                onClick={() => setPresetTab("global")}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  presetTab === "global"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                🌍 Global Cities
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {presetTab === "india"
              ? POPULAR_INDIAN_PILLS.map((city) => (
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
                    {city.split(",")[0]}
                  </button>
                ))
              : POPULAR_GLOBAL_PILLS.map((city) => (
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
                    {city.split(",")[0]}
                  </button>
                ))}
          </div>
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
              value="tomtom"
              checked={provider === "tomtom"}
              onChange={() => setProvider("tomtom")}
              className="text-indigo-600 focus:ring-indigo-600 bg-slate-950 border-slate-700"
            />
            <span className="text-emerald-400 font-semibold">TomTom Search API (Default)</span>
          </label>
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
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          100% Real Geographic Leads
        </div>
      </div>
    </form>
  );
};
