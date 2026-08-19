# CareConnect — Full Documentation

Verification-first donation-matching platform for food, clothes, and books. Built for **HackACE 2026** (Team Zephrix, Domain 1 — Open Challenge Solutions).

This document covers everything actually built — architecture, database, API, algorithms, and the honest limitations — as a technical reference beyond the quick-start in the root [README](README.md).

---

## 1. The problem this solves

India wastes 78–80 million tons of food annually while ~194 million people go undernourished — not from scarcity, but from three broken-system failures: no platform verifies trusts/orphanages before they receive donations, no engine matches surplus to real-time need, and no reliable method confirms a donation was actually delivered.

CareConnect addresses this with four layers: **trust verification**, **need-matching**, **food-safety screening**, and **delivery evidence** (GPS + photo + OTP).

---

## 2. Repository structure

This is a single monorepo — one clone gets the whole project:

```
careconnect/
├── backend/     Express + Prisma API
├── frontend/    React web app — donor, trust, admin
└── mobile/      Expo app — volunteer pickup/delivery
```

Each subfolder has its own `README.md`, `.env.example`, and `.gitignore`. Backend, frontend, and mobile are independently runnable — see the root README's "Getting started" section.

---

## 3. Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js v24, Express 5 |
| ORM / migrations | Prisma 6 |
| Database | PostgreSQL, hosted on Supabase |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File uploads | Multer → Cloudinary |
| Email | Nodemailer / Gmail SMTP (optional — see §9) |
| Scheduled jobs | node-cron |
| Geocoding | OpenStreetMap Nominatim (free, no API key) |
| Frontend | React + Vite, Tailwind CSS, React Router, TanStack Query, Axios |
| Mobile | Expo (React Native), expo-router, expo-location, expo-camera |
| Design system | Fraunces (display) + Inter (body) + IBM Plex Mono (data/verification) |

---

## 4. Database schema

Six models (`backend/prisma/schema.prisma`):

- **User** — `role` (DONOR / TRUST / VOLUNTEER / ADMIN), auth fields, optional legacy `lat`/`lng`/`address` (superseded by per-donation and per-trust address fields below).
- **Trust** — one per NGO/orphanage. `darpanId` (NGO Darpan ID), `landmark`/`pincode`/`district`/`state` (its own physical address, geocoded to `lat`/`lng`), `isVerified`/`verifiedAt`/`verifiedBy`.
- **TrustNeed** — a trust's stated need: `type` (FOOD/CLOTHES/BOOKS), `urgency` (LOW/MEDIUM/HIGH/CRITICAL), `isActive`.
- **Donation** — one per item (a donor donating food + books creates two rows, one per item). Carries its own `landmark`/`pincode`/`district`/`state` + geocoded `lat`/`lng` (a donor can donate from a different address each time), `status` (PENDING → MATCHED → PICKUP_SCHEDULED → PICKED_UP → DELIVERED, or EXPIRED), `matchedTrustId`, `pickupOtp`/`deliveryOtp`, `photos[]`.
- **VolunteerProfile** — `vehicleType`, live `currentLat`/`currentLng`, `isAvailable`, `totalDeliveries`.
- **DeliveryLog** — one per completed delivery, with photo proof URL and completion timestamp.

Three migrations applied against the live Supabase database: `init`, `add_address_fields` (pincode-based addressing), `rename_regnumber_to_darpanid` (NGO Darpan rename).

---

## 5. The matching engine

`backend/src/services/matchingEngine.js` — pairs a donation with the best verified trust using a 0–80 point score (also exposed as a 0–100% "match %" via `toMatchPercent`):

| Component | Points | Rule |
|---|---|---|
| Category + active-need match | mandatory | Trust must have an active need of the same type, or the trust scores `null` (excluded) |
| Distance | up to 40 | Haversine great-circle distance; `40 − distanceKm × 4`, floored at 0. Auto-matching excludes anything past 10km (`MAX_MATCH_DISTANCE_KM`) |
| Urgency | up to 30 | LOW=5, MEDIUM=15, HIGH=25, CRITICAL=30 |
| Verification | 10 | Always awarded, since only verified trusts are queried |

Two entry points share this scoring:
- **`matchDonation(donation)`** — used at creation time, auto-assigns the single best-scoring trust (or leaves the donation `PENDING` for manual admin routing if none qualifies).
- **`scoreNeed(need, trust, donorLat, donorLng)`** — used by the donor-facing "browse needs" / live-preview features; ranks *every* active need (no type filter, no hard distance cutoff — farther just scores lower) so a donor can see the full picture before donating.

**Donor override:** a donor can pick a specific trust from the live match preview instead of accepting auto-match. The chosen `preferredTrustId` is validated server-side (`resolvePreferredTrust` in `donations.controller.js`) — still verified, still has that need active — before being honored; a stale/invalid choice silently falls back to auto-match rather than failing the request.

---

## 6. NGO Darpan verification — what's real vs. simulated

**Honestly:** there is no public, self-serve API for India's real NGO Darpan government registry — integrating with it for real requires formal government registration that wasn't available for this project. `backend/src/services/darpanService.js` does the part that's genuinely checkable without that access:

1. **Format validation** — real Darpan IDs follow `XX/YYYY/NNNNNNN` (2-letter state code / registration year / 7-digit serial). Anything not matching this is rejected outright at signup.
2. **Mock registry lookup** — a small hardcoded `Set` of "known valid" IDs stands in for a real government database query.
3. **Outcome**: a format-valid ID found in the mock registry **auto-verifies the trust instantly** (`isVerified: true`, `verifiedBy: 'system:darpan-registry'`). A format-valid ID *not* in the registry still creates the trust, just unverified — it queues in the existing admin review flow (`/admin/trusts/pending` → `POST /trusts/:id/verify`).

This applies at both registration paths: the inline trust creation during `/auth/register` (role=TRUST) and the standalone `/trusts/register` endpoint.

---

## 7. Location: pincode instead of GPS

Donors and trusts never touch coordinates or a "use my location" button. Both fill in a structured address (landmark, pincode, district, state) — like an e-commerce checkout — and `backend/src/services/geocode.js` resolves it to `lat`/`lng` server-side via OpenStreetMap Nominatim (no hardcoded country filter, since the seed data happens to use Sri Lankan addresses despite the project's India-focused pitch). If geocoding fails, the record is still created with `lat`/`lng` left null, degrading gracefully to manual admin routing rather than blocking the request.

The mobile app's live GPS-based pickup sorting is untouched by this — that's a volunteer's real-time location, a genuinely different use case from a donor declaring a fixed address.

---

## 8. Full API reference

Base path `/api`. Auth via `Authorization: Bearer <token>` (JWT from login/register).

**Auth** (`/auth`)
- `POST /register` — body includes `role`; if `TRUST`, also `orgName`, `darpanId`, `trustPincode/District/State`; if `VOLUNTEER`, `vehicleType`. Returns `{token, user, trustVerification?}`.
- `POST /login`
- `GET /me` (auth)

**Donations** (`/donations`)
- `GET /browse-needs` (auth, DONOR) — query: `pincode` (required), `district`, `state`. Ranked list of every active need with `matchPercent`, `distKm`.
- `POST /` (auth, DONOR) — body: `{items: [{type, title, description?, quantity, unit, expiryDate?, preferredTrustId?}], landmark?, pincode, district, state}`. Creates + matches one Donation per item.
- `GET /` (auth) — role-aware list (donor: own; trust: matched-to-them; volunteer: available + assigned; admin: all).
- `POST /:id/photo-proof` (auth, VOLUNTEER) — multipart `photos` field, up to 5 files.
- `POST /:id/confirm-delivery` (auth, VOLUNTEER) — body: `{otp}`.

**Trusts** (`/trusts`)
- `POST /register` (auth, TRUST) — standalone registration (separate from the inline auth/register flow).
- `GET /me` (auth, TRUST) — the caller's own trust profile, for the dashboard verification badge.
- `POST /:id/verify` (auth, ADMIN)
- `POST /needs` (auth, TRUST), `GET /needs` (auth, TRUST), `DELETE /needs/:id` (auth, TRUST)
- `POST /donations/:donationId/generate-otp` (auth, TRUST) — generates and emails (best-effort) the pickup OTP.

**Volunteers** (`/volunteers`)
- `POST /register` (auth, VOLUNTEER)
- `GET /pickups` (auth, VOLUNTEER) — query `lat`, `lng`; GPS-sorted available pickups.
- `POST /pickups/:id/accept` (auth, VOLUNTEER) — generates deliveryOtp.
- `GET /history` (auth, VOLUNTEER)

**Admin** (`/admin`)
- `GET /trusts/pending` (auth, ADMIN)
- `GET /stats` (auth, ADMIN) — `{totalDonations, activeTrusts, pendingVerifications, activeVolunteers, deliveredToday}`.

---

## 9. Frontend features

- **Donor**: dashboard; multi-item donation form (checkbox any combination of Food/Clothes/Books, one shared address) with a debounced **live match-preview panel** — collapsed to the top match per type by default, alternatives behind a "choose a different trust" expand; a **"Who needs help"** browse page ranking every need by the same score, with a "Donate" CTA that carries the type/address/trust choice into the donation form; donation detail with a chain-of-custody status timeline.
- **Trust**: dashboard with a live NGO Darpan verification badge; post/manage needs; generate pickup OTPs.
- **Admin**: platform stats; trust verification queue (only shows trusts that didn't auto-verify).

Design principle in effect throughout: minimize cognitive load — default to the recommended option, tuck alternatives behind an explicit expand action rather than showing everything flat.

## 10. Mobile app (volunteer)

Native-only Expo app (not built for web — see its README). Flow: GPS-sorted pickup list → accept → local OTP hand-off gate → camera capture → photo-proof upload → delivery confirmation → history/profile.

---

## 11. Known limitations (stated plainly)

- **NGO Darpan** is simulated (format check + mock registry), not a live government connection — see §6.
- **Gmail SMTP** is still a placeholder in `.env.example` — doesn't block anything functionally, since OTPs are also returned directly in API responses (the "generate OTP" screen shows it to the trust regardless of whether email sends).
- **Mobile app** has been verified compiling (`expo-doctor`: 21/21, Metro bundle: clean) but not exercised end-to-end on a real device/simulator — none was available during development.
- **Geocoding** depends on a free public API (Nominatim) with no SLA — fine for a hackathon demo, not production-grade.
- Deployment (Railway/Vercel/EAS) hasn't happened — everything currently runs locally against the live Supabase database.

---

## 12. Bugs found and fixed along the way (worth knowing)

- A response-shape mismatch between backend (`{donations: [...]}`) and frontend/mobile (expecting a raw array) crashed the donor dashboard and would have crashed several other screens — fixed across 6 files.
- Three pages (Login, Register, PostNeed) read `error.response.data.message` for error banners, but the backend has always returned `{error: "..."}"` — meaning real error messages were silently swallowed in favor of generic fallback text. Fixed in all three.
- The geocoding service was initially hardcoded to filter results to India (`countrycodes: 'in'`), which silently broke matching for the actual seed data (Sri Lankan addresses) — removed the hardcoded filter.
- Mobile's `npm install`/`npm ci` hits an ERESOLVE conflict from Expo Router's optional web dev-tools wanting a newer React peer than the app is pinned to — documented that `--legacy-peer-deps` is required (verified clean with `expo-doctor`).

---

## 13. Demo credentials

All seeded accounts share the password `Password123!`:

| Role | Email |
|---|---|
| Admin | `admin@careconnect.org` |
| Donor | `amara.donor@careconnect.org`, `nadeesha.donor@careconnect.org`, `ruwan.donor@careconnect.org` |
| Volunteer | `kasun.volunteer@careconnect.org`, `dilani.volunteer@careconnect.org` |

Seed data: 1 admin, 2 verified trusts (Hope Children's Home, Sunshine Elders Shelter) with active needs, 3 donors, 2 volunteers, 5 donations spanning every status.
