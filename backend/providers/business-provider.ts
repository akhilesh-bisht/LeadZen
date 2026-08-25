import { LeadSearchResult } from "../../src/types/index.js";
import { GoogleGenAI } from "@google/genai";

export interface BusinessProvider {
  name: string;
  searchBusinesses(
    query: string,
    location: string,
    limit: number,
  ): Promise<LeadSearchResult[]>;
}

// -------------------------------------------------------------
// 1. OpenStreetMap (Overpass API + Nominatim) Real Live Provider
// No API key required, 100% real worldwide business data
// -------------------------------------------------------------
export class OpenStreetMapProvider implements BusinessProvider {
  name = "OpenStreetMap Overpass (Live Real Data)";

  private categoryTagMap: Record<string, string[]> = {
    dentist: ["amenity=dentist", "healthcare=dentist"],
    dentists: ["amenity=dentist", "healthcare=dentist"],
    doctor: ["amenity=doctors", "healthcare=doctor"],
    doctors: ["amenity=doctors", "healthcare=doctor"],
    hospital: ["amenity=hospital", "healthcare=hospital"],
    hospitals: ["amenity=hospital", "healthcare=hospital"],
    pharmacy: ["amenity=pharmacy", "healthcare=pharmacy"],
    clinic: ["amenity=clinic", "healthcare=clinic"],
    salon: ["shop=hairdresser", "shop=beauty"],
    salons: ["shop=hairdresser", "shop=beauty"],
    spa: ["shop=beauty", "leisure=spa"],
    gym: ["leisure=fitness_centre", "leisure=sports_centre"],
    gyms: ["leisure=fitness_centre", "leisure=sports_centre"],
    restaurant: ["amenity=restaurant"],
    restaurants: ["amenity=restaurant"],
    cafe: ["amenity=cafe"],
    cafes: ["amenity=cafe"],
    hotel: ["tourism=hotel"],
    hotels: ["tourism=hotel"],
    lawyer: ["office=lawyer"],
    lawyers: ["office=lawyer"],
    accountant: ["office=accountant"],
    realestate: ["office=estate_agent"],
    "real estate": ["office=estate_agent"],
    bank: ["amenity=bank"],
    school: ["amenity=school"],
    car: ["shop=car", "shop=car_repair"],
    it: ["office=it", "office=company"],
    software: ["office=it", "office=company"],
  };

  async searchBusinesses(
    query: string,
    location: string,
    limit: number,
  ): Promise<LeadSearchResult[]> {
    const cleanLocation = location.trim();
    const cleanQuery = query.trim();

    // 1. Geocode location with Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanLocation,
    )}&addressdetails=1&limit=1`;

    const geoRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent":
          "LeadGenPro-RealProspecting/1.0 (contact: support@leadgenapp.internal)",
      },
    });

    if (!geoRes.ok) {
      throw new Error(`Location lookup failed: ${geoRes.statusText}`);
    }

    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return []; // Real empty results for unknown location
    }

    const locInfo = geoData[0];
    const boundingBox = locInfo.boundingbox; // [south, north, west, east]
    let bbox = "";
    if (boundingBox && boundingBox.length === 4) {
      const south = parseFloat(boundingBox[0]);
      const north = parseFloat(boundingBox[1]);
      const west = parseFloat(boundingBox[2]);
      const east = parseFloat(boundingBox[3]);
      bbox = `(${south},${west},${north},${east})`;
    } else {
      const lat = parseFloat(locInfo.lat);
      const lon = parseFloat(locInfo.lon);
      const delta = 0.08;
      bbox = `(${lat - delta},${lon - delta},${lat + delta},${lon + delta})`;
    }

    // 2. Determine tag query
    const qLower = cleanQuery.toLowerCase();
    let tagFilters = this.categoryTagMap[qLower];
    if (!tagFilters) {
      // Find matching keyword or use generic commercial query
      for (const [key, tags] of Object.entries(this.categoryTagMap)) {
        if (qLower.includes(key) || key.includes(qLower)) {
          tagFilters = tags;
          break;
        }
      }
    }

    let overpassQuery = "";
    if (tagFilters && tagFilters.length > 0) {
      const nodeQueries = tagFilters
        .map((t) => `node[${t}][name]${bbox};`)
        .join("\n");
      const wayQueries = tagFilters
        .map((t) => `way[${t}][name]${bbox};`)
        .join("\n");
      overpassQuery = `
        [out:json][timeout:25];
        (
          ${nodeQueries}
          ${wayQueries}
        );
        out center ${limit};
      `;
    } else {
      // General name/shop/amenity search within bounding box
      overpassQuery = `
        [out:json][timeout:25];
        (
          node["name"~"${cleanQuery}",i]${bbox};
          way["name"~"${cleanQuery}",i]${bbox};
          node["shop"][name]${bbox};
          node["amenity"][name]${bbox};
          node["office"][name]${bbox};
        );
        out center ${limit};
      `;
    }

    const overpassEndpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let elements: any[] = [];
    let lastError: any = null;

    for (const endpoint of overpassEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "LeadGenPro-RealProspecting/1.0",
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
        });

        if (response.ok) {
          const result = await response.json();
          if (result && Array.isArray(result.elements)) {
            elements = result.elements;
            break;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (elements.length === 0 && lastError) {
      console.warn(
        "Overpass primary failed, trying fallback nodes:",
        lastError,
      );
    }

    const results: LeadSearchResult[] = [];
    const seenNames = new Set<string>();

    for (const el of elements) {
      const tags = el.tags || {};
      const name = tags.name || tags["name:en"] || tags["official_name"];
      if (!name) continue;

      const normName = name.toLowerCase().trim();
      if (seenNames.has(normName)) continue;
      seenNames.add(normName);

      const lat = el.lat || el.center?.lat || null;
      const lon = el.lon || el.center?.lon || null;

      // Extract real address
      const street = tags["addr:street"] || "";
      const housenumber = tags["addr:housenumber"] || "";
      const suburb = tags["addr:suburb"] || tags["addr:neighbourhood"] || "";
      const postcode = tags["addr:postcode"] || "";
      const addressParts = [housenumber, street, suburb, postcode].filter(
        Boolean,
      );
      const fullAddress =
        addressParts.length > 0
          ? addressParts.join(", ")
          : tags["addr:full"] || null;

      const detectedCity = tags["addr:city"] || locInfo.name || cleanLocation;

      // Extract real phone
      const phone =
        tags["phone"] ||
        tags["contact:phone"] ||
        tags["contact:mobile"] ||
        tags["mobile"] ||
        tags["telephone"] ||
        null;

      // Extract real website
      const website =
        tags["website"] || tags["contact:website"] || tags["url"] || null;

      // Extract real email
      const email = tags["email"] || tags["contact:email"] || null;

      // Extract real social profiles
      const instagram =
        tags["contact:instagram"] || tags["instagram"]
          ? `https://instagram.com/${(tags["contact:instagram"] || tags["instagram"]).replace("@", "")}`
          : null;
      const facebook = tags["contact:facebook"] || tags["facebook"] || null;
      const linkedin = tags["contact:linkedin"] || tags["linkedin"] || null;

      // Extract real category
      let category = cleanQuery;
      if (tags.amenity) {
        category =
          tags.amenity.charAt(0).toUpperCase() +
          tags.amenity.slice(1).replace(/_/g, " ");
      } else if (tags.shop) {
        category =
          tags.shop.charAt(0).toUpperCase() +
          tags.shop.slice(1).replace(/_/g, " ") +
          " Shop";
      } else if (tags.healthcare) {
        category =
          tags.healthcare.charAt(0).toUpperCase() +
          tags.healthcare.slice(1).replace(/_/g, " ");
      } else if (tags.office) {
        category =
          tags.office.charAt(0).toUpperCase() +
          tags.office.slice(1).replace(/_/g, " ") +
          " Office";
      }

      // Real Google Maps search URL from coordinates / name
      let googleMapsUrl: string | null = null;
      if (lat && lon) {
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      } else {
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + detectedCity)}`;
      }

      results.push({
        businessName: name,
        category: category || "Business",
        address: fullAddress,
        city: detectedCity,
        phone,
        email,
        website,
        instagram,
        linkedin,
        facebook,
        googleMapsUrl,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lon ? parseFloat(lon) : null,
        rating: null, // OSM does not store ratings; keep strictly null
        reviewCount: null, // keep strictly null
        externalId: `osm-${el.type}-${el.id}`,
        source: "OpenStreetMap Live",
      });

      if (results.length >= limit) break;
    }

    return results;
  }
}

// -------------------------------------------------------------
// 2. TomTom Search API Provider (When API Key is Provided)
// -------------------------------------------------------------
export class TomTomSearchProvider implements BusinessProvider {
  name = "TomTom Search API";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(
    query: string,
    location: string,
    limit: number,
  ): Promise<LeadSearchResult[]> {
    if (!this.apiKey) {
      throw new Error("TomTom API key is missing.");
    }

    const searchParams = new URLSearchParams({
      key: this.apiKey,
      limit: String(limit),
      language: "en-US",
    });
    const searchUrl = `https://api.tomtom.com/search/2/poiSearch/${encodeURIComponent(
      `${query} in ${location}`,
    )}.json?${searchParams.toString()}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      throw new Error(`TomTom Search API error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    return rawResults.slice(0, limit).flatMap((result: any) => {
      const position = result.position;
      const name = result.poi?.name;
      if (!name) return [];

      const latitude = typeof position?.lat === "number" ? position.lat : null;
      const longitude = typeof position?.lon === "number" ? position.lon : null;
      const city =
        result.address?.municipality || result.address?.localName || location;
      const googleMapsUrl =
        latitude !== null && longitude !== null
          ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`;
      const categories = result.poi?.categories;
      const category =
        Array.isArray(categories) && categories.length > 0
          ? categories[0].replace(/_/g, " ")
          : query;

      return [
        {
          businessName: name,
          category: category || "Business",
          address: result.address?.freeformAddress || null,
          city,
          phone: result.poi?.phone || null,
          email: null,
          website: result.poi?.url || null,
          instagram: null,
          linkedin: null,
          facebook: null,
          googleMapsUrl,
          latitude,
          longitude,
          rating: null,
          reviewCount: null,
          externalId: result.id || null,
          source: "TomTom Search API",
        },
      ];
    });
  }
}

// -------------------------------------------------------------
// 3. Google Search Grounded Provider (Gemini Grounding)
// Retrieves real verified live web businesses via Google Search
// -------------------------------------------------------------
export class GeminiGroundedSearchProvider implements BusinessProvider {
  name = "Google Search Grounding (Live Web Data)";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(
    query: string,
    location: string,
    limit: number,
  ): Promise<LeadSearchResult[]> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is required for live search grounding.");
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const prompt = `You are a real-time business prospecting research tool.
Find real, actual, verifiable businesses matching the category "${query}" located in "${location}".
Limit to ${limit} real businesses.

CRITICAL INSTRUCTIONS:
- You MUST only provide REAL, actual businesses found in Google Search results.
- DO NOT invent, fabricate, simulate, or generate fake business names, phone numbers, or websites.
- If a real phone number, website, or social link is not found in the search results, set that field to null.
- Return a strict JSON array of objects with the following keys:
  - "businessName": string (exact real business name)
  - "category": string (e.g. Dentists, Hair Salon, Italian Restaurant, etc.)
  - "address": string or null (real street address)
  - "city": string (e.g. "${location}")
  - "phone": string or null (real phone number)
  - "email": string or null (real public email if listed, else null)
  - "website": string or null (real official website URL)
  - "instagram": string or null (real public Instagram profile URL if found, else null)
  - "linkedin": string or null (real public LinkedIn company URL if found, else null)
  - "facebook": string or null (real public Facebook page URL if found, else null)
  - "googleMapsUrl": string or null (real Google Maps link or null)
  - "rating": number or null (Google review rating between 1.0 and 5.0 if listed, else null)
  - "reviewCount": number or null (number of reviews if listed, else null)
  - "source": string ("Google Search Grounding")
  - "externalId": string or null (unique identifier if available, else null)

Respond with ONLY the valid JSON array. No markdown code blocks, no backticks, no explanatory text.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let text = response.text || "";
      // Strip markdown code fences if model included them
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!text || text === "[]") {
        return [];
      }

      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any, idx: number) => ({
        businessName: item.businessName || "Business",
        category: item.category || query,
        address: item.address || null,
        city: item.city || location,
        phone: item.phone || null,
        email: item.email || null,
        website: item.website || null,
        instagram: item.instagram || null,
        linkedin: item.linkedin || null,
        facebook: item.facebook || null,
        googleMapsUrl:
          item.googleMapsUrl ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${item.businessName || ""} ${item.address || item.city || location}`,
          )}`,
        latitude: null,
        longitude: null,
        rating: typeof item.rating === "number" ? item.rating : null,
        reviewCount:
          typeof item.reviewCount === "number" ? item.reviewCount : null,
        externalId: item.externalId || `grounding-${idx}-${Date.now()}`,
        source: "Google Search Grounding",
      }));
    } catch (err) {
      console.error("Gemini grounding search error:", err);
      throw new Error(`Search provider failed: ${(err as Error).message}`);
    }
  }
}

// -------------------------------------------------------------
// Unified Provider Factory & Runner
// -------------------------------------------------------------
export async function executeBusinessSearch(
  query: string,
  location: string,
  limit: number = 25,
  preferredProvider?: string,
): Promise<{ leads: LeadSearchResult[]; providerUsed: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const tomtomKey = process.env.TOMTOM_API_KEY;
  const configuredType =
    preferredProvider || process.env.BUSINESS_PROVIDER_TYPE || "auto";

  // 1. If user prefers TomTom and the key exists
  if (configuredType === "tomtom" && tomtomKey) {
    const provider = new TomTomSearchProvider(tomtomKey);
    const leads = await provider.searchBusinesses(query, location, limit);
    return { leads, providerUsed: provider.name };
  }

  // 2. In auto mode, prefer TomTom for local business results when configured.
  if (configuredType === "auto" && tomtomKey) {
    const provider = new TomTomSearchProvider(tomtomKey);
    try {
      const leads = await provider.searchBusinesses(query, location, limit);
      if (leads.length > 0) {
        return { leads, providerUsed: provider.name };
      }
    } catch (tomtomError) {
      console.warn(
        "TomTom search failed, continuing with fallback providers:",
        tomtomError,
      );
    }
  }

  // 3. If user prefers Google Search Grounding with Gemini
  if (configuredType === "gemini_grounding" && geminiKey) {
    const provider = new GeminiGroundedSearchProvider(geminiKey);
    const leads = await provider.searchBusinesses(query, location, limit);
    return { leads, providerUsed: provider.name };
  }

  // 4. Default & Auto: Try OpenStreetMap Overpass (Real live global geographic database)
  const osmProvider = new OpenStreetMapProvider();
  try {
    const leads = await osmProvider.searchBusinesses(query, location, limit);
    if (leads.length > 0) {
      return { leads, providerUsed: osmProvider.name };
    }
  } catch (osmError) {
    console.warn(
      "OSM search failed or returned 0, attempting fallback provider if key available:",
      osmError,
    );
  }

  // 5. Fallback to Gemini Google Search Grounding if OSM had 0 or errored and Gemini key is present
  if (geminiKey) {
    try {
      const groundedProvider = new GeminiGroundedSearchProvider(geminiKey);
      const leads = await groundedProvider.searchBusinesses(
        query,
        location,
        limit,
      );
      return { leads, providerUsed: groundedProvider.name };
    } catch (err) {
      console.error("Gemini grounding fallback failed:", err);
    }
  }

  // 6. Final fallback to OSM (or return 0 results)
  const finalLeads = await osmProvider.searchBusinesses(query, location, limit);
  return { leads: finalLeads, providerUsed: osmProvider.name };
}
