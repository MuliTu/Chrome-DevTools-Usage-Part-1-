import { useState, useEffect, useRef } from 'react'
import { Panel, Badge, Btn, Toggle, Callout, Code } from '../components/UI'

let globalReqId = 0

function useSearch(query, fixed) {
  const [result, setResult]     = useState(null)
  const [requests, setRequests] = useState([])
  const latestId = useRef(0)

  useEffect(() => {
    if (!query) { setResult(null); setRequests([]); return }

    const reqId = ++globalReqId
    const startTime = Date.now()

    setRequests(prev => [...prev.slice(-9), {
      id: reqId, q: query, status: 'pending', startTime, endTime: null, latency: null,
    }])

    const controller = new AbortController()

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: fixed ? controller.signal : undefined,
    })
      .then(r => r.json())
      .then(data => {
        const endTime = Date.now()
        const isStale = reqId < latestId.current

        setRequests(prev => prev.map(r =>
          r.id === reqId ? { ...r, status: isStale ? 'stale' : 'done', endTime, latency: data.latency } : r
        ))

        if (!isStale) {
          latestId.current = reqId
          setResult(data)
        }
      })
      .catch(() => {
        setRequests(prev => prev.map(r =>
          r.id === reqId && r.status === 'pending' ? { ...r, status: 'cancelled' } : r
        ))
      })

    latestId.current = Math.max(latestId.current, reqId)

    if (fixed) return () => controller.abort()
  }, [query, fixed])

  return { result, requests }
}

export default function S4_RaceCondition() {
  const [fixed, setFixed] = useState(false)
  const [query, setQuery] = useState('')

  const { result, requests } = useSearch(query, fixed)

  function handleInput(e) { setQuery(e.target.value) }

  const staleResult = result && result.q !== query

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="red">Common Bug</Badge>
          <Badge color="blue">Async / Network</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Network Race Condition</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          Each keystroke fires a new request with a <strong className="text-text">random server delay (200–1400ms)</strong>.
          Without cleanup, whichever response arrives <em>last</em> wins — even if it's stale.
        </p>
      </div>

      <Toggle left="Buggy (no cleanup)" right="Fixed (AbortController)" value={fixed}
        onChange={v => { setFixed(v); setQuery('') }} />

      <div className="grid grid-cols-2 gap-5">
        <Panel title="Search Demo" icon="🔎">
          <div className="p-5 space-y-4">
            <input
              value={query}
              onChange={handleInput}
              placeholder="Type: a, b, c, d, e, f, g…"
              className="w-full bg-surface3 border border-border rounded-xl px-4 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />

            {staleResult && !fixed && (
              <div className="flex gap-3 bg-red/10 border border-red/30 rounded-xl p-4">
                <span className="text-2xl shrink-0">⚠️</span>
                <div>
                  <p className="text-red font-bold text-[14px]">Stale result displayed!</p>
                  <p className="text-muted text-[13px] mt-0.5">
                    Showing results for <span className="font-mono text-red font-bold">"{result?.q}"</span>{' '}
                    but you typed <span className="font-mono text-yellow font-bold">"{query}"</span>
                  </p>
                </div>
              </div>
            )}

            <div className="min-h-32">
              {result ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[13px] text-muted">Results for</span>
                    <span className={`font-mono text-[13px] font-bold ${staleResult && !fixed ? 'text-red' : 'text-accent'}`}>
                      "{result.q}"
                    </span>
                    <span className="ml-auto text-[11px] text-muted">{result.latency}ms server</span>
                  </div>
                  {result.results.length > 0
                    ? <div className="space-y-1">
                        {result.results.map(r => (
                          <div key={r} className="px-4 py-2.5 rounded-xl bg-surface3 border border-border font-mono text-[14px]">{r}</div>
                        ))}
                      </div>
                    : <div className="text-muted text-[14px] text-center py-6">No matches</div>
                  }
                </div>
              ) : (
                <div className="text-muted text-[14px] text-center py-8">Start typing to search…</div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Request Timeline" icon="📡">
          <div className="p-4 space-y-3 overflow-y-auto max-h-96">
            {requests.length === 0
              ? <div className="text-center py-12 text-muted text-[13px]">Type to see requests appear here</div>
              : requests.map(r => {
                  const statusMap = {
                    pending:   { text: 'text-yellow', bar: 'bg-yellow/50', badge: 'text-yellow bg-yellow/15 border-yellow/30', label: 'pending' },
                    done:      { text: 'text-green',  bar: 'bg-green/50',  badge: 'text-green  bg-green/15  border-green/30',  label: 'done ✓'  },
                    stale:     { text: 'text-red',    bar: 'bg-red/50',    badge: 'text-red    bg-red/15    border-red/30',    label: 'STALE !'  },
                    cancelled: { text: 'text-muted',  bar: 'bg-muted/30',  badge: 'text-muted  bg-surface3  border-border',    label: 'cancelled'  },
                  }
                  const s = statusMap[r.status] ?? statusMap.pending
                  const duration = (r.endTime ?? Date.now()) - r.startTime
                  const maxDur = 1600
                  const pct = Math.min((duration / maxDur) * 100, 100)

                  return (
                    <div key={r.id} className="slide-in space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted w-6">#{r.id}</span>
                        <span className={`font-mono text-[13px] font-bold ${s.text}`}>"{r.q}"</span>
                        <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.badge}`}>
                          {s.label}
                        </span>
                        {r.latency && <span className="font-mono text-[11px] text-muted">{r.latency}ms</span>}
                      </div>
                      <div className="h-2 bg-surface3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bar-grow ${s.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </Panel>
      </div>

      <Panel title="The Fix" icon="💊">
        <div className="p-5 grid grid-cols-2 gap-5">
          <div>
            <p className="text-[13px] text-red font-bold mb-3">❌ Buggy — last response wins</p>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  fetch(\`/api/search?q=\${query}\`)
    .then(r => r.json())
    .then(data => setResult(data))
    // always sets — even if stale
}, [query])
// no cleanup → race condition`}</pre>
          </div>
          <div>
            <p className="text-[13px] text-green font-bold mb-3">✅ Fixed — AbortController</p>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  const ctrl = new AbortController()

  fetch(\`/api/search?q=\${query}\`, {
    signal: ctrl.signal
  })
    .then(r => r.json())
    .then(data => setResult(data))
    .catch(() => {}) // ignore AbortError

  return () => ctrl.abort() // ← the fix
}, [query])`}</pre>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4">
        <Callout type="danger">
          In buggy mode, type fast. A slow early request can arrive after a fast later one, overwriting the correct result with stale data.
        </Callout>
        <Callout type="success">
          In fixed mode, every new keystroke cancels the previous request. Only the latest query can update the UI. Cancelled requests show in grey.
        </Callout>
      </div>
    </div>
  )
}
