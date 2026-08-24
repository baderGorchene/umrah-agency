# 🕋 Umrah Compagnon (مسك طيبة للعمرة)

> **A modern, AI-powered SaaS management platform tailored for Umrah travel agencies and pilgrim operators.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20OCR-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![i18n](https://img.shields.io/badge/i18n-Arabic%20%26%20French-4B5563)](https://www.i18next.com/)

---

## 📖 Overview

**Umrah Compagnon** is an end-to-end management solution designed specifically for Umrah travel agencies (e.g., *مسك طيبة للعمرة*). It streamlines pilgrim intake, passport digitization, flight & hotel arrangements, staff supervision, automated QR badge generation, document archiving, and real-time broadcasts.

The platform is fully bilingual (**Arabic RTL** & **French LTR**) and integrates **Google Gemini AI** for smart OCR extraction from Tunisian and international passports.

---

## ✨ Key Features

### 🤖 1. AI-Powered Passport Scanner & OCR
- **Gemini AI Vision Extraction**: Instant extraction of Latin & Arabic names, CIN (National ID), passport number, birth date, issuing authority, dates of issue/expiry, and MRZ lines.
- **Interactive Cropper**: Built-in image cropper (`react-image-crop`) to focus on the passport data page for high-accuracy OCR.
- **Batch Scanning & Import**: Import multiple passports simultaneously into the centralized passport registry or directly create pilgrim profiles.
- **Local OCR Fallback**: Integrated Tesseract.js client-side OCR fallback support.

### 👥 2. Pilgrim Management (*إدارة المعتمرين*)
- **Complete Pilgrim Profiles**: Track passport information, assigned trip, hotel room assignments, emergency contacts, and gender.
- **Financial & Payment Tracking**: Monitor paid and unpaid amounts per pilgrim with visual payment status badges.
- **Status Workflows**: Categorize pilgrims by status (*مؤكد* / Confirmed, *في الانتظار* / Waiting, *ملغى* / Cancelled).
- **Import & Export**: Instant export to Microsoft Excel (`.xlsx`) and bulk data import.

### 🧕 3. Staff & Guide Supervision (*المرافقين والمشرفين*)
- **Role Hierarchy**: Group Leaders (*رئيس مجموعة*), Religious Guides (*شيخ*), and Escorts (*مرافق/ة*).
- **Direct Contact Links**: 1-click WhatsApp and phone communication links.
- **Trip Assignments**: Assign guides to specific trips with seat capacity indicators.

### ✈️ 4. Trip & Flight Logistics (*إدارة الرحلات*)
- **Hotel Stays**: Manage Makkah and Madinah hotel reservations, check-in dates, and room allocations.
- **Flight & Transport Logistics**: Track flight numbers, dates, bus capacities, and real-time passenger counts.

### 🪪 5. QR Code Badges & ID Passports (*مركز الشارات والبطاقات*)
- **Design Studio**: Multiple badge templates (Classic, Modern, Islamic Green, Gold VIP, Minimalist).
- **Dynamic Scannable Badges**: Each badge contains a secure QR code redirecting to a digital verification page (`/badge/:code`) displaying pilgrim data, medical/emergency contacts, and assigned guide details.
- **Bulk PDF & ZIP Export**: Export individual or batch high-resolution printable ID badges via `jsPDF`, `html2canvas-pro`, and `JSZip`.

### 📂 6. Cloud Document Management (*أرشيف الوثائق*)
- **Secure File Storage**: Store passport scans, visas, airline tickets, vaccination records, and contracts via Supabase Storage.
- **Search & Filtering**: Search documents by pilgrim name, trip ID, or document category with full preview and download capabilities.

### 📢 7. Announcements & Notifications (*الأخبار والتنبيهات*)
- **Trip News Feed**: Publish announcements, assembly instructions, and schedule updates to pilgrims and staff.
- **Push Alerts & Urgent SOS**: Send emergency alerts and operational notifications.

### 🔐 8. Multi-Role Authentication & Security
- **Role-Based Access Control (RBAC)**: Admin, Agency Agent, and Pilgrim roles.
- **Security PIN Lock**: Protect sensitive agency settings and administrative actions with a master PIN.
- **User Account Confirmation**: Admins can approve and activate new staff/agent accounts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling & Icons** | [TailwindCSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Animations** | [Motion (Framer Motion)](https://motion.dev/) |
| **Database & Auth & Storage** | [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Storage) |
| **AI / OCR Engine** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`), [Tesseract.js](https://tesseract.projectnaptha.com/) |
| **Document & Export Utilities** | `jspdf`, `html2canvas-pro`, `jszip`, `xlsx`, `qrcode`, `react-image-crop` |
| **Internationalization (i18n)** | `i18next`, `react-i18next` (Arabic RTL / French LTR) |

---

## 📂 Project Structure

```
umrah-compagnon/
├── public/                     # Static public assets (logos, icons, templates)
├── src/
│   ├── components/             # UI Views and Modals
│   │   ├── BadgeArtwork.tsx    # Printable badge canvas renderer
│   │   ├── BadgePage.tsx       # Public pilgrim QR verification page
│   │   ├── DashboardView.tsx   # Overview metrics, stats, & active trip widgets
│   │   ├── DocumentsView.tsx   # Document vault & cloud storage browser
│   │   ├── LoginView.tsx       # Auth gateway & login form
│   │   ├── NotificationDrawer.tsx # Slide-over notification hub
│   │   ├── PassportScannerModal.tsx # AI Gemini passport OCR camera/upload modal
│   │   ├── PassportsView.tsx   # Centralized passport database & batch importer
│   │   ├── PilgrimsView.tsx    # Pilgrim directory, filters & editor
│   │   ├── QrCenterView.tsx    # Badge design studio & bulk generator
│   │   ├── SecurityModal.tsx   # Master PIN / Security access settings
│   │   ├── SettingsView.tsx    # Agency profile, header, footer & preferences
│   │   ├── Sidebar.tsx         # Responsive navigation sidebar
│   │   ├── StaffView.tsx       # Guides & agency personnel management
│   │   ├── TopBar.tsx          # Top navigation bar with search & language switch
│   │   ├── TripsView.tsx       # Umrah trip catalog & seat allocation
│   │   └── UsersManagementSection.tsx # User role & confirmation management
│   ├── i18n/                   # Translation strings (Arabic & French)
│   ├── lib/                    # Core libraries (Supabase client, QR generator)
│   ├── services/               # Supabase service layer (pilgrims, trips, staff, auth, docs)
│   ├── App.tsx                 # Main application layout, state & routing
│   ├── mockData.ts             # Default fallback dataset
│   ├── types.ts                # TypeScript domain models & interfaces
│   └── main.tsx                # React root entry point
├── supabase/
│   ├── migrations/             # SQL database schema and RBAC migrations
│   └── seed.sql                # Initial database seed dataset
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration with TailwindCSS v4 plugin
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies and npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** or **pnpm**
- **Supabase Account & Project** ([supabase.com](https://supabase.com/))
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/baderGorchene/umrah-agency.git
cd umrah-compagnon

# Install dependencies
npm install
```

---

### 2. Environment Configuration

Create a `.env` file in the root of the project:

```env
# Google Gemini AI (Required for Passport OCR)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Supabase Service Role Key (for backend operations / admin tools)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> 🔒 **Security Notice:** Ensure `.env` is listed in `.gitignore` and never commit private API keys to source control.

---

### 3. Supabase Database Setup

Run the SQL migration scripts located in `supabase/migrations/` in order within your Supabase SQL Editor:

1. `20260807_initial_schema.sql` — Creates tables (`trips`, `pilgrims`, `staff`, `documents`, `posts`, `agency_settings`, `generated_badges`).
2. `20260812_profiles_and_roles.sql` — Sets up user roles, authentication triggers, and RLS policies.
3. `20260815_add_pilgrim_payment_columns.sql` — Adds payment tracking (`paid_amount`, `unpaid_amount`).
4. `20260815_update_staff_roles_constraint.sql` — Configures staff role enumerations.
5. `20260816_add_is_confirmed_to_profiles.sql` — Adds account approval workflow.

*(Optional)* Run `supabase/seed.sql` to populate sample trips, staff, and pilgrims.

---

### 4. Running the Application

```bash
# Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles TypeScript and builds production bundle in `dist/` |
| `npm run preview` | Locally previews the production build |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Cleans up the `dist/` build directory |

---

## 🌐 Localization (i18n)

Umrah Compagnon includes comprehensive bilingual support:
- **العربية (Arabic - RTL)**: Native right-to-left layout and terminology designed for Middle Eastern and North African agency operations.
- **Français (French - LTR)**: Left-to-right layout for French-speaking staff and administration.

Switch languages anytime using the language toggle in the navigation bar.

---

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

---

<div align="center">
  <sub>Built with ❤️ for Umrah agencies & pilgrims. مسك طيبة للعمرة</sub>
</div>
