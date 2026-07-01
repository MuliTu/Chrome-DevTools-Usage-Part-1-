import { useState, useRef, useEffect } from 'react'
import { ProductSection } from './components/ProductSection'
import { ReviewsSection } from './components/ReviewsSection'
import { Challenge }       from './components/Challenge'
import { useProgress }     from './hooks/useProgress'
import { SCENARIOS }       from './data/scenarios'

import S1_RerenderCascade     from './sections/S1_RerenderCascade'
import S2_StaleClosure        from './sections/S2_StaleClosure'
import S3_EffectTimeline      from './sections/S3_EffectTimeline'
import S4_RaceCondition       from './sections/S4_RaceCondition'
import S5_MemoryLeak          from './sections/S5_MemoryLeak'
import S6_WaterfallVsParallel from './sections/S6_WaterfallVsParallel'

const CHROME_SCENARIOS = SCENARIOS.filter(s => !s.isReact)
const REACT_SCENARIOS  = SCENARIOS.filter(s => s.isReact)

// ── Navigation structure ─────────────────────────────────

const NAV = [
  {
    group: '🛠 DevTools Playground',
    items: [
      { id: 'chrome', icon: '🌐', title: 'Chrome DevTools',  sub: 'Scenarios 1–6',  color: 'warning' },
      { id: 'react',  icon: '⚛️',  title: 'React DevTools',   sub: 'Scenarios 7–12', color: 'info'    },
    ],
  },
  {
    group: '🔬 Debug Lab',
    items: [
      { id: 's1', icon: '🔁', title: 'Re-render Cascade',    sub: 'React.memo',        color: 'purple' },
      { id: 's2', icon: '🧊', title: 'Stale Closure',        sub: 'useEffect deps',    color: 'blue'   },
      { id: 's3', icon: '⏱',  title: 'Effect Timeline',      sub: 'Commit phases',     color: 'green'  },
      { id: 's4', icon: '🏁', title: 'Race Condition',       sub: 'AbortController',   color: 'red'    },
      { id: 's5', icon: '💀', title: 'Memory Leak',          sub: 'Cleanup functions', color: 'orange' },
      { id: 's6', icon: '⚡', title: 'Waterfall vs Parallel',sub: 'Promise.all',       color: 'yellow' },
    ],
  },
]

const COLOR_ACTIVE = {
  warning: 'bg-warning/15 text-warning border-warning/40',
  info:    'bg-info/15    text-info    border-info/40',
  purple:  'bg-purple/15  text-purple  border-purple/40',
  blue:    'bg-blue/15    text-blue    border-blue/40',
  green:   'bg-green/15   text-green   border-green/40',
  red:     'bg-red/15     text-red     border-red/40',
  orange:  'bg-orange/15  text-orange  border-orange/40',
  yellow:  'bg-yellow/15  text-yellow  border-yellow/40',
}

// ── Playground content views ─────────────────────────────

function ConsoleBox({ lines }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [lines])
  return (
    <div className="bg-[#0a0a10] border border-border rounded-xl p-3 font-mono text-xs max-h-28 overflow-y-auto mb-8">
      {lines.map((l, i) => (
        <div key={i} className={l.type === 'err' ? 'text-danger' : l.type === 'warn' ? 'text-warning' : 'text-info'}>{l.msg}</div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-muted mb-3">{children}</p>
}

function ChromeView({ done, markDone }) {
  const [consoleLogs, setConsoleLogs] = useState([
    { msg: '→ Page loaded', type: 'log' },
    { msg: '→ Connecting to API server at :3001…', type: 'log' },
  ])
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-warning/15 text-warning border-warning/30">
            Part 1
          </span>
          <h1 className="text-xl font-bold text-textbase">Chrome DevTools</h1>
        </div>
        <p className="text-[14px] text-muted">Use Chrome DevTools to find and fix 6 real issues on this page.</p>
      </div>

      <ProductSection
        onLog={(msg, type = 'log') => setConsoleLogs(p => [...p, { msg, type }])}
        onDone={markDone}
      />

      <SectionLabel>Page Console Output</SectionLabel>
      <ConsoleBox lines={consoleLogs} />

      <SectionLabel>Challenges (1–6)</SectionLabel>
      {CHROME_SCENARIOS.map(s => (
        <Challenge key={s.num} {...s} done={done.includes(s.num)} onDone={markDone} />
      ))}
    </div>
  )
}

function ReactView({ done, markDone }) {
  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-info/15 text-info border-info/30">
            Part 2
          </span>
          <h1 className="text-xl font-bold text-textbase">React DevTools</h1>
        </div>
        <p className="text-[14px] text-muted">Use the React DevTools browser extension to inspect and debug the live component below.</p>
      </div>

      <SectionLabel>Live React Component — Product Reviews</SectionLabel>
      <div className="bg-surface border border-border rounded-xl p-7">
        <ReviewsSection />
      </div>

      <SectionLabel>Challenges (7–12)</SectionLabel>
      {REACT_SCENARIOS.map(s => (
        <Challenge key={s.num} {...s} done={done.includes(s.num)} onDone={markDone} />
      ))}
    </div>
  )
}

const DEBUG_COMPONENTS = { s1: S1_RerenderCascade, s2: S2_StaleClosure, s3: S3_EffectTimeline, s4: S4_RaceCondition, s5: S5_MemoryLeak, s6: S6_WaterfallVsParallel }

function DebugView({ id }) {
  const Component = DEBUG_COMPONENTS[id]
  return (
    <div className="p-8 max-w-5xl">
      <Component key={id} />
    </div>
  )
}

// ── Progress mini-bar (bottom of sidebar) ────────────────

function ProgressBar({ done }) {
  const pct = Math.round((done.length / 12) * 100)
  return (
    <div className="p-4 border-t border-border space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold tracking-[0.12em] uppercase text-muted">Playground Progress</span>
        <span className="text-accent font-bold">{done.length}/12</span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState('chrome')
  const { done, markDone, reset } = useProgress()

  const isPlayground = active === 'chrome' || active === 'react'

  return (
    <div className="flex flex-col min-h-screen bg-bg text-textbase">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-6 h-[54px] flex items-center gap-4 shrink-0">
        <div className="font-extrabold text-[1.1rem] tracking-tight">
          Tech<span className="text-accent">Gear</span>
          <span className="text-muted font-normal text-sm ml-2 font-sans">DevTools</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-[12px] text-muted hidden lg:block">
          {isPlayground
            ? 'Cmd+Opt+I to open DevTools · install React DevTools extension'
            : 'Interactive React debugging patterns — toggle buggy / fixed'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green pulse-dot" />
          <span className="text-[12px] text-muted">API · :3001</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <nav className="w-60 shrink-0 bg-surface border-r border-border flex flex-col overflow-y-auto">
          <div className="flex-1 px-3 pt-4 pb-2 space-y-5">
            {NAV.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted px-2 mb-1.5">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isActive = active === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
                          isActive
                            ? `${COLOR_ACTIVE[item.color]} border`
                            : 'border-transparent text-muted hover:text-textbase hover:bg-surface2'
                        }`}
                      >
                        <span className="text-lg shrink-0 w-6 text-center">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[13px] font-semibold truncate ${isActive ? '' : 'text-textbase'}`}>{item.title}</div>
                          <div className="text-[11px] text-muted truncate">{item.sub}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Progress (only for playground) */}
          {isPlayground && <ProgressBar done={done} />}

          {/* Reset + Legend */}
          <div className="p-3 border-t border-border space-y-3">
            {isPlayground && (
              <button
                onClick={reset}
                className="w-full border border-border text-muted hover:border-danger hover:text-danger rounded-xl py-2 text-[12px] transition-all"
              >
                ↺ Reset progress
              </button>
            )}
            <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted px-1 mt-1">Legend</div>
            <div className="space-y-1.5 text-[12px] text-muted px-1">
              <div className="flex items-center gap-2">🐛 Buggy version</div>
              <div className="flex items-center gap-2">✓ Fixed version</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent/70 pulse-dot inline-block shrink-0" />
                Live / ticking
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {active === 'chrome' && <ChromeView done={done} markDone={markDone} />}
          {active === 'react'  && <ReactView  done={done} markDone={markDone} />}
          {active.startsWith('s') && <DebugView id={active} />}
        </main>

      </div>
    </div>
  )
}
