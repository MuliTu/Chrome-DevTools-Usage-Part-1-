import { useState } from 'react'
import { Panel, Badge, Btn, Callout, Code } from '../components/UI'

const ENDPOINTS = [
  { id: 'user',  label: '/api/data/user',  color: 'blue',   url: '/api/data/user'  },
  { id: 'posts', label: '/api/data/posts', color: 'purple', url: '/api/data/posts' },
  { id: 'stats', label: '/api/data/stats', color: 'green',  url: '/api/data/stats' },
]
const EXPECTED = { user: 600, posts: 800, stats: 500 }

const C = {
  blue:   { bar: 'bg-blue',   text: 'text-blue',   border: 'border-blue/40',   bg: 'bg-blue/10'   },
  purple: { bar: 'bg-purple', text: 'text-purple', border: 'border-purple/40', bg: 'bg-purple/10' },
  green:  { bar: 'bg-green',  text: 'text-green',  border: 'border-green/40',  bg: 'bg-green/10'  },
  yellow: { bar: 'bg-yellow', text: 'text-yellow', border: 'border-yellow/40', bg: 'bg-yellow/10' },
  muted:  { bar: 'bg-muted',  text: 'text-muted',  border: 'border-border',    bg: 'bg-surface3'  },
}

function GanttChart({ timings, maxTime }) {
  if (!timings.length) return <div className="text-center py-10 text-muted text-[13px]">Click Run to see the chart</div>
  const scale = 100 / (maxTime || 1)
  return (
    <div className="space-y-3">
      {timings.map(t => {
        const c = C[t.color]
        const left = t.start * scale
        const width = Math.max((t.end - t.start) * scale, 2)
        return (
          <div key={t.id} className="space-y-1">
            <div className="flex items-center justify-between text-[12px]">
              <span className={`font-mono font-bold ${c.text}`}>{t.label}</span>
              <span className="text-muted">{t.duration}ms</span>
            </div>
            <div className="relative h-8 bg-surface3 rounded-xl overflow-hidden border border-border">
              <div
                className={`absolute h-full rounded-xl ${c.bar} opacity-80 flex items-center pl-2`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="text-[11px] font-bold text-white/90 whitespace-nowrap">{t.duration}ms</span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="relative h-4 mt-1">
        {[0, 25, 50, 75, 100].map(pct => (
          <span key={pct} className="absolute text-[10px] text-muted -translate-x-1/2" style={{ left: `${pct}%` }}>
            {Math.round((maxTime * pct) / 100)}ms
          </span>
        ))}
      </div>
    </div>
  )
}

export default function S6_WaterfallVsParallel() {
  const [wfRunning, setWfRunning] = useState(false)
  const [wfTimings, setWfTimings] = useState([])
  const [wfTotal,   setWfTotal]   = useState(null)
  const [wfLogs,    setWfLogs]    = useState([])

  const [parRunning, setParRunning] = useState(false)
  const [parTimings, setParTimings] = useState([])
  const [parTotal,   setParTotal]   = useState(null)
  const [parLogs,    setParLogs]    = useState([])

  async function runWaterfall() {
    setWfRunning(true); setWfTimings([]); setWfTotal(null); setWfLogs([])
    const start = Date.now()
    const results = []
    const logs = []

    for (const ep of ENDPOINTS) {
      const t0 = Date.now() - start
      logs.push({ msg: `→ Starting ${ep.label}`, color: ep.color })
      setWfLogs([...logs])
      const res  = await fetch(ep.url)
      const data = await res.json()
      const elapsed = Date.now() - start
      logs.push({ msg: `✓ ${ep.label} — ${data.latency}ms`, color: ep.color })
      setWfLogs([...logs])
      results.push({ ...ep, start: t0, end: elapsed, duration: data.latency })
      setWfTimings([...results])
    }

    const totalMs = Date.now() - start
    setWfTotal(totalMs)
    logs.push({ msg: `⏱ Total: ${totalMs}ms (sum of all)`, color: 'yellow' })
    setWfLogs([...logs])
    setWfRunning(false)
  }

  async function runParallel() {
    setParRunning(true); setParTimings([]); setParTotal(null); setParLogs([])
    const start = Date.now()
    const logs = [{ msg: '→ Firing all 3 simultaneously…', color: 'muted' }]
    setParLogs([...logs])

    const promises = ENDPOINTS.map(async ep => {
      const t0  = Date.now() - start
      const res  = await fetch(ep.url)
      const data = await res.json()
      const elapsed = Date.now() - start
      logs.push({ msg: `✓ ${ep.label} — ${data.latency}ms`, color: ep.color })
      setParLogs([...logs])
      return { ...ep, start: t0, end: elapsed, duration: data.latency }
    })

    const results = await Promise.all(promises)
    const totalMs = Date.now() - start
    setParTimings(results)
    setParTotal(totalMs)
    logs.push({ msg: `⏱ Total: ${totalMs}ms (bottleneck only)`, color: 'green' })
    setParLogs([...logs])
    setParRunning(false)
  }

  const busy = wfRunning || parRunning
  const maxTime = Math.max(...wfTimings.map(t => t.end), ...parTimings.map(t => t.end), 1900)

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="yellow">Performance</Badge>
          <Badge color="blue">Async / Network</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Waterfall vs. Parallel Fetching</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          Three independent API calls:{' '}
          <span className="text-blue font-mono">/user</span> (600ms),{' '}
          <span className="text-purple font-mono">/posts</span> (800ms),{' '}
          <span className="text-green font-mono">/stats</span> (500ms).
          Sequential <Code>await</Code> adds them. <Code>Promise.all</Code> fires all at once — total time = slowest.
        </p>
      </div>

      {/* Endpoint cards */}
      <div className="grid grid-cols-3 gap-4">
        {ENDPOINTS.map(ep => {
          const c = C[ep.color]
          return (
            <div key={ep.id} className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
              <div className={`font-mono text-[13px] font-bold mb-2 ${c.text}`}>{ep.label}</div>
              <div className="text-3xl font-extrabold text-text">{EXPECTED[ep.id]}ms</div>
              <div className="text-[11px] text-muted mt-1">server delay</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Waterfall */}
        <Panel title="❌ Sequential await" icon="🐌">
          <div className="p-5 space-y-4">
            <Btn onClick={runWaterfall} disabled={busy} variant="danger">
              {wfRunning ? '⏳ Fetching…' : '▶ Run Waterfall'}
            </Btn>
            {wfTotal != null && (
              <div className="bg-red/10 border border-red/30 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-[14px] text-red font-bold">Total</span>
                <span className="font-mono text-3xl font-extrabold text-red">{wfTotal}ms</span>
              </div>
            )}
            <GanttChart timings={wfTimings} maxTime={maxTime} />
            <div className="space-y-1.5 min-h-10">
              {wfLogs.map((l, i) => (
                <div key={i} className={`text-[13px] slide-in ${C[l.color]?.text ?? 'text-muted'}`}>{l.msg}</div>
              ))}
            </div>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`const user  = await fetch('/api/data/user')
const posts = await fetch('/api/data/posts')
const stats = await fetch('/api/data/stats')
// 600 + 800 + 500 = 1900ms`}</pre>
          </div>
        </Panel>

        {/* Parallel */}
        <Panel title="✅ Promise.all" icon="⚡">
          <div className="p-5 space-y-4">
            <Btn onClick={runParallel} disabled={busy} variant="success">
              {parRunning ? '⏳ Fetching…' : '▶ Run Parallel'}
            </Btn>
            {parTotal != null && (
              <div className="bg-green/10 border border-green/30 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-[14px] text-green font-bold">Total</span>
                <span className="font-mono text-3xl font-extrabold text-green">{parTotal}ms</span>
              </div>
            )}
            <GanttChart timings={parTimings} maxTime={maxTime} />
            <div className="space-y-1.5 min-h-10">
              {parLogs.map((l, i) => (
                <div key={i} className={`text-[13px] slide-in ${C[l.color]?.text ?? 'text-muted'}`}>{l.msg}</div>
              ))}
            </div>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`const [user, posts, stats] = await Promise.all([
  fetch('/api/data/user'),
  fetch('/api/data/posts'),
  fetch('/api/data/stats'),
])
// max(600, 800, 500) = 800ms`}</pre>
          </div>
        </Panel>
      </div>

      {/* Live comparison */}
      {wfTotal != null && parTotal != null && (
        <div className="bg-surface2 border border-border rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-6 text-center mb-4">
            <div>
              <div className="text-[13px] text-muted mb-1">Waterfall</div>
              <div className="font-mono text-3xl font-extrabold text-red">{wfTotal}ms</div>
            </div>
            <div>
              <div className="text-[13px] text-muted mb-1">Speedup</div>
              <div className="font-mono text-3xl font-extrabold text-accent">{(wfTotal / parTotal).toFixed(1)}×</div>
            </div>
            <div>
              <div className="text-[13px] text-muted mb-1">Parallel</div>
              <div className="font-mono text-3xl font-extrabold text-green">{parTotal}ms</div>
            </div>
          </div>
          <div className="h-2.5 bg-surface3 rounded-full overflow-hidden">
            <div className="h-full bg-green/60 rounded-full bar-grow" style={{ width: `${(parTotal / wfTotal) * 100}%` }} />
          </div>
          <p className="text-center text-[13px] text-muted mt-3">
            Parallel saved <span className="text-green font-bold">{wfTotal - parTotal}ms</span> — {Math.round((1 - parTotal / wfTotal) * 100)}% faster
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Callout type="warn">
          Use sequential <Code>await</Code> only when each request <strong>depends on the previous result</strong> — e.g. fetch a user ID, then fetch their orders.
        </Callout>
        <Callout type="tip">
          Use <Code>Promise.all</Code> when requests are <strong>independent</strong>. Same code complexity — but often 2–3× faster for users.
        </Callout>
      </div>
    </div>
  )
}
