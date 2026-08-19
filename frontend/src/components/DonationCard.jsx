import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

const TYPE_LABELS = {
  FOOD: 'Food',
  CLOTHES: 'Clothes',
  BOOKS: 'Books',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DonationCard({ donation, linkTo }) {
  const { id, title, type, quantity, unit, status, createdAt } = donation

  const Wrapper = linkTo ? Link : 'div'
  const wrapperProps = linkTo ? { to: linkTo } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`focus-ring group block rounded-xl border border-hairline bg-paper p-5 transition-all duration-200 ${
        linkTo ? 'hover:-translate-y-0.5 hover:shadow-card' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-primary/60">
          {TYPE_LABELS[type] || type} · #{String(id).slice(-6)}
        </span>
        <StatusBadge status={status} />
      </div>

      <h3 className="mt-2 font-display text-lg font-medium leading-snug text-text group-hover:text-primary">
        {title}
      </h3>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="text-sm text-text/70">
          {quantity} {unit}
        </span>
        <span className="font-mono text-xs text-text/40">{formatDate(createdAt)}</span>
      </div>
    </Wrapper>
  )
}
