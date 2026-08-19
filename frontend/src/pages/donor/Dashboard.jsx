import { Link } from 'react-router-dom'
import { useListDonations } from '../../api/hooks/useDonations'
import DonationCard from '../../components/DonationCard'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import { getStoredUser } from '../../api/hooks/useAuth'

export default function DonorDashboard() {
  const { data: donations, isLoading, isError } = useListDonations()
  const user = getStoredUser()

  const total = donations?.length || 0
  const matched =
    donations?.filter((d) => !['PENDING', 'DELIVERED', 'EXPIRED'].includes(d.status)).length || 0
  const delivered = donations?.filter((d) => d.status === 'DELIVERED').length || 0

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
            Donor dashboard
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-text">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <Link
          to="/donor/new"
          className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          + New donation
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total donations" value={total} tone="primary" />
        <StatCard label="In progress" value={matched} tone="warning" />
        <StatCard label="Delivered" value={delivered} tone="accent" />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-text">Your donations</h2>

        {isLoading && (
          <p className="mt-4 font-mono text-sm text-text/50">Loading your donations…</p>
        )}

        {isError && (
          <p className="mt-4 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
            We couldn’t load your donations. Try refreshing the page.
          </p>
        )}

        {!isLoading && !isError && total === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No donations yet"
              body="List your first food, clothing, or book donation and CareConnect will match it with a verified trust nearby."
              action={
                <Link
                  to="/donor/new"
                  className="focus-ring inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Create a donation
                </Link>
              }
            />
          </div>
        )}

        {!isLoading && !isError && total > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                linkTo={`/donor/donations/${donation.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
