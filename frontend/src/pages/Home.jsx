import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getStoredUser } from '../api/hooks/useAuth'
import ChainTimeline from '../components/ChainTimeline'

const ROLE_HOME = {
  DONOR: '/donor',
  TRUST: '/trust',
  VOLUNTEER: '/volunteer-info',
  ADMIN: '/admin',
}

const CYCLE_STATUSES = ['PENDING', 'MATCHED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'DELIVERED']
const CYCLE_INTERVAL_MS = 2600

const LAYERS = [
  {
    tag: 'TRUST',
    title: 'Trust verification',
    body: 'Every orphanage and trust is checked against an NGO Darpan ID before it can appear on the platform or receive a match.',
  },
  {
    tag: 'MATCH',
    title: 'Need-matching engine',
    body: "Surplus is routed to whichever nearby verified trust needs it most right now — scored by distance and urgency, not first-come-first-served.",
  },
  {
    tag: 'SAFE',
    title: 'Food safety check',
    body: 'Food listings are screened against expiry and freshness automatically. Unsafe items are rejected before they ever reach a recipient.',
  },
  {
    tag: 'PROOF',
    title: 'Delivery evidence',
    body: 'GPS-tracked pickup, a photo at handoff, and an OTP the trust confirms — every donation closes with proof, not a promise.',
  },
]

const JOURNEY = [
  { label: 'Donate', note: 'Post food, clothes, or books from your address' },
  { label: 'Matched', note: 'Routed to the nearest verified trust in need' },
  { label: 'Verified pickup', note: 'A volunteer confirms handoff with an OTP' },
  { label: 'Delivered', note: 'Photo-confirmed receipt closes the loop' },
]

function LiveManifest() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLE_STATUSES.length)
    }, CYCLE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="rounded-2xl border border-hairline bg-paper p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-dashed border-hairline pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text/40">
            Donation manifest
          </p>
          <p className="mt-0.5 font-mono text-xs text-text/60">#A1B2C3 · 25 kg rice, dry rations</p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
          Live
        </span>
      </div>
      <div className="pt-5">
        <ChainTimeline status={CYCLE_STATUSES[index]} updatedAt={null} />
      </div>
    </div>
  )
}

export default function Home() {
  const token = localStorage.getItem('careconnect_token')
  const user = getStoredUser()
  if (token && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }

  return (
    <div className="bg-background">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold tracking-tight text-primary">
            CareConnect
          </span>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="focus-ring rounded-md px-3 py-1.5 text-sm font-medium text-text/70 hover:text-text"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="focus-ring rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Verification-first donation matching
              </p>
              <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-text sm:text-5xl">
                Every donation gets a manifest. Every handoff gets a stamp.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-text/60">
                CareConnect routes surplus food, clothes, and books to verified trusts that
                actually need them right now — and proves, with GPS, a photo, and an OTP, that it
                got there.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="focus-ring rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Start donating
                </Link>
                <Link
                  to="/login"
                  className="focus-ring rounded-lg border border-hairline bg-paper px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary/30"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <LiveManifest />
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-hairline bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
              Why this exists
            </p>
            <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <p className="font-display text-2xl font-medium leading-snug text-text">
                India wastes <span className="text-error">78–80 million tons</span> of food a
                year, while <span className="text-error">194 million people</span> go
                undernourished.
              </p>
              <p className="text-base leading-relaxed text-text/60">
                Not from scarcity — from a broken system. No platform verifies who's actually
                receiving donations, no engine routes surplus to real-time need, and nothing
                confirms a donation was ever delivered. So donors hesitate, unsafe items slip
                through, and impact goes unmeasured.
              </p>
            </div>
          </div>
        </section>

        {/* Four layers */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
            The four safeguards
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium text-text sm:text-3xl">
            Nothing moves without a check.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LAYERS.map((layer) => (
              <div key={layer.tag} className="rounded-xl border border-hairline bg-paper p-6">
                <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-primary">
                  {layer.tag}
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-text">{layer.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text/60">{layer.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Journey */}
        <section className="border-y border-hairline bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
              A donor's path
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium text-text sm:text-3xl">
              From your doorstep to a confirmed delivery.
            </h2>

            <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map((step, i) => (
                <li key={step.label} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent/60 font-mono text-xs text-accent">
                      {i + 1}
                    </span>
                    {i < JOURNEY.length - 1 && (
                      <span
                        className="hidden h-px flex-1 border-t border-dashed border-hairline sm:block"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="mt-3 font-display text-base font-medium text-text">{step.label}</p>
                  <p className="mt-1 text-sm text-text/60">{step.note}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA band */}
        <section className="bg-primary">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">
              Give, receive, or deliver — every role starts with one sign-up.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
              Donors, trusts, and volunteers all register through the same verified chain.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="focus-ring rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className="focus-ring rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <span className="font-display text-sm font-semibold text-text/70">CareConnect</span>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text/30">
            Zephrix · HackACE 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
