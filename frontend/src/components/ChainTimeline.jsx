const STEPS = [
  { key: 'PENDING', label: 'Listed', note: 'Donation posted, awaiting a match' },
  { key: 'MATCHED', label: 'Matched', note: 'A verified trust has claimed this donation' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup scheduled', note: 'An OTP has been issued for handoff' },
  { key: 'PICKED_UP', label: 'Picked up', note: 'Volunteer collected the donation' },
  { key: 'DELIVERED', label: 'Delivered', note: 'Confirmed received by the trust' },
]

function formatDateTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * The chain-of-custody manifest: a vertical, stamped waypoint trail tracking
 * a donation from listing to confirmed delivery. This is CareConnect's
 * verification story made visible — every handoff is a checkpoint, not a status word.
 */
export default function ChainTimeline({ status, updatedAt }) {
  if (status === 'EXPIRED') {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-error">
          Chain broken
        </p>
        <p className="mt-1 font-display text-lg text-text">This donation expired</p>
        <p className="mt-1 text-sm text-text/60">
          No trust confirmed pickup before the expiry window closed. The listing is no longer active.
        </p>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status)
  const activeIndex = currentIndex === -1 ? 0 : currentIndex

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const isDone = i < activeIndex
        const isCurrent = i === activeIndex
        const isLast = i === STEPS.length - 1

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px border-l-2 border-dashed ${
                  isDone ? 'border-accent' : 'border-hairline'
                }`}
                aria-hidden="true"
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold ${
                isDone
                  ? 'border-accent bg-accent text-white'
                  : isCurrent
                  ? 'border-primary bg-paper text-primary ring-4 ring-primary/15'
                  : 'border-hairline bg-paper text-text/30'
              }`}
            >
              {isDone ? '✓' : String(i + 1).padStart(2, '0')}
            </span>

            <div className="pt-1">
              <p
                className={`font-display text-base font-medium ${
                  isDone || isCurrent ? 'text-text' : 'text-text/40'
                }`}
              >
                {step.label}
              </p>
              <p className={`mt-0.5 text-sm ${isDone || isCurrent ? 'text-text/60' : 'text-text/30'}`}>
                {step.note}
              </p>
              {isCurrent && updatedAt && (
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-primary/70">
                  Last updated {formatDateTime(updatedAt)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
