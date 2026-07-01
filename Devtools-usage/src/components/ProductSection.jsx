import { useState, useEffect } from 'react'
import {
  apiGetProduct, apiCheckout, apiCheckoutBroken, apiWishlist,
  apiGetRecommendations,
} from '../api/client'

// Intentional bug — rate should be 0.20 for the 20% promo (Scenario 6 — Logpoint)
function calculateDiscount(price) {
  const rate = 0.10
  const discount = price * rate
  return discount
}

export function ProductSection({ onLog, onDone }) {
  const [product, setProduct] = useState(null)
  const [order, setOrder]     = useState(null)
  const [buyStatus, setBuyStatus] = useState(null)
  const [buying, setBuying]   = useState(false)

  useEffect(() => {
    onLog('→ GET /api/product', 'log')
    apiGetProduct()
      .then(d => {
        setProduct(d)
        onLog(`✓ Product loaded — price: $${d.price}`, 'log')
        // Scenario 1 auto-complete: price was overridden to $49
        if (d.price === 49) {
          onLog('✓ Scenario 1 complete — price override detected!', 'log')
          onDone(1)
        }
      })
      .catch(() => onLog('✗ Failed to load product', 'err'))

    // Scenario 2 — inject tracker as a real <script> tag so it actually executes
    // (fetch() only downloads text; it wouldn't set window.__techGearAds)
    onLog('→ <script src="/analytics/tracker.js"> injected (slow — will block purchase!)', 'warn')
    const script = document.createElement('script')
    script.src = '/analytics/tracker.js'
    script.onload = () => onLog('✓ tracker.js loaded — window.__techGearAds.blocking = true (Scenario 2)', 'warn')
    script.onerror = () => {
      // Blocked by DevTools — Scenario 2 complete
      onLog('✓ Scenario 2 complete — tracker blocked!', 'log')
      onDone(2)
    }
    document.head.appendChild(script)

    onLog('→ GET /api/recommendations', 'log')
    apiGetRecommendations()
      .then(() => onLog('✓ /api/recommendations — TTFB ~1.9s (check Timing tab)', 'warn'))
      .catch(() => {})

    // Scenario 5 — silently fires broken checkout on load
    apiCheckoutBroken({ sku: 'WPH-X1-BLK', qty: 1, coupon: 'SAVE20' })
      .then(() => onLog('→ POST /api/checkout-broken → 422 (use Copy as cURL — Scenario 5)', 'err'))
  }, [])

  async function handleBuy() {
    setBuyStatus(null)

    // Gate 1: tracker must be blocked (Scenario 2)
    if (window.__techGearAds?.blocking) {
      setBuyStatus('tracker')
      onLog('✗ Purchase blocked by analytics tracker — block /analytics/tracker.js first (Scenario 2)', 'err')
      return
    }

    setBuying(true)
    const discount = calculateDiscount(product?.price ?? 99)
    onLog(`calculateDiscount(${product?.price ?? 99}) = ${discount} — add a Logpoint in Sources! (Scenario 6)`, 'warn')
    onLog('→ POST /api/checkout (measuring RTT first…)', 'log')

    const t0 = Date.now()
    try {
      const data = await apiCheckout({ sku: 'WPH-X1-BLK', qty: 1, discount })
      const elapsed = Date.now() - t0
      onLog(`→ checkout took ${elapsed}ms`, 'log')
      if (elapsed > 800) { onDone(3) }
      onDone(4)
      setOrder(data)
      onLog(`✓ Order placed! ID: ${data.orderId}`, 'log')
    } catch (err) {
      const elapsed = Date.now() - t0
      onLog(`→ checkout took ${elapsed}ms`, 'log')
      if (elapsed > 800) { onDone(3) }

      if (err.body?.error === 'connection_too_fast') {
        setBuyStatus('too-fast')
        onLog(`✗ RTT ${err.body.rtt}ms — too fast. Throttle just /api/ping (Scenario 3)`, 'err')
      } else if (err.missingHeader) {
        setBuyStatus('missing-header')
        onLog('✗ Response missing test-header-value: 1 — use Override headers (Scenario 4)', 'err')
      } else {
        setBuyStatus('err')
        onLog(`✗ /api/checkout → ${err.status ?? 'failed'}`, 'err')
      }
    } finally {
      setBuying(false)
    }
  }

  async function handleWishlist() {
    onLog('→ POST /api/wishlist', 'log')
    await apiWishlist('WPH-X1-BLK')
    onLog('✓ Added to wishlist', 'log')
  }

  // ── Success screen ───────────────────────────────────────
  if (order) {
    return (
      <div className="bg-surface border border-success/30 rounded-xl p-8 mb-8 flex flex-col items-center gap-4 text-center">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-success">Order Placed!</h2>
        <p className="text-muted text-sm">You unblocked the tracker, throttled just the /api/ping request, and overrode the response header. Nice work.</p>
        <div className="bg-surface2 border border-border rounded-lg px-6 py-4 text-left text-sm space-y-1 w-full max-w-sm">
          <div className="flex justify-between"><span className="text-muted">Order ID</span><span className="font-mono text-textbase">{order.orderId}</span></div>
          <div className="flex justify-between"><span className="text-muted">Item</span><span className="text-textbase">{order.item?.sku}</span></div>
          <div className="flex justify-between"><span className="text-muted">Price</span><span className="text-accent font-bold">${order.item?.price}</span></div>
          <div className="flex justify-between"><span className="text-muted">Delivery</span><span className="text-textbase">{order.estimatedDelivery}</span></div>
        </div>
        <button
          onClick={() => { setOrder(null); setBuyStatus(null) }}
          className="text-xs text-muted border border-border rounded-md px-4 py-2 hover:border-accent hover:text-accent transition-all"
        >
          ↺ Buy again
        </button>
      </div>
    )
  }

  // ── Product card ─────────────────────────────────────────
  return (
    <div className="bg-surface border border-border rounded-xl p-8 grid grid-cols-[220px_1fr] gap-8 mb-8">
      <div className="bg-gradient-to-br from-[#1e1e2e] to-[#2a2a3e] rounded-lg flex items-center justify-center text-7xl aspect-square">
        🎧
      </div>

      <div className="flex flex-col gap-3">
        <span className="inline-block bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-0.5 text-xs font-semibold w-fit tracking-wide">
          NEW ARRIVAL
        </span>

        <h1 className="text-3xl font-bold leading-tight text-textbase">
          {product?.name ?? 'Loading…'}
        </h1>

        <div className="text-warning text-sm">
          ★★★★★ <span className="text-muted">{product?.rating ?? 4.9} ({product?.reviewCount?.toLocaleString() ?? '2,341'} reviews)</span>
        </div>

        <div className="text-3xl font-extrabold text-accent">
          <span className="text-lg text-muted line-through font-normal mr-2">${product?.originalPrice ?? 149}</span>
          {product ? `$${product.price}` : '—'}
        </div>

        <p className="text-muted leading-relaxed text-[0.95rem]">
          {product?.description ?? 'Loading product details…'}
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleBuy}
            disabled={buying}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {buying ? '⏳ Processing…' : '🛒 Buy Now'}
          </button>
          <button
            onClick={handleWishlist}
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface2 border border-border text-textbase font-semibold rounded-lg transition-all hover:border-accent"
          >
            ♡ Wishlist
          </button>
        </div>

        {/* Gate 1 — tracker blocking */}
        {buyStatus === 'tracker' && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <p className="text-danger text-sm font-semibold">🚫 Purchase blocked by analytics tracker</p>
            <p className="text-muted text-xs mt-1">
              <code className="text-warning">window.__techGearAds.blocking = true</code> is preventing checkout.
              Block <code className="text-warning">/analytics/tracker.js</code> in DevTools, then hard-reload.
            </p>
          </div>
        )}

        {/* Gate 2 — connection too fast */}
        {buyStatus === 'too-fast' && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <p className="text-danger text-sm font-semibold">⚡ Connection too fast — bot detected</p>
            <p className="text-muted text-xs mt-1">
              The payment processor measured your RTT and rejected the request. Right-click the <code>/api/ping</code> request in DevTools Network → <strong>Throttle request</strong> (latency ≥ 1000ms) and try again.
            </p>
          </div>
        )}

        {/* Gate 3 — missing response header */}
        {buyStatus === 'missing-header' && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
            <p className="text-danger text-sm font-semibold">🔑 Missing response header</p>
            <p className="text-muted text-xs mt-1">
              Response is missing <code className="text-warning">test-header-value: 1</code>.
              DevTools → Network → right-click <code className="text-warning">POST /api/checkout</code> → <strong className="text-textbase">Override headers</strong> → add it.
            </p>
          </div>
        )}

        {buyStatus === 'err' && (
          <p className="text-sm text-danger">✗ Checkout failed — check the console.</p>
        )}
      </div>
    </div>
  )
}
