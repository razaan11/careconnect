const WAYPOINTS = [
  { label: 'Listed', code: 'WP-01' },
  { label: 'Verified handoff', code: 'WP-02' },
  { label: 'Delivered', code: 'WP-03' },
]

export default function BrandPanel({ eyebrow, heading, body }) {
  return (
    <div className="relative hidden overflow-hidden bg-primary px-12 py-16 lg:flex lg:flex-col lg:justify-between">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <span className="font-display text-xl font-semibold tracking-tight text-white">
          CareConnect
        </span>
      </div>

      <div className="relative max-w-md">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-white">
          {heading}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/70">{body}</p>

        <ol className="mt-10 space-y-5">
          {WAYPOINTS.map((wp, i) => (
            <li key={wp.code} className="flex items-center gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-accent/60 font-mono text-xs text-accent">
                {i + 1}
              </span>
              <div className="flex-1 border-b border-dashed border-white/15 pb-1">
                <span className="text-sm font-medium text-white">{wp.label}</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/40">
                {wp.code}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative font-mono text-[11px] uppercase tracking-widest text-white/30">
        Zephrix · HackACE 2026
      </p>
    </div>
  )
}
