import { Link, useParams } from 'react-router-dom'
import { useListDonations } from '../../api/hooks/useDonations'
import StatusBadge from '../../components/StatusBadge'
import ChainTimeline from '../../components/ChainTimeline'

const TYPE_LABELS = { FOOD: 'Food', CLOTHES: 'Clothes', BOOKS: 'Books' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DonationDetail() {
  const { id } = useParams()
  const { data: donations, isLoading, isError } = useListDonations()

  if (isLoading) {
    return <p className="font-mono text-sm text-text/50">Loading donation…</p>
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
        We couldn’t load this donation. Try refreshing the page.
      </p>
    )
  }

  const donation = donations?.find((d) => String(d.id) === String(id))

  if (!donation) {
    return (
      <div>
        <Link to="/donor" className="focus-ring text-sm text-text/50 hover:text-text">
          ← Back to dashboard
        </Link>
        <p className="mt-6 font-display text-lg text-text">Donation not found</p>
        <p className="mt-1 text-sm text-text/60">
          It may have been removed, or you don’t have access to it.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/donor" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-primary/60">
            {TYPE_LABELS[donation.type] || donation.type} · #{String(donation.id).slice(-6)}
          </span>
          <h1 className="mt-1 font-display text-2xl font-semibold text-text">{donation.title}</h1>
        </div>
        <StatusBadge status={donation.status} />
      </div>

      {donation.description && (
        <p className="mt-3 text-sm leading-relaxed text-text/70">{donation.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-hairline bg-paper p-5 sm:grid-cols-4">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-text/40">Quantity</dt>
          <dd className="mt-1 text-sm font-medium text-text">
            {donation.quantity} {donation.unit}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-text/40">Posted</dt>
          <dd className="mt-1 text-sm font-medium text-text">{formatDate(donation.createdAt)}</dd>
        </div>
        {donation.expiryDate && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-text/40">
              Best before
            </dt>
            <dd className="mt-1 text-sm font-medium text-text">{formatDate(donation.expiryDate)}</dd>
          </div>
        )}
        {donation.pickupOtp && (
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wide text-text/40">
              Pickup OTP
            </dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-primary">
              {donation.pickupOtp}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-text">Chain of custody</h2>
        <div className="mt-4 rounded-xl border border-hairline bg-paper p-6">
          <ChainTimeline status={donation.status} updatedAt={donation.updatedAt} />
        </div>
      </div>

      {donation.photos && donation.photos.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-medium text-text">Proof photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {donation.photos.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={`Proof photo ${i + 1} for ${donation.title}`}
                className="aspect-square w-full rounded-lg border border-hairline object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
