import { Link } from 'react-router-dom'
import { useListDonations } from '../../api/hooks/useDonations'
import { useGetNeeds, useMyTrust } from '../../api/hooks/useTrusts'
import DonationCard from '../../components/DonationCard'
import EmptyState from '../../components/EmptyState'

const URGENCY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const URGENCY_STYLES = {
  CRITICAL: 'text-error',
  HIGH: 'text-warning',
  MEDIUM: 'text-primary',
  LOW: 'text-text/50',
}

export default function TrustDashboard() {
  const { data: donations, isLoading: loadingDonations } = useListDonations()
  const { data: needs, isLoading: loadingNeeds } = useGetNeeds()
  const { data: trust } = useMyTrust()

  const counts = URGENCY_ORDER.reduce((acc, level) => {
    acc[level] = needs?.filter((n) => n.urgency === level).length || 0
    return acc
  }, {})

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
            Trust dashboard
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-text">
            Matched donations
          </h1>
          {trust && (
            <p
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${
                trust.isVerified
                  ? 'border-accent/30 bg-accent/10 text-accent'
                  : 'border-warning/30 bg-warning/10 text-warning'
              }`}
            >
              {trust.isVerified ? '✓ NGO Darpan verified' : '⏳ Pending admin review'}
            </p>
          )}
        </div>
        <Link
          to="/trust/needs/new"
          className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          + Post a need
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {URGENCY_ORDER.map((level) => (
          <div key={level} className="rounded-xl border border-hairline bg-paper p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-text/40">{level}</p>
            <p className={`mt-1 font-display text-2xl font-semibold ${URGENCY_STYLES[level]}`}>
              {loadingNeeds ? '—' : counts[level]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-text">Donations matched to you</h2>

        {loadingDonations && (
          <p className="mt-4 font-mono text-sm text-text/50">Loading matches…</p>
        )}

        {!loadingDonations && (!donations || donations.length === 0) && (
          <div className="mt-4">
            <EmptyState
              title="No matches yet"
              body="When a donor's listing is matched to your trust, it will appear here with pickup details."
            />
          </div>
        )}

        {!loadingDonations && donations && donations.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
