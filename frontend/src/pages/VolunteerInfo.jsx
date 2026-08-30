import { useMyVolunteerProfile } from '../api/hooks/useVolunteers'
import { useListDonations } from '../api/hooks/useDonations'
import DonationCard from '../components/DonationCard'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'

export default function VolunteerInfo() {
  const { data: profile, isLoading: loadingProfile } = useMyVolunteerProfile()
  const { data: donations, isLoading: loadingDonations } = useListDonations()

  // The generic donations list mixes the open pickup pool (anyone can
  // claim) with this volunteer's own assignments — this page is about
  // *their* activity, so filter down to donations actually assigned
  // to them.
  const myDonations = profile
    ? (donations || []).filter((d) => d.volunteerId === profile.id)
    : []
  const delivered = myDonations.filter((d) => d.status === 'DELIVERED')
  const inProgress = myDonations.filter((d) => d.status !== 'DELIVERED')

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
        Volunteer dashboard
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">Your activity</h1>
      <p className="mt-1 text-sm text-text/60">
        Accepting pickups, camera proof, and OTP confirmation happen in the CareConnect mobile
        app — sign in there with the same email and password. This page is a read-only view of
        what you've done.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total deliveries"
          value={loadingProfile ? '—' : profile?.totalDeliveries ?? 0}
          tone="accent"
        />
        <StatCard
          label="In progress"
          value={loadingProfile || loadingDonations ? '—' : inProgress.length}
          tone="warning"
        />
        <StatCard
          label="Availability"
          value={loadingProfile ? '—' : profile?.isAvailable ? 'Available' : 'Unavailable'}
          tone={profile?.isAvailable ? 'accent' : 'primary'}
        />
      </div>

      {profile?.vehicleType && (
        <p className="mt-3 font-mono text-xs uppercase tracking-wide text-text/40">
          Vehicle: {profile.vehicleType}
        </p>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-medium text-text">Your deliveries</h2>

        {(loadingProfile || loadingDonations) && (
          <p className="mt-4 font-mono text-sm text-text/50">Loading your activity…</p>
        )}

        {!loadingProfile && !loadingDonations && myDonations.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No deliveries yet"
              body="Accept a pickup in the mobile app to get started — it'll show up here once you do."
            />
          </div>
        )}

        {!loadingProfile && !loadingDonations && myDonations.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myDonations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </div>

      {delivered.length > 0 && (
        <p className="mt-6 font-mono text-[11px] uppercase tracking-wide text-text/40">
          {delivered.length} delivered · {inProgress.length} still in progress
        </p>
      )}
    </div>
  )
}
