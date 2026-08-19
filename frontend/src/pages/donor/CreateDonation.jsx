import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useCreateDonation, useBrowseNeeds } from '../../api/hooks/useDonations'

const inputClass =
  'focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30'
const labelClass = 'block text-sm font-medium text-text'

const TYPES = [
  { value: 'FOOD', label: 'Food', unitHint: 'kg, plates, packets…' },
  { value: 'CLOTHES', label: 'Clothes', unitHint: 'pieces, bags…' },
  { value: 'BOOKS', label: 'Books', unitHint: 'copies, sets…' },
]

const emptyItem = (type, preferredTrust) => ({
  type,
  title: '',
  description: '',
  quantity: '',
  unit: '',
  expiryDate: '',
  preferredTrustId: preferredTrust?.id || null,
  preferredTrustName: preferredTrust?.name || null,
})

const TYPE_LABEL = { FOOD: 'Food', CLOTHES: 'Clothes', BOOKS: 'Books' }

export default function CreateDonation() {
  const navigate = useNavigate()
  const location = useLocation()
  const createDonation = useCreateDonation()
  const previewMatches = useBrowseNeeds()

  // Arriving from "Who needs help" pre-selects that need's type and
  // carries over the address the donor already typed there.
  const preset = location.state || {}

  // Keyed by type so toggling a checkbox on/off preserves what was typed.
  const [items, setItems] = useState(
    preset.presetType
      ? {
          [preset.presetType]: emptyItem(
            preset.presetType,
            preset.presetTrustId ? { id: preset.presetTrustId, name: preset.presetTrustName } : null
          ),
        }
      : {}
  )
  const [address, setAddress] = useState({
    landmark: '',
    pincode: preset.presetAddress?.pincode || '',
    district: preset.presetAddress?.district || '',
    state: preset.presetAddress?.state || '',
  })
  const [formError, setFormError] = useState('')
  const [expandedTypes, setExpandedTypes] = useState({})

  function toggleExpanded(type) {
    setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const selectedTypes = TYPES.filter((t) => items[t.value])

  function toggleType(type) {
    setItems((prev) => {
      const next = { ...prev }
      if (next[type]) {
        delete next[type]
      } else {
        next[type] = emptyItem(type)
      }
      return next
    })
  }

  function updateItem(type, field, value) {
    setItems((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

  function chooseTrust(type, trustId, trustName) {
    setItems((prev) => ({
      ...prev,
      [type]: { ...prev[type], preferredTrustId: trustId, preferredTrustName: trustName },
    }))
  }

  function clearChosenTrust(type) {
    setItems((prev) => ({
      ...prev,
      [type]: { ...prev[type], preferredTrustId: null, preferredTrustName: null },
    }))
  }

  function updateAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  // As the donor types their pickup address, live-check which nearby
  // verified trusts are in need — debounced so we're not geocoding on
  // every keystroke. Fetches once per address (not per type toggle);
  // results are filtered to the selected item types at render time.
  useEffect(() => {
    if (!address.pincode || address.pincode.length < 4 || !address.district || !address.state) {
      return
    }
    const timer = setTimeout(() => {
      previewMatches.mutate({
        pincode: address.pincode,
        district: address.district,
        state: address.state,
      })
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.pincode, address.district, address.state])

  function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (selectedTypes.length === 0) {
      setFormError('Select at least one type of item to donate.')
      return
    }
    if (!address.pincode || !address.district || !address.state) {
      setFormError('Pincode, district, and state are required so we can find a nearby trust.')
      return
    }

    const payloadItems = selectedTypes.map((t) => {
      const item = items[t.value]
      const payloadItem = {
        type: item.type,
        title: item.title,
        description: item.description || undefined,
        quantity: Number(item.quantity),
        unit: item.unit,
        preferredTrustId: item.preferredTrustId || undefined,
      }
      if (item.type === 'FOOD' && item.expiryDate) {
        payloadItem.expiryDate = new Date(item.expiryDate).toISOString()
      }
      return payloadItem
    })

    createDonation.mutate(
      {
        items: payloadItems,
        landmark: address.landmark || undefined,
        pincode: address.pincode,
        district: address.district,
        state: address.state,
      },
      {
        onSuccess: () => {
          navigate('/donor', { replace: true })
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/donor" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary/60">
        New donation
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">
        What are you giving today?
      </h1>
      <p className="mt-1 text-sm text-text/60">
        Pick any combination of food, clothes, or books — each is matched to the right trust on
        its own, from one pickup address.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <fieldset>
          <legend className={labelClass}>What are you donating?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const checked = !!items[t.value]
              return (
                <label
                  key={t.value}
                  className={`focus-ring cursor-pointer rounded-lg border px-3 py-2.5 text-center transition-colors ${
                    checked
                      ? 'border-primary bg-primary/5'
                      : 'border-hairline bg-paper hover:border-primary/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleType(t.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-text">{t.label}</span>
                </label>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-text/50">Select as many as apply — one form, one trip.</p>
        </fieldset>

        {selectedTypes.map((t) => {
          const item = items[t.value]
          return (
            <div key={t.value} className="rounded-lg border border-hairline bg-primary/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-primary/70">{t.label}</p>
                {item.preferredTrustId ? (
                  <button
                    type="button"
                    onClick={() => clearChosenTrust(t.value)}
                    className="focus-ring rounded-md px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-accent hover:text-primary"
                  >
                    → {item.preferredTrustName} · change
                  </button>
                ) : (
                  <span className="font-mono text-[11px] uppercase tracking-wide text-text/40">
                    Auto-matched to best trust
                  </span>
                )}
              </div>

              <div className="mt-3">
                <label className={labelClass}>Title</label>
                <input
                  required
                  value={item.title}
                  onChange={(e) => updateItem(t.value, 'title', e.target.value)}
                  className={inputClass}
                  placeholder={
                    t.value === 'FOOD'
                      ? 'Freshly cooked rice and dal, 20 servings'
                      : t.value === 'CLOTHES'
                      ? 'Winter jackets, mixed sizes'
                      : 'School textbooks, grades 6–8'
                  }
                />
              </div>

              <div className="mt-3">
                <label className={labelClass}>
                  Description <span className="text-text/40">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => updateItem(t.value, 'description', e.target.value)}
                  className={inputClass}
                  placeholder="Any details a trust should know — condition, packaging, allergens…"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(t.value, 'quantity', e.target.value)}
                    className={inputClass}
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <input
                    required
                    value={item.unit}
                    onChange={(e) => updateItem(t.value, 'unit', e.target.value)}
                    className={inputClass}
                    placeholder={t.unitHint}
                  />
                </div>
              </div>

              {t.value === 'FOOD' && (
                <div className="mt-3">
                  <label className={labelClass}>
                    Best before <span className="text-text/40">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={item.expiryDate}
                    onChange={(e) => updateItem(t.value, 'expiryDate', e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-text/50">
                    Food listings expire automatically if unmatched after this time.
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <fieldset>
          <legend className={labelClass}>Pickup address</legend>
          <p className="mt-1 text-xs text-text/50">
            Same as filling in a delivery address at checkout — we'll find the nearest verified
            trust from this.
          </p>

          <div className="mt-2">
            <label className={labelClass}>
              Landmark <span className="text-text/40">(optional)</span>
            </label>
            <input
              value={address.landmark}
              onChange={(e) => updateAddress('landmark', e.target.value)}
              className={inputClass}
              placeholder="Near City Library, opposite bus stand…"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
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
                required
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
              required
              value={address.state}
              onChange={(e) => updateAddress('state', e.target.value)}
              className={inputClass}
              placeholder="Tamil Nadu"
            />
          </div>
        </fieldset>

        {selectedTypes.length > 0 && address.pincode.length >= 4 && (
          <div className="rounded-lg border border-hairline bg-paper p-4">
            <p className={labelClass}>Nearby trusts in need</p>

            {previewMatches.isPending && (
              <p className="mt-2 font-mono text-xs text-text/40">Checking nearby trusts…</p>
            )}
            {previewMatches.isError && (
              <p className="mt-2 text-xs text-error">Couldn't check nearby trusts right now.</p>
            )}
            {previewMatches.data &&
              (() => {
                const byType = {}
                for (const n of previewMatches.data.needs) {
                  if (!items[n.type]) continue
                  ;(byType[n.type] ||= []).push(n)
                }
                const typesWithMatches = selectedTypes.filter((t) => byType[t.value])

                if (typesWithMatches.length === 0) {
                  return (
                    <p className="mt-2 text-xs text-text/50">
                      No verified trust nearby currently needs{' '}
                      {selectedTypes.map((t) => t.label.toLowerCase()).join(' or ')} — we'll still
                      queue this for admin routing.
                    </p>
                  )
                }

                return (
                  <div className="mt-3 space-y-4">
                    {typesWithMatches.map((t) => (
                      <TrustMatchGroup
                        key={t.value}
                        typeLabel={t.label}
                        matches={byType[t.value]}
                        chosenTrustId={items[t.value]?.preferredTrustId}
                        expanded={!!expandedTypes[t.value]}
                        onToggleExpand={() => toggleExpanded(t.value)}
                        onChoose={(trustId, trustName) => chooseTrust(t.value, trustId, trustName)}
                        onClear={() => clearChosenTrust(t.value)}
                      />
                    ))}
                  </div>
                )
              })()}
          </div>
        )}

        {(formError || createDonation.isError) && (
          <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
            {formError ||
              createDonation.error?.response?.data?.error ||
              "We couldn't post this donation. Check the details and try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={createDonation.isPending}
          className="focus-ring w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createDonation.isPending
            ? 'Posting…'
            : selectedTypes.length > 1
            ? `Post ${selectedTypes.length} donations`
            : 'Post donation'}
        </button>
      </form>
    </div>
  )
}

// Shows one collapsed row for the best match, with the rest tucked
// behind an expand toggle — surfacing every nearby trust flat, with
// its own bar and button, was too much to take in at a glance.
function TrustMatchGroup({
  typeLabel,
  matches,
  chosenTrustId,
  expanded,
  onToggleExpand,
  onChoose,
  onClear,
}) {
  const top = matches[0]
  const rest = matches.slice(1)
  const chosenMatch = chosenTrustId ? matches.find((m) => m.trustId === chosenTrustId) : null
  const headline = chosenMatch || top
  const isHeadlineChosen = chosenTrustId === headline.trustId

  function trustRow(n, { compact } = {}) {
    const isChosen = chosenTrustId === n.trustId
    return (
      <div
        key={n.needId}
        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
          compact ? 'border-hairline' : isChosen ? 'border-primary bg-primary/5' : 'border-hairline'
        }`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{n.trustName}</p>
          <p className="font-mono text-[11px] text-text/40">
            {n.matchPercent}% match{n.distKm != null && ` · ${n.distKm.toFixed(1)} km away`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (isChosen ? onClear() : onChoose(n.trustId, n.trustName))}
          className={`focus-ring shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
            isChosen
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'border border-hairline text-text/60 hover:border-primary/40 hover:text-primary'
          }`}
        >
          {isChosen ? '✓ Chosen' : 'Donate here'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wide text-text/40">{typeLabel}</p>
      <div className="mt-1">{trustRow(headline)}</div>

      {rest.length > 0 && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="focus-ring mt-1.5 font-mono text-[11px] uppercase tracking-wide text-accent hover:text-primary"
        >
          {expanded ? 'Hide other options' : `Choose a different trust (${rest.length} more nearby)`}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-2">
          {matches
            .filter((n) => n.trustId !== headline.trustId)
            .map((n) => trustRow(n, { compact: true }))}
        </div>
      )}
    </div>
  )
}
