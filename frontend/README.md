# CareConnect — Frontend

React + Vite + Tailwind web app for CareConnect, a verification-first donation-matching platform. Covers the donor, trust, and admin experiences (volunteers use the separate mobile app).

## Stack
React 18, Vite, Tailwind CSS, React Router, TanStack Query, Axios.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to your running backend
npm run dev
```

Requires the [backend](https://github.com/razaan11/careconnect) running (default `http://localhost:5000`).

## What's here
- **Donor**: dashboard, multi-item donation form with a live nearby-trust match preview (and the option to pick a specific trust yourself), a "Who needs help" browse page, donation status timeline
- **Trust**: dashboard with NGO Darpan verification status, post/manage needs, generate pickup OTPs
- **Admin**: platform stats, trust verification queue
