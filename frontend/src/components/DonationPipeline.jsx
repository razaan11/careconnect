const PIPELINE = [
  { key: 'PENDING', label: 'Pending', bar: 'bg-gray-400', dot: 'bg-gray-400' },
  { key: 'MATCHED', label: 'Matched', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  { key: 'PICKUP_SCHEDULED', label: 'Pickup scheduled', bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
  { key: 'PICKED_UP', label: 'Picked up', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  { key: 'DELIVERED', label: 'Delivered', bar: 'bg-green-500', dot: 'bg-green-500' },
  { key: 'EXPIRED', label: 'Expired', bar: 'bg-red-500', dot: 'bg-red-500' },
]

/**
 * A single segmented bar showing where every donation on the
 * platform currently sits in the verification chain — same status
 * vocabulary and colors as StatusBadge, just aggregated.
 */
export default function DonationPipeline({ byStatus }) {
  const total = PIPELINE.reduce((sum, s) => sum + (byStatus[s.key] || 0), 0)

  if (total === 0) {
    return <p className="mt-3 text-sm text-text/50">No donations on the platform yet.</p>
  }

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-hairline">
        {PIPELINE.map((s) => {
          const count = byStatus[s.key] || 0
          if (count === 0) return null
          return (
            <div
              key={s.key}
              className={`${s.bar} h-full transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${s.label}: ${count}`}
            />
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {PIPELINE.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
            <span className="text-sm text-text/70">{s.label}</span>
            <span className="ml-auto font-mono text-sm font-semibold text-text">
              {byStatus[s.key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
