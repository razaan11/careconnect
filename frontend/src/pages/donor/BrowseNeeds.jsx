import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBrowseNeeds } from '../../api/hooks/useDonations'

const inputClass =
  'focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30'
const labelClass = 'block text-sm font-medium text-text'

const URGENCY_STYLES = {
  CRITICAL: 'bg-error/10 text-error border-error/30',
  HIGH: 'bg-warning/10 text-warning border-warning/30',
  MEDIUM: 'bg-accent/10 text-accent border-accent/30',
  LOW: 'bg-text/5 text-text/50 border-hairline',
}

const TYPE_LABEL = { FOOD: 'Food', CLOTHES: 'Clothes', BOOKS: 'Books' }

export default function BrowseNeeds() {
  const navigate = useNavigate()
  const browseNeeds = useBrowseNeeds()

  const [address, setAddress] = useState({ pincode: '', district: '', state: '' })
  const [results, setResults] = useState(null)
  const [locationResolved, setLocationResolved] = useState(true)

  function updateAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  function handleSearch(e) {
    e.preventDefault()
    browseNeeds.mutate(address, {
      onSuccess: (data) => {
        setResults(data.needs)
        setLocationResolved(data.locationResolved)
      },
    })
  }

  function donateToNeed(need) {
    navigate('/donor/new', {
      state: {
        presetType: need.type,
        presetAddress: address,
        presetTrustId: need.trustId,
        presetTrustName: need.trustName,
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/donor" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary/60">
        Smart matching
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">
        Who needs help most right now?
      </h1>
      <p className="mt-1 text-sm text-text/60">
        Ranked by the same distance-and-urgency score CareConnect uses to auto-match your
        donations — enter your area to see it in action.
      </p>

      <form onSubmit={handleSearch} className="mt-6 rounded-lg border border-hairline bg-paper p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pincode</label>
            <input
              required
              inputMode="numeric"
              value={address.pincode}
              onChange={(e) => updateAddress('pincode', e.target.value)}
              className={inputClass}
              placeholder="600001"
            />
          </div>
          <div>
            <label className={labelClass}>District</label>
            <input
              value={address.district}
              onChange={(e) => updateAddress('district', e.target.value)}
              className={inputClass}
              placeholder="Chennai"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>State</label>
          <input
            value={address.state}
            onChange={(e) => updateAddress('state', e.target.value)}
            className={inputClass}
            placeholder="Tamil Nadu"
          />
        </div>
        <button
          type="submit"
          disabled={browseNeeds.isPending}
          className="focus-ring mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {browseNeeds.isPending ? 'Ranking needs…' : 'Find needs near me'}
        </button>
      </form>

      {browseNeeds.isError && (
        <p className="mt-4 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          {browseNeeds.error?.response?.data?.error || "We couldn't load needs. Try again."}
        </p>
      )}

      {results && !locationResolved && (
        <p className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          We couldn't pin down that pincode's location, so this list is ranked by urgency only —
          distance isn't factored in.
        </p>
      )}

      {results && results.length === 0 && (
        <p className="mt-6 text-sm text-text/50">
          No verified trust has an active need right now. Check back soon.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-6 space-y-3">
          {results.map((need, i) => (
            <li
              key={need.needId}
              className="rounded-lg border border-hairline bg-paper p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-text/40">
                    #{i + 1} match · {TYPE_LABEL[need.type]}
                  </p>
                  <p className="mt-0.5 font-display text-base font-semibold text-text">
                    {need.title}
                  </p>
                  <p className="mt-0.5 text-sm text-text/60">{need.trustName}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-lg font-semibold text-accent">
                    {need.matchPercent}%
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${URGENCY_STYLES[need.urgency]}`}
                  >
                    {need.urgency}
                  </span>
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${need.matchPercent}%` }}
                />
              </div>

              {need.description && (
                <p className="mt-2 text-sm text-text/60">{need.description}</p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono text-xs text-text/40">
                  {need.trustDistrict}, {need.trustState}
                  {need.distKm != null && ` · ${need.distKm.toFixed(1)} km away`}
                </p>
                <button
                  type="button"
                  onClick={() => donateToNeed(need)}
                  className="focus-ring rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-accent hover:text-primary"
                >
                  Donate {TYPE_LABEL[need.type]} →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
