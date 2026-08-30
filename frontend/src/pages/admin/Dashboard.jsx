import { Link } from 'react-router-dom'
import { useAdminStats } from '../../api/hooks/useAdmin'
import { useListDonations } from '../../api/hooks/useDonations'
import StatCard from '../../components/StatCard'
import DonationPipeline from '../../components/DonationPipeline'
import DonationCard from '../../components/DonationCard'
import EmptyState from '../../components/EmptyState'

export default function AdminDashboard() {
  const { data: stats, isLoading, isError } = useAdminStats()
  const { data: donations, isLoading: loadingDonations } = useListDonations()
  const recent = (donations || []).slice(0, 6)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
            Admin dashboard
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-text">Platform overview</h1>
        </div>
        <Link
          to="/admin/trusts"
          className="focus-ring rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Review pending trusts
        </Link>
      </div>

      {isLoading && (
        <p className="mt-6 font-mono text-sm text-text/50">Loading platform stats…</p>
      )}

      {isError && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          We couldn’t load platform stats. Try refreshing the page.
        </p>
      )}

      {!isLoading && !isError && stats && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total donations" value={stats.totalDonations} tone="primary" />
            <StatCard label="Active trusts" value={stats.activeTrusts} tone="accent" />
            <StatCard label="Pending verifications" value={stats.pendingVerifications} tone="warning" />
            <StatCard label="Active volunteers" value={stats.activeVolunteers} tone="primary" />
            <StatCard label="Delivered today" value={stats.deliveredToday} tone="accent" />
          </div>

          <div className="mt-8 rounded-xl border border-hairline bg-paper p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
              Verification chain
            </p>
            <h2 className="mt-1 font-display text-lg font-medium text-text">
              Where every donation stands right now
            </h2>
            <div className="mt-4">
              <DonationPipeline byStatus={stats.donationsByStatus} />
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-text">Recent activity</h2>

        {loadingDonations && (
          <p className="mt-4 font-mono text-sm text-text/50">Loading recent donations…</p>
        )}

        {!loadingDonations && recent.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No activity yet"
              body="Donations will appear here as donors start posting them."
            />
          </div>
        )}

        {!loadingDonations && recent.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
