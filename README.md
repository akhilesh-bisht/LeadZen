# LeadGen — Real-Data Lead Generation & Business Prospecting MVP

A full-stack, production-grade Lead Generation and CRM prospecting platform with **Zero Static / Fake Data**. Every business lead, phone number, address, website, rating, and social profile displayed in the UI is retrieved dynamically from real external business providers (OpenStreetMap Overpass API, Google Places API, and Google Search Grounding) and stored in MongoDB.

---

## Key Features

1. **Zero Mock/Static Data Guarantee**:
   - Strictly no fake records, demo datasets, or hardcoded mock placeholders.
   - If an external provider returns zero leads, the UI renders the clear empty state: *"No businesses found. Try another search."*
   - If contact details (phone, email, Instagram, LinkedIn) are not available from the provider, they remain strictly `null` and are clearly marked as unavailable in the UI.

2. **Multi-Provider Business Search (`lib/providers/business-provider.ts`)**:
   - **OpenStreetMap Overpass API (Live Real Data)**: Free global access without API key requirement for geolocated business lookup across any city and category worldwide.
   - **Google Places API**: Real place search and place details with verified Google ratings and review counts.
   - **Google Search Grounding**: Live, verified web discovery using Gemini 2.5 Flash with search grounding.

3. **Dynamic Dashboard Metrics (`/api/dashboard/stats`)**:
   - Total Leads, New Leads, Contacted, Interested, Not Interested, Converted metrics calculated dynamically from MongoDB.
   - Zero leads in the database dynamically displays `0` counts across all metrics.

4. **CRM Leads Management (`/leads` & `/leads/:id`)**:
   - Server-side filtering, text search across all attributes, sorting, and pagination.
   - Interactive status dropdowns with instant MongoDB persistence.
   - Persistent CRM activity notes log saved to the database.
   - Direct `<a href="tel:PHONE">` call action when real phone number exists, or explicit *"Phone number unavailable"* state.

5. **Excel Export (`/api/export`) via SheetJS**:
   - Export all database records, filtered leads, or selected rows to formatted `.xlsx` files with dynamic date stamping (`leads-YYYY-MM-DD.xlsx`).

6. **Flexible MongoDB & Persistent Storage**:
   - Connects directly to MongoDB Atlas via `MONGODB_URI`.
   - Automatic local persistent fallback (`.data/leads.json`) ensures seamless out-of-the-box operation even before configuring an external database cluster.

---

## Project Structure

```
├── lib/
│   ├── mongodb.ts                 # Mongoose connection & storage abstraction
│   ├── utils.ts                   # Formatting & SheetJS helpers
│   └── providers/
│       ├── business-provider.ts   # Live business search provider abstraction
│       └── social-provider.ts     # Public social profile enrichment
├── models/
│   └── Lead.ts                    # Mongoose Lead schema with duplicate indexing
├── src/
│   ├── components/                # Modular UI components (Tables, Cards, Modals)
│   ├── views/                     # Dashboard, Search, Leads, LeadDetails views
│   ├── types/                     # TypeScript types and interfaces
│   ├── App.tsx                    # Main navigation and state routing
│   └── main.tsx                   # React client entry point
├── server.ts                      # Express API server with Vite middleware
├── .env.example                   # Documented environment variables
└── package.json                   # Dependencies and build scripts
```

---

## Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# GEMINI_API_KEY: Required for Gemini AI API calls and Live Google Search Grounding.
GEMINI_API_KEY=""

# MONGODB_URI: MongoDB connection string (e.g. MongoDB Atlas)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/leadgen?retryWrites=true&w=majority"

# BUSINESS_PROVIDER_API_KEY: Optional API key for Google Places
BUSINESS_PROVIDER_API_KEY=""

# BUSINESS_PROVIDER_TYPE: 'auto' | 'osm' | 'google' | 'gemini_grounding'
BUSINESS_PROVIDER_TYPE="auto"
```

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 3. Production Build & Start
```bash
npm run build
npm start
```
