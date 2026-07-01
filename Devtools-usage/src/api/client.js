// Real fetch calls — all hit the Express server (proxied by Vite dev server)

export async function apiGetProduct() {
  const res = await fetch('/api/product')
  if (!res.ok) throw new Error(`/api/product ${res.status}`)
  return res.json()
}

export async function apiCheckout(payload) {
  // Measure RTT via ping for the server-side gate (Scenario 3)
  const t0 = Date.now()
  await fetch('/api/ping').catch(() => {})
  const connectionRtt = Date.now() - t0

  const fetchStart = Date.now()
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Coupon': 'SAVE20' },
    body: JSON.stringify({ ...payload, connectionRtt }),
  })
  const elapsed = Date.now() - fetchStart

  console.log('[Scenario 4] /api/checkout responded', res.status, '— connectionRtt sent was', connectionRtt, 'ms')

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.warn('[Scenario 4] request rejected before header check — body:', body)
    throw Object.assign(new Error('Checkout failed'), { status: res.status, body, elapsed })
  }

  // Scenario 4: check for required response header (added via DevTools Override headers)
  const headerVal = res.headers.get('test-header-value')
  console.log('[Scenario 4] all response headers:', Object.fromEntries(res.headers.entries()))
  console.log('[Scenario 4] test-header-value =', JSON.stringify(headerVal))
  if (headerVal !== '1') {
    console.warn('[Scenario 4] FAIL — expected "1", got', JSON.stringify(headerVal))
    throw Object.assign(new Error('Missing header'), { missingHeader: true, elapsed })
  }
  console.log('[Scenario 4] PASS')

  return res.json()
}

// Scenario 5 — always returns 422 so user can practice Copy as cURL
export async function apiCheckoutBroken(payload) {
  const res = await fetch('/api/checkout-broken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Coupon': 'SAVE20' },
    body: JSON.stringify(payload),
  })
  return res
}

export async function apiGetReviews() {
  const res = await fetch('/api/reviews')
  if (!res.ok) throw new Error(`/api/reviews ${res.status}`)
  return res.json()
}

export async function apiAnalyticsTracker() {
  return fetch('/analytics/tracker.js')
}

export async function apiGetRecommendations() {
  const res = await fetch('/api/recommendations')
  if (!res.ok) throw new Error(`/api/recommendations ${res.status}`)
  return res.json()
}

export async function apiWishlist(sku) {
  const res = await fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku }),
  })
  return res.json()
}
