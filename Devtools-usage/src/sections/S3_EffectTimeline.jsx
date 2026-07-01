import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Panel, Badge, Btn, Callout, Code, TimelineEvent } from '../components/UI'

const PHASES = [
  { id: 'render',  color: 'purple', label: 'render()',        sub: 'Function body runs, returns JSX' },
  { id: 'commit',  color: 'blue',   label: 'DOM commit',      sub: 'React writes to the real DOM' },
  { id: 'layout',  color: 'orange', label: 'useLayoutEffect', sub: 'Fires sync, before browser paints' },
  { id: 'paint',   color: 'yellow', label: 'Browser paint',   sub: 'User sees the update on screen' },
  { id: 'effect',  color: 'green',  label: 'useEffect',       sub: 'Fires async, after paint' },
  { id: 'cleanup', color: 'red',    label: 'Cleanup fn',      sub: 'Runs before next effect / unmount' },
]

function TrackedComponent({ onEvent, deps, showLayout }) {
  const mountTime = useRef(Date.now())
  const elapsed = () => Date.now() - mountTime.current
  const renderCount = useRef(0)
  renderCount.current++
  onEvent({ id: 'render', t: elapsed(), count: renderCount.current })

  useLayoutEffect(() => {
    if (!showLayout) return
    onEvent({ id: 'layout', t: elapsed(), count: renderCount.current })
  }, deps)

  useEffect(() => {
    onEvent({ id: 'effect', t: elapsed(), count: renderCount.current })
    return () => onEvent({ id: 'cleanup', t: elapsed(), count: renderCount.current })
  }, deps)

  return (
    <div className="border-2 border-purple/50 bg-purple/8 rounded-2xl p-6 text-center">
      <div className="text-5xl mb-3">⚛️</div>
      <div className="text-[12px] text-muted font-mono mb-1">TrackedComponent</div>
      <div className="font-mono text-2xl font-extrabold text-accent">render #{renderCount.current}</div>
      {deps?.[0] !== undefined && (
        <div className="mt-3 text-[12px] text-muted">dep value: <span className="text-blue font-bold">{String(deps[0])}</span></div>
      )}
    </div>
  )
}

export default function S3_EffectTimeline() {
  const [mounted, setMounted]       = useState(false)
  const [dep, setDep]               = useState(0)
  const [showLayout, setShowLayout] = useState(false)
  const [events, setEvents]         = useState([])
  const startRef = useRef(null)

  function addEvent(e) {
    if (!startRef.current) startRef.current = Date.now()
    const wall = Date.now() - startRef.current
    setEvents(prev => [...prev, { ...e, wall }])
  }

  function mount()   { startRef.current = Date.now(); setEvents([]); setMounted(true) }
  function unmount() { setMounted(false) }
  function trigger() { if (mounted) setDep(d => d + 1) }

  const eventColors = { render:'purple', layout:'orange', effect:'green', cleanup:'red' }
  const eventLabels = { render:'render()', layout:'useLayoutEffect', effect:'useEffect', cleanup:'cleanup fn' }

  const visiblePhases = PHASES.filter(p => showLayout || p.id !== 'layout')

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="purple">React Internals</Badge>
          <Badge color="muted">Timing</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">useEffect Timeline</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          React's commit cycle has a precise order. Mount, update, and unmount a component — watch each phase fire in real-time with timestamps.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {!mounted
          ? <Btn onClick={mount}   variant="success">▶ Mount component</Btn>
          : <Btn onClick={unmount} variant="danger" >✕ Unmount</Btn>
        }
        <Btn onClick={trigger} variant="ghost" disabled={!mounted}>↺ Trigger re-render</Btn>
        <label className="flex items-center gap-2.5 text-[13px] text-muted cursor-pointer select-none">
          <input type="checkbox" checked={showLayout} onChange={e => setShowLayout(e.target.checked)} className="w-4 h-4 rounded accent-orange-400" />
          Show <Code>useLayoutEffect</Code>
        </label>
        <Btn onClick={() => setEvents([])} variant="ghost" size="sm">Clear</Btn>
      </div>

      {/* Phase cards */}
      <div className={`grid gap-3 ${visiblePhases.length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
        {visiblePhases.map(p => {
          const active = events.some(e => e.id === p.id)
          return <PhaseCard key={p.id} {...p} active={active} />
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="Component" icon="⚛️">
          <div className="p-6 flex items-center justify-center min-h-48">
            {mounted
              ? <TrackedComponent onEvent={addEvent} deps={[dep]} showLayout={showLayout} />
              : <div className="text-muted text-[14px] text-center">
                  Not mounted<br />
                  <span className="text-[12px] opacity-60">Press Mount to begin</span>
                </div>
            }
          </div>
        </Panel>

        <Panel title="Event Timeline" icon="⏱">
          <div className="overflow-y-auto max-h-72 divide-y divide-border">
            {events.length === 0
              ? <div className="text-center py-12 text-muted text-[13px]">Mount the component to see events</div>
              : events.map((e, i) => (
                  <TimelineEvent
                    key={i}
                    color={eventColors[e.id] ?? 'muted'}
                    label={`${eventLabels[e.id] ?? e.id}  (render #${e.count})`}
                    time={e.wall}
                    sub={PHASES.find(p => p.id === e.id)?.sub}
                    isNew={i === events.length - 1}
                  />
                ))
            }
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Callout type="tip">
          <Code>useEffect</Code> fires <strong>after the browser paints</strong>. The user sees the update first, then side effects run. Never blocks rendering.
        </Callout>
        <Callout type="warn">
          <Code>useLayoutEffect</Code> fires <strong>before paint</strong>, synchronously. Use only for DOM measurements — it delays what users see.
        </Callout>
        <Callout type="info">
          The <strong>cleanup function</strong> runs before the next effect and on unmount. Always cancel subscriptions, timers, and fetch requests here.
        </Callout>
      </div>
    </div>
  )
}

function PhaseCard({ color, label, sub, active }) {
  const map = {
    purple: { border: 'border-purple/40', bg: 'bg-purple/12', dot: 'bg-purple', text: 'text-purple', dim: 'bg-surface2 border-border' },
    blue:   { border: 'border-blue/40',   bg: 'bg-blue/12',   dot: 'bg-blue',   text: 'text-blue',   dim: 'bg-surface2 border-border' },
    orange: { border: 'border-orange/40', bg: 'bg-orange/12', dot: 'bg-orange', text: 'text-orange', dim: 'bg-surface2 border-border' },
    yellow: { border: 'border-yellow/40', bg: 'bg-yellow/12', dot: 'bg-yellow', text: 'text-yellow', dim: 'bg-surface2 border-border' },
    green:  { border: 'border-green/40',  bg: 'bg-green/12',  dot: 'bg-green',  text: 'text-green',  dim: 'bg-surface2 border-border' },
    red:    { border: 'border-red/40',    bg: 'bg-red/12',    dot: 'bg-red',    text: 'text-red',    dim: 'bg-surface2 border-border' },
  }
  const c = map[color] ?? map.green
  return (
    <div className={`border rounded-2xl p-3 transition-all ${active ? `${c.border} ${c.bg}` : c.dim}`}>
      <div className={`w-3 h-3 rounded-full mb-2.5 ${c.dot} ${active ? 'pulse-dot' : 'opacity-25'}`} />
      <div className={`font-mono text-[12px] font-bold leading-tight mb-1 ${active ? c.text : 'text-muted'}`}>{label}</div>
      <div className="text-[11px] text-muted leading-tight">{sub}</div>
    </div>
  )
}
