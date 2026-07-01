import React, { useState, useEffect, useRef, Suspense } from 'react'
import { apiGetReviews } from '../api/client'

// ── Real class-based ErrorBoundary (Scenario 8 — Force Error Boundary via DevTools)
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(err) { return { hasError: true, error: err } }
  componentDidCatch(err, info) { console.error('[ErrorBoundary caught]', err, info) }
  render() {
    if (this.state.hasError) return (
      <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">💥</div>
        <p className="text-danger font-bold mb-1">Something went wrong in Reviews</p>
        <p className="text-muted text-sm mb-4">{this.state.error?.message || 'Unknown error'}</p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="px-5 py-2 bg-accent text-white font-semibold rounded-lg text-sm"
        >
          Try again
        </button>
      </div>
    )
    return this.props.children
  }
}

// ── ProductSummary — intentionally NOT memoized (Scenario 10 — Highlight Updates)
function ProductSummary({ reviews }) {
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
    : '—'
  return (
    <div className="flex items-center gap-6 p-4 bg-surface2 border border-border rounded-xl mb-5">
      <div className="text-center shrink-0">
        <div className="text-4xl font-extrabold text-accent">{avg}</div>
        <div className="text-warning text-lg">{'★'.repeat(Math.round(avg))}</div>
        <div className="text-muted text-xs mt-0.5">{reviews.length} reviews</div>
      </div>
      <div className="flex-1">
        {[5, 4, 3, 2, 1].map(n => {
          const count = reviews.filter(r => r.stars === n).length
          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0
          return (
            <div key={n} className="flex items-center gap-2 mb-1">
              <span className="text-muted text-xs w-3">{n}</span>
              <span className="text-warning text-xs">★</span>
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-muted text-xs w-5">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FilterBar — minStars hardcoded to 5 (Scenario 9 — Edit Live State)
function FilterBar({ onChange, sort, onSort }) {
  const [minStars, setMinStars] = useState(5) // BUG: should be 1

  function handleStar(n) { setMinStars(n); onChange(n) }

  return (
    <div className="flex items-center gap-4 flex-wrap mb-5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-bold tracking-wide">MIN STARS</span>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => handleStar(n)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
              minStars === n
                ? 'bg-accent text-white border-accent'
                : 'bg-surface2 text-muted border-border hover:border-accent'
            }`}
          >
            {'★'.repeat(n)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted font-bold tracking-wide">SORT</span>
        <select
          value={sort}
          onChange={e => onSort(e.target.value)}
          className="bg-surface2 text-textbase border border-border rounded-md px-3 py-1.5 text-xs cursor-pointer focus:outline-none focus:border-accent"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="helpful">Most Helpful</option>
          <option value="stars-hi">Stars ↓</option>
          <option value="stars-lo">Stars ↑</option>
        </select>
      </div>
    </div>
  )
}

// ── ReviewCard — intentionally NOT wrapped in React.memo (Scenarios 10 + 11)
function ReviewCard({ review, onAddToCart }) {
  return (
    <div className="bg-surface2 border border-border rounded-xl p-5 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-bold text-sm text-textbase">{review.author}</span>
          <span className="text-warning ml-2 text-sm">
            {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
          </span>
        </div>
        <span className="text-muted text-xs">{review.date}</span>
      </div>
      <p className="text-[#b0b0c0] text-sm leading-relaxed mb-3">{review.text}</p>
      <div className="flex items-center">
        <span className="text-muted text-xs">👍 {review.helpful} found helpful</span>
        <button
          onClick={() => onAddToCart(review.id)}
          className="ml-auto border border-border text-accent hover:bg-accent/10 rounded-md px-3 py-1 text-xs font-semibold transition-all"
        >
          + Add to Cart
        </button>
      </div>
    </div>
  )
}

// ── ReviewsList — double-fetch under StrictMode (Scenario 12)
function ReviewsList() {
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [minStars, setMinStars]   = useState(1)
  const [sort, setSort]           = useState('newest')
  const [cartCount, setCartCount] = useState(0)
  const fetchCount = useRef(0)

  useEffect(() => {
    fetchCount.current += 1
    const n = fetchCount.current
    console.log(`%c[ReviewsList] useEffect fired (invoke #${n}) — StrictMode double-invoke?`, 'color:#fbbf24')
    setLoading(true)
    apiGetReviews()
      .then(data => {
        console.log(`%c[ReviewsList] Reviews loaded on invoke #${n}`, 'color:#4ade80')
        setReviews(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const sorted = [...reviews]
    .filter(r => r.stars >= minStars)
    .sort((a, b) => {
      if (sort === 'newest')   return new Date(b.date) - new Date(a.date)
      if (sort === 'oldest')   return new Date(a.date) - new Date(b.date)
      if (sort === 'helpful')  return b.helpful - a.helpful
      if (sort === 'stars-hi') return b.stars - a.stars
      if (sort === 'stars-lo') return a.stars - b.stars
      return 0
    })

  // Inline arrow fn — recreated every render (Scenario 11 — Profiler)
  const handleAddToCart = (id) => {
    setCartCount(c => c + 1)
    console.log(`[Cart] Added review product #${id}`)
  }

  if (loading) return (
    <div className="flex flex-col items-center gap-3 py-12 text-muted">
      <span className="text-4xl animate-spin-slow">⏳</span>
      <span className="text-sm">Loading reviews…</span>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-textbase">Customer Reviews</h2>
        <span className="bg-accent/10 text-accent border border-accent/30 rounded-full px-3 py-0.5 text-xs font-semibold">
          🛒 Cart: {cartCount} items
        </span>
      </div>
      <ProductSummary reviews={reviews} />
      <FilterBar onChange={setMinStars} sort={sort} onSort={setSort} />
      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted flex flex-col gap-2">
          <span className="text-sm">No reviews match this filter.</span>
          <span className="text-xs text-[#555]">
            Hint: edit <code className="text-info bg-white/10 px-1 rounded">FilterBar</code> state in React DevTools Components panel (Challenge 9)
          </span>
        </div>
      ) : (
        sorted.map(r => <ReviewCard key={r.id} review={r} onAddToCart={handleAddToCart} />)
      )}
    </div>
  )
}

// ── Root — StrictMode + ErrorBoundary + Suspense (Scenarios 7, 8, 12)
export function ReviewsSection() {
  return (
    <React.StrictMode>
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex flex-col items-center gap-2 py-10 text-muted">
            <span className="text-3xl animate-spin-slow">⏳</span>
            <span className="text-sm">Loading reviews section…</span>
            <span className="text-xs text-[#555]">Toggle this in React DevTools Suspense panel (Challenge 7)</span>
          </div>
        }>
          <ReviewsList />
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  )
}
