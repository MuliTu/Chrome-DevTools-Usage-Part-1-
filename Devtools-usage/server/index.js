import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(express.json())
app.use(cors({ origin: '*' }))

const delay = ms => new Promise(r => setTimeout(r, ms))

// ─────────────────────────────────────────────────────────
// GET /api/product
// Bug: price 999 instead of 49 (Scenario 1 — Override Content)
// ─────────────────────────────────────────────────────────
app.get('/api/product', async (req, res) => {
  await delay(320)
  res.json({
    name: 'Wireless Pro Headphones X1',
    price: 999,
    originalPrice: 149,
    description: 'Studio-quality sound with 40hr battery, ANC, and foldable design. Perfect for remote work and travel.',
    sku: 'WPH-X1-BLK',
    rating: 4.9,
    reviewCount: 2341,
  })
})

// ─────────────────────────────────────────────────────────
// GET /api/ping
// Used by client to measure RTT (Scenario 3 — Throttle)
// ─────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true }))

// ─────────────────────────────────────────────────────────
// POST /api/checkout
// Gate 1 (client-side): tracker must be blocked (Scenario 2)
// Gate 2 (server-side): connectionRtt must be >= 1000ms (Scenario 3 — custom throttle)
// Gate 3 (client-side): response header test-header-value: 1 must be present (Scenario 4)
// ─────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  await delay(600)
  const { sku, qty = 1, connectionRtt } = req.body

  // Scenario 3: reject if connection RTT is under 1000ms
  if (!connectionRtt || connectionRtt < 1000) {
    return res.status(403).json({
      error: 'connection_too_fast',
      message: `RTT ${connectionRtt ?? 0}ms — too fast. Create a custom throttle profile with latency ≥ 1000ms (Scenario 3).`,
      rtt: connectionRtt ?? 0,
    })
  }

  res.status(200).json({
    success: true,
    orderId: `ORD-${Date.now()}`,
    message: 'Order placed successfully!',
    item: { sku, qty, price: 49 },
    estimatedDelivery: '2–3 business days',
  })
})

// ─────────────────────────────────────────────────────────
// POST /api/checkout-broken
// Always 422 — Scenario 5 (Copy as cURL)
// ─────────────────────────────────────────────────────────
app.post('/api/checkout-broken', async (req, res) => {
  await delay(400)
  res.status(422).json({
    error: 'invalid_coupon',
    message: 'Coupon SAVE20 has expired',
    field: 'coupon_code',
    docs: 'https://api.techgear.dev/errors#invalid_coupon',
  })
})

// ─────────────────────────────────────────────────────────
// GET /analytics/tracker.js
// Slow (2.8s) AND sets window.__techGearAds.blocking = true (Scenario 2)
// User must block this URL so the flag is never set
// ─────────────────────────────────────────────────────────
app.get('/analytics/tracker.js', async (req, res) => {
  await delay(2800)
  res.setHeader('Content-Type', 'application/javascript')
  res.send(`
// TechGear Ads & Analytics v3.2.1 — loaded in ${2800}ms
window.__techGearAds = { blocking: true, version: '3.2.1' };
console.warn('[tracker] Loaded — purchase gate active. Block this script to buy! (Scenario 2)');
`)
})

// ─────────────────────────────────────────────────────────
// GET /api/recommendations — high TTFB (Scenario 5 side effect)
// ─────────────────────────────────────────────────────────
app.get('/api/recommendations', async (req, res) => {
  await delay(1900)
  res.json({
    _debug: 'TTFB was 1900ms — check the Timing tab in DevTools Network',
    items: [
      { id: 10, name: 'USB-C Audio Adapter', price: 19 },
      { id: 11, name: 'Headphone Stand Pro', price: 34 },
      { id: 12, name: 'Carry Case XL', price: 27 },
    ],
  })
})

// ─────────────────────────────────────────────────────────
// GET /api/reviews
// ─────────────────────────────────────────────────────────
app.get('/api/reviews', async (req, res) => {
  await delay(800)
  res.json([
    { id: 1, author: 'Sarah K.',  stars: 5, date: '2026-05-12', text: 'Incredible sound quality. The ANC is best in class. Worth every penny!', helpful: 42 },
    { id: 2, author: 'Mike T.',   stars: 4, date: '2026-04-30', text: 'Great headphones overall. Battery life is amazing. Slightly heavy for long sessions.', helpful: 28 },
    { id: 3, author: 'Jess L.',   stars: 5, date: '2026-04-18', text: 'Bought for WFH. Total game changer — I can finally focus with kids at home.', helpful: 61 },
    { id: 4, author: 'Omar A.',   stars: 3, date: '2026-03-22', text: 'Sound is good but the app is buggy. Had to pair twice before it connected.', helpful: 15 },
    { id: 5, author: 'Nina P.',   stars: 5, date: '2026-03-10', text: 'These replaced my $400 Sony pair. Zero regrets. Bass is punchy without being muddy.', helpful: 77 },
    { id: 6, author: 'Dan R.',    stars: 2, date: '2026-02-28', text: 'Left earcup creaks when squeezed. Build quality is concerning.', helpful: 9 },
  ])
})

// ─────────────────────────────────────────────────────────
// POST /api/wishlist
// ─────────────────────────────────────────────────────────
app.post('/api/wishlist', async (req, res) => {
  await delay(200)
  res.json({ saved: true, message: 'Added to wishlist' })
})

// ─────────────────────────────────────────────────────────
// Debug Lab: Race Condition (S4)
// ─────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = req.query.q || ''
  const ms = Math.floor(Math.random() * 1200) + 200
  await delay(ms)
  const results = ['apple', 'banana', 'cherry', 'dragonfruit', 'elderberry', 'fig', 'grape']
    .filter(f => f.startsWith(q.toLowerCase()) || q === '')
    .slice(0, 5)
  res.json({ q, results, latency: ms })
})

// ─────────────────────────────────────────────────────────
// Debug Lab: Waterfall vs Parallel (S6)
// ─────────────────────────────────────────────────────────
app.get('/api/data/user',  async (req, res) => { await delay(600); res.json({ id: 1, name: 'Alex Rivera', role: 'Engineer', latency: 600 }) })
app.get('/api/data/posts', async (req, res) => { await delay(800); res.json({ count: 42, latest: 'Debug Lab is live!', latency: 800 }) })
app.get('/api/data/stats', async (req, res) => { await delay(500); res.json({ views: 1204, likes: 87, latency: 500 }) })

app.listen(PORT, () => {
  console.log(`\n  🚀  API server running at http://localhost:${PORT}\n`)
})
