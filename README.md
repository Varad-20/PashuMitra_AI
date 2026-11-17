# 🐄 PashuMitra AI – Smart Livestock Health & Farm Management System

A college demonstration project: a modern green-and-white SaaS dashboard to manage animals, scan QR ear-tags, record health observations, track vaccinations, monitor milk yield & daily farm profit, view analytics, and get multilingual voice-enabled AI health guidance.

> ⚠️ **Disclaimer:** The health warnings and AI results are informational only. They are **not** a veterinary diagnosis. A veterinarian must confirm any health concern.

## Key Features

- **Dashboard** – Total animals, healthy animals, attention needed, total farms, vaccinations due soon, **today's milk yield & profit**, health & category donut charts, recent alerts, upcoming vaccinations, and recent activity.
- **Animal Management** – Full CRUD (add / view / edit / delete), search, filter by species & health status, detailed animal profile with temperature trend chart.
- **1. QR Code Animal Identity** – Unique QR code generated for every animal, printable **Download QR Card** PNG from any animal profile, and a **QR Scanner** page (`/scan`) supporting live device camera scanning, QR image file upload, and one-click Quick Demo Scan.
- **2. Multilingual Voice AI Assistant** – Full interface and health assessment output in **English, Hindi (हिंदी), and Marathi (मराठी)** with browser Speech Recognition (`en-IN`, `hi-IN`, `mr-IN`) microphone input, editable transcript, Gemini API integration, and a multilingual rule-based fallback.
- **3. Milk Production & Profit Tracker** – Record morning & evening milk yields, selling price per litre, and daily feed expenses; auto-calculates total daily milk, estimated revenue, and net profit; displays **Weekly (7-day)** and **Monthly (4-week)** charts.
- **4. Digital Animal Health Passport** – Dedicated **Health History (Digital Passport)** tab on every animal profile displaying a unified chronological timeline of **Health Observations, Vaccinations, Veterinary Treatments, and AI Assessments**, with category filters and quick-add modals.
- **Health Monitoring & Vaccinations** – Rule-based attention warnings, vaccination status tracking (Completed / Due Soon / Overdue).
- **Reports & Analytics** – Recharts visualizations across species, health status, vaccinations, and weekly health records.
- **Demo Mode (`localStorage`)** – Works seamlessly even if MongoDB or the backend is offline.

## Technology Stack

React 19 + Vite · Tailwind CSS 3 · React Router · Recharts · Lucide React · `qrcode.react` · `html5-qrcode` · Web Speech API · Axios · Node.js · Express · MongoDB + Mongoose · Gemini API (optional)

## Installation & Running

```powershell
# 1. Start Backend (Terminal 1)
cd backend
npm install
npm run seed     # optional: seeds sample data into MongoDB
npm run dev

# 2. Start Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.
