import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useListDonations } from '../../api/hooks/useDonations'
import { useGenerateOTP } from '../../api/hooks/useTrusts'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

export default function GenerateOTP() {
  const { data: donations, isLoading } = useListDonations()
  const generateOtp = useGenerateOTP()
  const [modal, setModal] = useState(null) // { title, otp } | null
  const [errorFor, setErrorFor] = useState(null)

  function handleGenerate(donation) {
    setErrorFor(null)
    generateOtp.mutate(donation.id, {
      onSuccess: (data) => {
        setModal({ title: donation.title, otp: data.pickupOtp })
      },
      onError: () => {
        setErrorFor(donation.id)
      },
    })
  }

  const eligible = donations?.filter((d) => !['DELIVERED', 'EXPIRED'].includes(d.status)) || []

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/trust" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary/60">
        Pickup verification
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">Generate a pickup OTP</h1>
      <p className="mt-1 text-sm text-text/60">
        Share the code with your assigned volunteer — they’ll enter it to confirm handoff.
      </p>

      <div className="mt-8">
        {isLoading && <p className="font-mono text-sm text-text/50">Loading matched donations…</p>}

        {!isLoading && eligible.length === 0 && (
          <EmptyState
            title="Nothing to schedule"
            body="Once a donation is matched to your trust, it will show up here so you can generate a pickup OTP."
          />
        )}

        {!isLoading && eligible.length > 0 && (
          <ul className="space-y-3">
            {eligible.map((donation) => {
              const canGenerate = donation.status === 'MATCHED'
              const isThisPending = generateOtp.isPending && generateOtp.variables === donation.id
              return (
                <li
                  key={donation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-paper p-4"
                >
                  <div>
                    <p className="font-display text-base font-medium text-text">{donation.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={donation.status} />
                      <span className="text-xs text-text/50">
                        {donation.quantity} {donation.unit}
                      </span>
                    </div>
                    {errorFor === donation.id && (
                      <p className="mt-1.5 text-xs text-error">
                        Couldn’t generate an OTP for this donation. Try again.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate(donation)}
                    disabled={!canGenerate || isThisPending}
                    className="focus-ring rounded-lg border border-primary px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:border-hairline disabled:text-text/30 disabled:hover:bg-transparent"
                  >
                    {isThisPending
                      ? 'Generating…'
                      : canGenerate
                      ? 'Generate OTP'
                      : 'Already scheduled'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-primary/20 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-hairline bg-paper p-8 text-center shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[11px] uppercase tracking-widest text-primary/60">
              Pickup OTP issued
            </p>
            <h2 id="otp-modal-title" className="mt-1 font-display text-lg font-medium text-text">
              {modal.title}
            </h2>
            <p className="mt-6 font-mono text-4xl font-semibold tracking-[0.3em] text-primary">
              {modal.otp}
            </p>
            <p className="mt-6 text-sm text-text/60">
              Give this code to your volunteer. They’ll use it to confirm the handoff on pickup.
            </p>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="focus-ring mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
