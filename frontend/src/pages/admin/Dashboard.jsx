import { Link } from 'react-router-dom'
import { useAdminStats } from '../../api/hooks/useAdmin'
import StatCard from '../../components/StatCard'

export default function AdminDashboard() {
  const { data: stats, isLoading, isError } = useAdminStats()

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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total donations" value={stats.totalDonations} tone="primary" />
          <StatCard label="Active trusts" value={stats.activeTrusts} tone="accent" />
          <StatCard label="Pending verifications" value={stats.pendingVerifications} tone="warning" />
          <StatCard label="Active volunteers" value={stats.activeVolunteers} tone="primary" />
          <StatCard label="Delivered today" value={stats.deliveredToday} tone="accent" />
        </div>
      )}
    </div>
  )
}
