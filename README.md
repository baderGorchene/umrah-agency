# Umrah Compagnon (مسك طيبة للعمرة)

Umrah Compagnon is a modern SaaS management platform for Tunisian Umrah travel agencies. It helps manage pilgrims, guides, trips, passport/document scanning (OCR), badge/QR generation, and agency communications.

See the detailed AI & OCR design in [GEMINI.md](/home/bunshee/umrah-compagnon/GEMINI.md).

## Key Features
- Pilgrim & staff management (personal info, passports, rooms)
- Trip and flight management with seat allocation
- Passport OCR and structured data extraction (Gemini API)
- Document storage and badge/QR code generation
- Multi-language support (Arabic/French)

## Tech Stack
- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express, TypeScript
- AI/OCR: Google Gemini via `@google/genai` (server-side only)

## Quick Start

Prerequisites:
- Node.js v18+
- A Gemini API key (set in environment variable `GEMINI_API_KEY`)

Install:

    npm install

Run development server (Express + Vite middleware):

    npm run dev

Build for production:

    npm run build

Start production server:

    npm run start

Run type-check / lint:

    npm run lint

Clean build output:

    npm run clean

## Environment
Create a `.env` or `.env.local` file in the project root with:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Important: keep `GEMINI_API_KEY` secret and never expose it to the client. The server proxies requests to the Gemini API.

## Files of Interest
- [GEMINI.md](/home/bunshee/umrah-compagnon/GEMINI.md) — Detailed AI/OCR architecture and API usage
- [server.ts](/home/bunshee/umrah-compagnon/server.ts) — Express backend and OCR endpoint
- [src/](/home/bunshee/umrah-compagnon/src/) — React frontend source

## Contributing
- Follow project coding style and keep secrets out of the repo
- Update `src/types.ts` when changing data schemas


## License
Specify project license here.

