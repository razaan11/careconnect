import { Link } from 'react-router-dom'
import { usePendingTrusts, useVerifyTrust } from '../../api/hooks/useAdmin'
import EmptyState from '../../components/EmptyState'

export default function TrustVerification() {
  const { data: trusts, isLoading, isError } = usePendingTrusts()
  const verifyTrust = useVerifyTrust()

  return (
    <div>
      <Link to="/admin" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary/60">
        Trust verification
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">Pending applications</h1>
      <p className="mt-1 text-sm text-text/60">
        These didn't auto-verify against the NGO Darpan registry — confirm the ID manually before
        approving. Only verified trusts can receive matches.
      </p>

      {isLoading && <p className="mt-6 font-mono text-sm text-text/50">Loading applications…</p>}

      {isError && (
        <p className="mt-6 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          We couldn’t load pending trusts. Try refreshing the page.
        </p>
      )}

      {!isLoading && !isError && (!trusts || trusts.length === 0) && (
        <div className="mt-6">
          <EmptyState
            title="Nothing to review"
            body="New trust applications will appear here as they register."
          />
        </div>
      )}

      {!isLoading && !isError && trusts && trusts.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-hairline bg-paper">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-hairline">
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-text/40">
                  Organization
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-text/40">
                  NGO Darpan ID
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-text/40">
                  Applicant
                </th>
                <th className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-text/40">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {trusts.map((trust) => {
                const isThisPending = verifyTrust.isPending && verifyTrust.variables === trust.id
                return (
                  <tr key={trust.id} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-3 font-medium text-text">{trust.orgName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text/70">{trust.darpanId}</td>
                    <td className="px-4 py-3">
                      <p className="text-text">{trust.user?.name || '—'}</p>
                      <p className="text-xs text-text/50">{trust.user?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => verifyTrust.mutate(trust.id)}
                        disabled={isThisPending}
                        className="focus-ring rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isThisPending ? 'Approving…' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
