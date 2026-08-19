import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../api/hooks/useAuth'
import BrandPanel from '../../components/BrandPanel'

const ROLE_HOME = {
  DONOR: '/donor',
  TRUST: '/trust',
  VOLUNTEER: '/volunteer-info',
  ADMIN: '/admin',
}

const ROLES = [
  { value: 'DONOR', label: 'Donor', hint: 'I want to give food, clothes, or books' },
  { value: 'TRUST', label: 'Trust / NGO', hint: 'We receive and distribute donations' },
  { value: 'VOLUNTEER', label: 'Volunteer', hint: 'I pick up and deliver donations' },
  { value: 'ADMIN', label: 'Admin', hint: 'I verify trusts and oversee the platform' },
]

const inputClass =
  'focus-ring mt-1.5 w-full rounded-lg border border-hairline bg-paper px-3 py-2 text-sm text-text placeholder:text-text/30'
const labelClass = 'block text-sm font-medium text-text'

export default function Register() {
  const navigate = useNavigate()
  const register = useRegister()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DONOR',
    phone: '',
    address: '',
    orgName: '',
    darpanId: '',
    trustLandmark: '',
    trustPincode: '',
    trustDistrict: '',
    trustState: '',
    vehicleType: '',
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      phone: form.phone || undefined,
      address: form.address || undefined,
    }
    if (form.role === 'TRUST') {
      payload.orgName = form.orgName
      payload.darpanId = form.darpanId
      payload.trustLandmark = form.trustLandmark || undefined
      payload.trustPincode = form.trustPincode
      payload.trustDistrict = form.trustDistrict
      payload.trustState = form.trustState
    }
    if (form.role === 'VOLUNTEER') {
      payload.vehicleType = form.vehicleType
    }

    register.mutate(payload, {
      onSuccess: (data) => {
        navigate(ROLE_HOME[data.user?.role] || '/login', { replace: true })
      },
    })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <BrandPanel
        eyebrow="Create account"
        heading="Verification runs from day one."
        body="Donors, trusts, and volunteers all register through the same chain — trusts are checked by an admin before they can receive a match."
      />

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl font-semibold text-text">Create your account</h1>
          <p className="mt-1 text-sm text-text/60">Tell us who you are and how to reach you.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <fieldset>
              <legend className={labelClass}>I am a…</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`focus-ring flex cursor-pointer flex-col rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      form.role === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-hairline bg-paper hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={form.role === role.value}
                      onChange={(e) => update('role', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-text">{role.label}</span>
                    <span className="mt-0.5 text-xs leading-snug text-text/50">{role.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>Full name</label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={inputClass}
                  placeholder="Aditi Sharma"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className={inputClass}
                  placeholder="98765 43210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass}
                placeholder="you@example.org"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </div>

            {form.role === 'TRUST' && (
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-hairline bg-primary/[0.03] p-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="orgName" className={labelClass}>Organization name</label>
                  <input
                    id="orgName"
                    required
                    value={form.orgName}
                    onChange={(e) => update('orgName', e.target.value)}
                    className={inputClass}
                    placeholder="Sunrise Welfare Trust"
                  />
                </div>
                <div>
                  <label htmlFor="darpanId" className={labelClass}>NGO Darpan ID</label>
                  <input
                    id="darpanId"
                    required
                    value={form.darpanId}
                    onChange={(e) => update('darpanId', e.target.value.toUpperCase())}
                    className={inputClass + ' font-mono'}
                    placeholder="KA/2020/0245789"
                  />
                </div>

                <div className="col-span-full">
                  <label htmlFor="trustLandmark" className={labelClass}>
                    Landmark <span className="text-text/40">(optional)</span>
                  </label>
                  <input
                    id="trustLandmark"
                    value={form.trustLandmark}
                    onChange={(e) => update('trustLandmark', e.target.value)}
                    className={inputClass}
                    placeholder="Opposite the community hall"
                  />
                </div>
                <div>
                  <label htmlFor="trustPincode" className={labelClass}>Pincode</label>
                  <input
                    id="trustPincode"
                    required
                    inputMode="numeric"
                    value={form.trustPincode}
                    onChange={(e) => update('trustPincode', e.target.value)}
                    className={inputClass}
                    placeholder="600001"
                  />
                </div>
                <div>
                  <label htmlFor="trustDistrict" className={labelClass}>District</label>
                  <input
                    id="trustDistrict"
                    required
                    value={form.trustDistrict}
                    onChange={(e) => update('trustDistrict', e.target.value)}
                    className={inputClass}
                    placeholder="Chennai"
                  />
                </div>
                <div className="col-span-full">
                  <label htmlFor="trustState" className={labelClass}>State</label>
                  <input
                    id="trustState"
                    required
                    value={form.trustState}
                    onChange={(e) => update('trustState', e.target.value)}
                    className={inputClass}
                    placeholder="Tamil Nadu"
                  />
                </div>
                <p className="col-span-full text-xs text-text/50">
                  Format: <span className="font-mono">XX/YYYY/NNNNNNN</span>. A recognized ID
                  verifies instantly — otherwise an admin reviews it before you can receive
                  matches.
                </p>
              </div>
            )}

            {form.role === 'VOLUNTEER' && (
              <div className="rounded-lg border border-hairline bg-primary/[0.03] p-4">
                <label htmlFor="vehicleType" className={labelClass}>Vehicle type</label>
                <select
                  id="vehicleType"
                  value={form.vehicleType}
                  onChange={(e) => update('vehicleType', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a vehicle</option>
                  <option value="BIKE">Bike</option>
                  <option value="CAR">Car</option>
                  <option value="VAN">Van</option>
                  <option value="ON_FOOT">On foot</option>
                </select>
                <p className="mt-2 text-xs text-text/50">
                  Pickup and delivery for volunteers happen in the CareConnect mobile app.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="address" className={labelClass}>Address</label>
              <input
                id="address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className={inputClass}
                placeholder="Street, area, city"
              />
            </div>

            {register.isError && (
              <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                {register.error?.response?.data?.error ||
                  'We couldn’t create that account. Check your details and try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={register.isPending}
              className="focus-ring w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {register.isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text/60">
            Already have an account?{' '}
            <Link to="/login" className="focus-ring rounded font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
