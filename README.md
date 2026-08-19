# CareConnect

Verification-first donation-matching platform for food, clothes, and books. Built for HackACE 2026 (Team Zephrix). Donors post donations, an algorithm auto-matches them to the nearest verified trust with a genuine need, and volunteers handle pickup/delivery with photo + OTP proof at every handoff.

This is a monorepo — clone once, get everything:

```
careconnect/
├── backend/    Express + Prisma API, matching engine, NGO Darpan verification
├── frontend/   React + Vite web app — donor, trust, and admin experiences
└── mobile/     Expo app — volunteer pickup/delivery flow
```

## Getting started

Each part has its own README with setup details. Quick version:

```bash
# 1. Backend
cd backend
npm ci
cp .env.example .env   # fill in DATABASE_URL, Cloudinary, JWT secret
npx prisma migrate dev
npm run dev             # http://localhost:5000

# 2. Frontend (separate terminal)
cd frontend
npm ci
cp .env.example .env    # VITE_API_URL should point at the backend above
npm run dev              # http://localhost:5173

# 3. Mobile (separate terminal, optional)
cd mobile
npm ci --legacy-peer-deps
npx expo start
```

## Stack
Node/Express/Prisma/PostgreSQL backend · React/Vite/Tailwind frontend · Expo/React Native mobile app. See each subfolder's README for details.
