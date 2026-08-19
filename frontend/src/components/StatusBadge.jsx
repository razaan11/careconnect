const STATUS_STYLES = {
  PENDING: 'bg-gray-100 text-gray-600 border-gray-300',
  MATCHED: 'bg-blue-50 text-blue-700 border-blue-300',
  PICKUP_SCHEDULED: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  PICKED_UP: 'bg-orange-50 text-orange-700 border-orange-300',
  DELIVERED: 'bg-green-50 text-green-700 border-green-300',
  EXPIRED: 'bg-red-50 text-red-700 border-red-300',
}

const STATUS_LABELS = {
  PENDING: 'Pending',
  MATCHED: 'Matched',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  PICKED_UP: 'Picked up',
  DELIVERED: 'Delivered',
  EXPIRED: 'Expired',
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PENDING
  const label = STATUS_LABELS[status] || status

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
