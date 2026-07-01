import { useState, useRef, memo } from 'react'
import { Panel, Badge, Btn, Toggle, Callout, RenderBadge, Code } from '../components/UI'

// ── Component nodes — each tracks its own render count and flashes

function ChildA({ value }) {
  const count = useRef(0); count.current++
  return <ComponentNode name="ChildA" count={count.current} color="blue" note="prop changes" extra={`value = ${value}`} />
}

function ChildB() {
  const count = useRef(0); count.current++
  return <ComponentNode name="ChildB" count={count.current} color="red" note="no props" />
}

const ChildBMemo = memo(function ChildBMemo() {
  const count = useRef(0); count.current++
  return <ComponentNode name="ChildB" count={count.current} color="green" note="React.memo ✓" />
})

function ChildC({ label }) {
  const count = useRef(0); count.current++
  return <ComponentNode name="ChildC" count={count.current} color="orange" note={`label="${label}"`} />
}

function ComponentNode({ name, count, color, note, extra }) {
  const colorMap = {
    blue:   { ring: 'border-blue/50',   bg: 'bg-blue/8',   text: 'text-blue',   badge: 'bg-blue/20   text-blue   border-blue/40'   },
    red:    { ring: 'border-red/50',    bg: 'bg-red/8',    text: 'text-red',    badge: 'bg-red/20    text-red    border-red/40'    },
    green:  { ring: 'border-green/50',  bg: 'bg-green/8',  text: 'text-green',  badge: 'bg-green/20  text-green  border-green/40'  },
    orange: { ring: 'border-orange/50', bg: 'bg-orange/8', text: 'text-orange', badge: 'bg-orange/20 text-orange border-orange/40' },
  }
  const c = colorMap[color]
  return (
    <div
      key={count}
      className={`relative border-2 rounded-2xl p-4 flash transition-all ${c.ring} ${c.bg}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className={`font-mono text-[13px] font-bold ${c.text}`}>&lt;{name}&gt;</span>
          <div className="text-[11px] text-muted mt-0.5">{note}</div>
        </div>
        <span className={`font-mono text-[12px] font-bold px-2 py-0.5 rounded-full border count-pop ${c.badge}`}>
          ×{count}
        </span>
      </div>
      {extra && (
        <div className="font-mono text-[11px] bg-surface3 rounded-lg px-2.5 py-1.5 text-text/70 mt-1">
          {extra}
        </div>
      )}
    </div>
  )
}

export default function S1_RerenderCascade() {
  const [fixed, setFixed] = useState(false)
  const [count, setCount] = useState(0)
  const parentRenders = useRef(0)
  parentRenders.current++

  return (
    <div className="space-y-7 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="red">Common Bug</Badge>
          <Badge color="muted">React</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Re-render Cascade</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          When a parent re-renders, <strong className="text-text">every child re-renders too</strong> — even if their props didn't change.
          Watch the flash animations and render counters increment.
        </p>
      </div>

      <Toggle left="Buggy" right="Fixed (React.memo)" value={fixed} onChange={setFixed} />

      <div className="grid grid-cols-2 gap-5">
        {/* Component tree */}
        <Panel title="Live Component Tree" icon="🌳">
          <div className="p-5 space-y-3">
            {/* Parent node */}
            <div className="border-2 border-purple/50 bg-purple/8 rounded-2xl p-4 flash" key={parentRenders.current}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-[13px] font-bold text-purple">&lt;Parent&gt;</span>
                  <div className="text-[11px] text-muted mt-0.5">holds count state</div>
                </div>
                <span className="font-mono text-[12px] font-bold px-2.5 py-0.5 rounded-full border bg-purple/20 text-purple border-purple/40 count-pop">
                  ×{parentRenders.current}
                </span>
              </div>
              <Btn onClick={() => setCount(c => c + 1)} size="sm" variant="primary">
                Update state → {count}
              </Btn>
            </div>

            {/* Tree connector */}
            <div className="flex justify-center items-center gap-0 relative h-6">
              <div className="absolute left-1/2 -translate-x-1/2 w-[66%] h-px bg-border" />
              {[0,1,2].map(i => (
                <div key={i} className="w-1/3 flex justify-center">
                  <div className="w-px h-6 bg-border" />
                </div>
              ))}
            </div>

            {/* Children */}
            <div className="grid grid-cols-3 gap-2.5">
              <ChildA value={count} />
              {fixed ? <ChildBMemo /> : <ChildB />}
              <ChildC label="static" />
            </div>
          </div>
        </Panel>

        {/* Explanation */}
        <Panel title="What's Happening" icon="🔍">
          <div className="p-5 space-y-4">
            {!fixed ? (
              <>
                <Callout type="danger">
                  Every click re-renders <strong>all 3 children</strong> — even ChildB (no props) and ChildC (stable prop). React re-renders the whole subtree by default.
                </Callout>
                <div className="space-y-2">
                  <StatusRow icon="↺" label="ChildA" verdict="Expected" detail="prop changed → must re-render" color="blue" />
                  <StatusRow icon="⚠" label="ChildB" verdict="Wasted" detail="no props, nothing changed" color="red" />
                  <StatusRow icon="⚠" label="ChildC" verdict="Wasted" detail={`label="static" never changes`} color="red" />
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  In a large tree this compounds fast — imagine ChildB rendering an expensive list of 500 items.
                </p>
              </>
            ) : (
              <>
                <Callout type="success">
                  <Code>React.memo</Code> wraps ChildB. React does a shallow prop comparison before re-rendering — and bails out when props are the same.
                </Callout>
                <div className="space-y-2">
                  <StatusRow icon="↺" label="ChildA"  verdict="Expected" detail="prop changed → re-renders"     color="blue"  />
                  <StatusRow icon="⏭" label="ChildB"  verdict="Skipped"  detail="React.memo bailed out ✓"      color="green" />
                  <StatusRow icon="⚠" label="ChildC"  verdict="Wasted"   detail="no memo → still re-renders"   color="red"   />
                </div>
                <Callout type="tip">
                  Notice ChildC still re-renders. <Code>React.memo</Code> only helps the components you wrap. Try memoizing ChildC's <Code>label</Code> prop with <Code>useMemo</Code>.
                </Callout>
              </>
            )}
          </div>
        </Panel>
      </div>

      {/* Code diff */}
      <Panel title="The Fix" icon="💊">
        <div className="p-5 grid grid-cols-2 gap-5">
          <div>
            <p className="text-[13px] text-red font-bold mb-3">❌ Buggy — re-renders every time</p>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`function ChildB() {
  return <div>...</div>
}

// Re-renders every time the
// parent updates, even if
// nothing relevant changed`}</pre>
          </div>
          <div>
            <p className="text-[13px] text-green font-bold mb-3">✅ Fixed — skips when props unchanged</p>
            <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`const ChildB = memo(function ChildB() {
  return <div>...</div>
})

// React compares props shallowly.
// If nothing changed → skips
// the re-render entirely.`}</pre>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function StatusRow({ icon, label, verdict, detail, color }) {
  const colors = {
    blue:  { bg: 'bg-blue/10  border-blue/30',  text: 'text-blue'  },
    red:   { bg: 'bg-red/10   border-red/30',   text: 'text-red'   },
    green: { bg: 'bg-green/10 border-green/30', text: 'text-green' },
  }
  const c = colors[color]
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${c.bg}`}>
      <span className={`font-mono text-sm font-bold ${c.text}`}>{icon}</span>
      <span className={`font-mono text-[13px] font-bold w-16 ${c.text}`}>{label}</span>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.text}`}>{verdict}</span>
      <span className="text-[12px] text-muted ml-1">{detail}</span>
    </div>
  )
}
