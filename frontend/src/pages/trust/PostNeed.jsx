import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePostNeed } from '../../api/hooks/useTrusts'

const inputClass =
  'focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30'
const labelClass = 'block text-sm font-medium text-text'

const TYPES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'CLOTHES', label: 'Clothes' },
  { value: 'BOOKS', label: 'Books' },
]

const URGENCIES = [
  { value: 'LOW', label: 'Low', desc: 'Nice to have, no rush' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Needed within a couple of weeks' },
  { value: 'HIGH', label: 'High', desc: 'Needed within days' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Needed immediately' },
]

export default function PostNeed() {
  const navigate = useNavigate()
  const postNeed = usePostNeed()
  const [form, setForm] = useState({
    type: 'FOOD',
    title: '',
    description: '',
    urgency: 'MEDIUM',
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    postNeed.mutate(
      { ...form, description: form.description || undefined },
      { onSuccess: () => navigate('/trust', { replace: true }) }
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/trust" className="focus-ring text-sm text-text/50 hover:text-text">
        ← Back to dashboard
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-primary/60">
        New need
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-text">What do you need?</h1>
      <p className="mt-1 text-sm text-text/60">
        Posted needs help donors understand what your trust is short on right now.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <fieldset>
          <legend className={labelClass}>Type</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <label
                key={t.value}
                className={`focus-ring cursor-pointer rounded-lg border px-3 py-2.5 text-center transition-colors ${
                  form.type === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-hairline bg-paper hover:border-primary/30'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={form.type === t.value}
                  onChange={(e) => update('type', e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-text">{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input
            id="title"
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className={inputClass}
            placeholder="Dry rations for 50 families"
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description <span className="text-text/40">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className={inputClass}
            placeholder="Anything donors should know — preferred quantities, timing…"
          />
        </div>

        <fieldset>
          <legend className={labelClass}>Urgency</legend>
          <div className="mt-2 space-y-2">
            {URGENCIES.map((u) => (
              <label
                key={u.value}
                className={`focus-ring flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                  form.urgency === u.value
                    ? 'border-primary bg-primary/5'
                    : 'border-hairline bg-paper hover:border-primary/30'
                }`}
              >
                <span>
                  <input
                    type="radio"
                    name="urgency"
                    value={u.value}
                    checked={form.urgency === u.value}
                    onChange={(e) => update('urgency', e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-text">{u.label}</span>
                  <span className="ml-2 text-xs text-text/50">{u.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {postNeed.isError && (
          <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
            {postNeed.error?.response?.data?.error ||
              'We couldn’t post this need. Check the details and try again.'}
          </p>
        )}

        <button
          type="submit"
          disabled={postNeed.isPending}
          className="focus-ring w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {postNeed.isPending ? 'Posting…' : 'Post need'}
        </button>
      </form>
    </div>
  )
}
