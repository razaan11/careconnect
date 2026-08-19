# CareConnect — Mobile (Volunteer app)

Expo / React Native app for CareConnect volunteers — pickup and delivery, with photo + OTP proof at every handoff. Donors, trusts, and admins use the separate [web frontend](https://github.com/razaan11/careconnect-frontend) instead.

## Stack
Expo (React Native), expo-router, expo-location, expo-camera.

## Setup

```bash
npm ci --legacy-peer-deps
npx expo start
```

The `--legacy-peer-deps` flag is required — Expo Router's optional web dev-tools (which this native-only app doesn't use) pull in a newer React peer dependency than the app is pinned to. This is an upstream Expo inconsistency, not a real conflict; `expo-doctor` passes clean (21/21) with this install.

Scan the QR code with **Expo Go** on your phone. This is a native-only app — don't press `w` for the web preview, it isn't set up to run in a browser and will fail to bundle.

Before testing on a physical device, edit `lib/api.js`'s `API_BASE_URL` from `localhost` to your dev machine's LAN IP — a phone can't reach your laptop's `localhost`.

Requires the [backend](https://github.com/razaan11/careconnect) running.

## Flow
GPS-sorted pickup list → accept → OTP hand-off confirmation → camera capture → photo-proof upload → delivery confirmation → history/profile.
