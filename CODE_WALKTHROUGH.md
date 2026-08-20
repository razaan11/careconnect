# CareConnect — Code Walkthrough

A trace-through of how the actual mechanisms work, file by file and call by call — companion to [DOCUMENTATION.md](DOCUMENTATION.md), which covers architecture/schema/API at a reference level. This one follows real code paths.

---

## 1. Auth — how a request proves who you are

**Register** (`backend/src/controllers/auth.controller.js`): hashes the password with bcrypt (`SALT_ROUNDS = 10`), creates a `User` row, and — if `role: 'TRUST'` — also creates the associated `Trust` row in the same call, running its `darpanId` through `verifyDarpanId()` first (see §3). Returns a JWT signed with `{id, role}` via `signToken()`, expiry from `env.JWT_EXPIRES_IN`.

**Every protected route** goes through `backend/src/middleware/auth.js`:
```js
authenticate        // reads Authorization: Bearer <token> → jwt.verify() → loads the User from DB → req.user
authorize('DONOR')  // checks req.user.role is in the allowed list, 403s otherwise
```
So `router.post('/', authenticate, authorize('DONOR'), createDonation)` reads as: verify the token, confirm the caller is a donor, only then run the handler.

**Frontend mirrors this.** `frontend/src/api/axios.js` has a request interceptor that reads the JWT from `localStorage` and attaches it to every outgoing request — no page manually sets headers. A response interceptor watches for `401` and clears the session. `frontend/src/components/RouteGuards.jsx`'s `RequireAuth`/`RequireRole` are the client-side equivalent: redirect to `/login` if there's no token, or to the user's own dashboard if they hit a route for the wrong role.

---

## 2. The core mechanism: donation → match

When a donor submits the multi-item form:

1. **`createDonation`** (`backend/src/controllers/donations.controller.js`) receives `{items: [...], pincode, district, state}`.
2. It calls **`geocodePincode()`** *once* for the whole address (`backend/src/services/geocode.js`) — queries OpenStreetMap Nominatim with `[pincode, district, state].filter(Boolean).join(', ')`, no hardcoded country filter, returns `{lat, lng}` or `null` on failure.
3. For **each item**, it creates a separate `Donation` row — this is why donating food + books together produces two database rows, not one. Food items are run through `checkFoodSafety()` first (`backend/src/services/foodSafety.js`), which rejects anything with no expiry date, an already-passed expiry, or less than 24 hours remaining.
4. For each new row, `matchDonation(donation)` runs (§2.1) — unless the donor named a `preferredTrustId` for that item, in which case `resolvePreferredTrust()` runs instead.

### 2.1 The scoring formula — exact math

`backend/src/services/matchingEngine.js`:

```js
MAX_DISTANCE_POINTS = 40
MAX_VERIFICATION_POINTS = 10
URGENCY_POINTS = { LOW: 5, MEDIUM: 15, HIGH: 25, CRITICAL: 30 }
MAX_POSSIBLE_SCORE = 40 + 30 + 10 = 80   // used to normalize to a 0-100% "match %"

MAX_MATCH_DISTANCE_KM = 10   // hard cutoff — auto-matching only
```

`scoreTrust(donation, trust)` — used for **auto-matching**:
1. Find an active `TrustNeed` on this trust matching `donation.type`. None → `null` (excluded entirely).
2. If either side's `lat`/`lng` is missing → `null`.
3. `distKm = haversine(donation, trust)`. If `> 10km` → `null` (auto-match refuses to route farther than this).
4. `distancePoints = max(0, 40 - distKm × 4)` — so it hits 0 at exactly 10km, linear in between.
5. `urgencyPoints` from the table above.
6. `verificationPoints = 10` flat (always true here, since the query only ever pulls `isVerified: true` trusts).
7. `score = distancePoints + urgencyPoints + verificationPoints` (max 80).

`matchDonation(donation)` queries every verified trust with a matching active need, scores each, keeps the highest. No minimum threshold — if scoring found *any* candidate within 10km, it's used; finding zero candidates leaves the donation `PENDING`.

`scoreNeed(need, trust, donorLat, donorLng)` — used for **donor-facing browsing** (`browse-needs`, the live preview panel). Deliberately different from `scoreTrust`:
- No type filter — ranks *every* active need, since the donor hasn't necessarily committed to a type yet.
- No 10km hard cutoff — distance just contributes fewer points the farther away, down to 0, rather than excluding the result. A CRITICAL need 20km away still shows up, just outscored by a closer HIGH-urgency one.
- If the donor's location couldn't be resolved (`donorLat`/`donorLng` null), distance is *omitted* from the score rather than zeroed — so browsing still ranks sensibly by urgency alone instead of being torpedoed by a failed geocode.

`toMatchPercent(score) = round(score / 80 × 100)`, clamped 0–100. This is the exact number shown as "70% match" in the UI.

### 2.2 The donor-override path

If an item carries a `preferredTrustId` (the donor clicked "Donate to this trust" in the live preview), `resolvePreferredTrust(preferredTrustId, type)` runs *before* the scoring algorithm:
```js
// look up that trust, include only its active needs of this item's type
// require: trust exists AND trust.isVerified AND has at least one matching active need
// → { trustId, needId } or null
```
If it resolves, the donation matches directly to that trust — **the score is never computed at all** for this path, so a donor can deliberately pick a lower-scoring trust and it sticks. If the preferred trust no longer qualifies (need closed, no longer verified, since the donor browsed a few minutes ago), it silently falls through to normal `matchDonation()` auto-matching rather than erroring the whole submission.

---

## 3. NGO Darpan — the honest-simulation logic

`backend/src/services/darpanService.js` is deliberately small — there's no real government API to call (see DOCUMENTATION.md §6 for why):

```js
DARPAN_ID_FORMAT = /^[A-Z]{2}\/\d{4}\/\d{7}$/        // XX/YYYY/NNNNNNN
MOCK_REGISTRY = new Set([...5 hardcoded IDs...])      // stand-in for a real DB lookup

isValidFormat(id)   → regex test
isInRegistry(id)    → Set.has()
verifyDarpanId(id)  → { formatValid, autoVerified, reason }
```

Called from both `auth.controller.js` (inline trust creation during `/auth/register`) and `trusts.controller.js` (the standalone `/trusts/register` endpoint) — same logic, two entry points. A registry hit sets `isVerified: true` immediately with `verifiedBy: 'system:darpan-registry'` and `verifiedAt: new Date()`. Anything format-valid but unrecognized creates the trust with `isVerified: false`, which is exactly what makes it appear in `admin.controller.js`'s `getPendingTrusts` (`where: { isVerified: false }`) for manual review. An invalid *format* is rejected at the HTTP layer with a 400, before a trust row is even attempted.

---

## 4. Frontend data flow — TanStack Query as the glue

Every page follows the same shape. From `CreateDonation.jsx`:
```js
const createDonation = useCreateDonation()   // wraps useMutation, defined in useDonations.js
createDonation.mutate(payload, { onSuccess: () => navigate('/donor') })
```
`useCreateDonation` (`frontend/src/api/hooks/useDonations.js`) just does `api.post('/donations', payload)` and, on success, calls `queryClient.invalidateQueries({queryKey: ['donations']})` — which is *why* the donor dashboard's list refreshes automatically with no manual refetch code anywhere. Every mutation hook in the app follows this same invalidate-on-success pattern.

### 4.1 The multi-item cart's state shape

`CreateDonation.jsx` keeps selected items as an **object keyed by type**, not an array:
```js
const [items, setItems] = useState({})   // e.g. { FOOD: {...}, BOOKS: {...} }
const selectedTypes = TYPES.filter((t) => items[t.value])   // derived, not stored
```
`toggleType(type)` either deletes that key or creates a fresh `emptyItem(type)`:
```js
if (next[type]) delete next[type]
else next[type] = emptyItem(type)
```
**Worth knowing precisely**: unchecking a type *discards* whatever was typed into it — re-checking the same box starts that item over blank, it does not restore prior input. (An in-code comment on `items` claims toggling "preserves what was typed"; that's aspirational, not what the code actually does — the object-keyed shape prevents cross-type field collisions and lets multiple type-forms render simultaneously, but doesn't add undo/restore semantics.) The live match-preview panel (`useBrowseNeeds()`, a separate mutation) is debounced 600ms after the address stops changing and re-filters client-side against whichever `selectedTypes` are currently checked — it doesn't refetch per checkbox toggle, only per address edit.

Each item's `preferredTrustId`/`preferredTrustName` (the manual trust-selection override, §2.2) lives inside that same per-type object, set by `chooseTrust(type, trustId, trustName)` from the `TrustMatchGroup` sub-component in the preview panel.

---

## 5. Mobile's flow

Same interceptor pattern as the frontend (`mobile/lib/api.js`). The real user flow: `pickups.jsx` gets the phone's live GPS via `expo-location`, calls `GET /volunteers/pickups?lat&lng` (server-sorts by distance in `volunteers.controller.js`'s `listPickups`), `accept` generates a `deliveryOtp` server-side and assigns the volunteer, `pickup/[id].jsx` is a *local* gate for the pickup OTP the trust reads aloud at hand-off (not itself a server call), then `camera.jsx` captures a photo, uploads it multipart to `/donations/:id/photo-proof`, and finally calls `/donations/:id/confirm-delivery` with the carried-over OTP — the one endpoint that actually flips status to `DELIVERED` and creates the `DeliveryLog` row, inside a `prisma.$transaction` alongside incrementing the volunteer's `totalDeliveries`.

(Currently mid-downgrade from Expo SDK 57→54 — see the status notes in conversation; code paths described here are unaffected by that, it's a dependency-version issue, not a logic change.)
