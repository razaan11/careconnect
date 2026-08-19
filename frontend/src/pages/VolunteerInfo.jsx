export default function VolunteerInfo() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-primary/60">
        Volunteer account
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-text">
        Pickups happen in the app
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-text/60">
        Your CareConnect account is set up. Route assignments, pickup OTP scans, and delivery
        confirmations all happen in the CareConnect volunteer mobile app — this web dashboard is
        built for donors, trusts, and admins.
      </p>
      <div className="mx-auto mt-8 max-w-xs rounded-xl border border-dashed border-hairline bg-paper/60 px-6 py-8">
        <p className="font-display text-base font-medium text-text">Get the mobile app</p>
        <p className="mt-1.5 text-sm text-text/50">
          Sign in there with the same email and password to start accepting routes.
        </p>
      </div>
    </div>
  )
}
