import { GoogleGenAI } from "@google/genai";

export interface SocialEnrichmentResult {
  instagram: string | null;
  linkedin: string | null;
  facebook: string | null;
  email: string | null;
  source: string;
}

const SOCIAL_HOSTS: Record<
  keyof Pick<SocialEnrichmentResult, "instagram" | "linkedin" | "facebook">,
  string[]
> = {
  instagram: ["instagram.com", "www.instagram.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.me"],
};

function extractSocialLinks(
  html: string,
  website: string,
): Pick<SocialEnrichmentResult, "instagram" | "linkedin" | "facebook"> {
  const links =
    html.match(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi) || [];
  const result = { instagram: null, linkedin: null, facebook: null } as Pick<
    SocialEnrichmentResult,
    "instagram" | "linkedin" | "facebook"
  >;

  for (const link of links) {
    const match = link.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!match) continue;

    try {
      const url = new URL(match[1], website);
      const type = (
        Object.keys(SOCIAL_HOSTS) as Array<keyof typeof SOCIAL_HOSTS>
      ).find((name) => SOCIAL_HOSTS[name].includes(url.hostname.toLowerCase()));
      if (type && !result[type]) {
        result[type] = url.toString();
      }
    } catch {
      // Ignore malformed or non-URL hrefs.
    }
  }

  return result;
}

export class SocialProvider {
  static async scrapeWebsiteSocialLinks(
    website?: string | null,
  ): Promise<
    Pick<SocialEnrichmentResult, "instagram" | "linkedin" | "facebook">
  > {
    const empty = { instagram: null, linkedin: null, facebook: null } as Pick<
      SocialEnrichmentResult,
      "instagram" | "linkedin" | "facebook"
    >;
    if (!website) return empty;

    try {
      const websiteUrl = new URL(
        /^https?:\/\//i.test(website) ? website : `https://${website}`,
      );
      if (!["http:", "https:"].includes(websiteUrl.protocol)) return empty;

      const response = await fetch(websiteUrl, {
        headers: { "User-Agent": "LeadGenPro-RealProspecting/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return empty;

      const html = await response.text();
      return extractSocialLinks(html, websiteUrl.toString());
    } catch (err) {
      console.warn(`Website social scraping failed for ${website}:`, err);
      return empty;
    }
  }

  /**
   * Enriches social profiles using verified public web discovery.
   * STRICT COMPLIANCE:
   * - Only uses publicly available web information.
   * - Does not bypass CAPTCHA, logins, or anti-bot protections.
   * - Never fabricates fake profile URLs.
   * - If a social profile is not found, returns null.
   */
  static async enrichSocialProfiles(
    businessName: string,
    city: string,
    website?: string | null,
  ): Promise<SocialEnrichmentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        instagram: null,
        linkedin: null,
        facebook: null,
        email: null,
        source: "Unavailable (No API Key)",
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Find real public social media and contact links for the business "${businessName}" in "${city}"${
        website ? ` (Official website: ${website})` : ""
      }.

STRICT ACCURACY RULES:
- ONLY return official, verified public URLs found in search.
- DO NOT fabricate, guess, or invent fake handles or placeholder links.
- If an Instagram, LinkedIn, Facebook, or Email is not found, set that field to null.

Return ONLY a JSON object with this exact structure:
{
  "instagram": "https://instagram.com/..." or null,
  "linkedin": "https://linkedin.com/company/..." or null,
  "facebook": "https://facebook.com/..." or null,
  "email": "contact@..." or null
}
No markdown backticks, no other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      let text = response.text || "";
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      if (!text) {
        return {
          instagram: null,
          linkedin: null,
          facebook: null,
          email: null,
          source: "Public Web Search",
        };
      }

      const parsed = JSON.parse(text);
      return {
        instagram:
          typeof parsed.instagram === "string" &&
          parsed.instagram.startsWith("http")
            ? parsed.instagram
            : null,
        linkedin:
          typeof parsed.linkedin === "string" &&
          parsed.linkedin.startsWith("http")
            ? parsed.linkedin
            : null,
        facebook:
          typeof parsed.facebook === "string" &&
          parsed.facebook.startsWith("http")
            ? parsed.facebook
            : null,
        email:
          typeof parsed.email === "string" && parsed.email.includes("@")
            ? parsed.email
            : null,
        source: "Public Web Search Grounding",
      };
    } catch (err) {
      console.warn("Social enrichment failed:", err);
      return {
        instagram: null,
        linkedin: null,
        facebook: null,
        email: null,
        source: "Search Unreachable",
      };
    }
  }
}
