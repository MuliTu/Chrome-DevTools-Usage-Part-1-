import { useState, useEffect, useRef } from 'react'
import { Panel, Badge, Btn, Toggle, Callout, Code } from '../components/UI'

function BuggyCounter({ onLog }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      onLog(`interval sees count = ${count} (stale!)`, 'stale')
      setCount(count + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return <CounterDisplay count={count} />
}

function FixedCounter({ onLog }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  useEffect(() => {
    const id = setInterval(() => {
      countRef.current += 1
      onLog(`interval sees count = ${countRef.current} (via ref — live)`, 'live')
      setCount(c => c + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return <CounterDisplay count={count} />
}

function CounterDisplay({ count }) {
  return (
    <div className="bg-surface3 border border-border rounded-2xl p-6 flex items-center justify-between">
      <span className="text-[15px] text-muted font-medium">Current count</span>
      <span className="font-mono text-5xl font-extrabold text-text">{count}</span>
    </div>
  )
}

export default function S2_StaleClosure() {
  const [fixed, setFixed]     = useState(false)
  const [running, setRunning] = useState(false)
  const [logs, setLogs]       = useState([])
  const [key, setKey]         = useState(0)

  function addLog(msg, type) {
    setLogs(prev => [...prev.slice(-24), { msg, type }])
  }
  function start() { setRunning(true); setLogs([]) }
  function stop()  { setRunning(false); setKey(k => k + 1) }

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="red">Common Bug</Badge>
          <Badge color="muted">JavaScript closures</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Stale Closure Trap</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          A <Code>useEffect</Code> with an empty dependency array captures variables from the{' '}
          <strong className="text-text">first render only</strong>. The interval callback is frozen in time — it never sees updated state.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Toggle left="Buggy" right="Fixed" value={fixed} onChange={v => { setFixed(v); stop() }} />
        {!running
          ? <Btn onClick={start} variant="success">▶ Start interval</Btn>
          : <Btn onClick={stop}  variant="danger" >⏹ Stop & reset</Btn>
        }
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <Panel title="Counter" icon="🔢">
            <div className="p-5">
              {running
                ? (fixed
                    ? <FixedCounter key={key} onLog={addLog} />
                    : <BuggyCounter key={key} onLog={addLog} />
                  )
                : <div className="text-center py-10 text-muted text-[14px]">Press ▶ Start interval to begin</div>
              }
            </div>
          </Panel>

          <Panel title="Closure Snapshot" icon="📸">
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-muted">What the <Code>setInterval</Code> callback "sees" as its value of <Code>count</Code>:</p>
              {!fixed ? (
                <div className="space-y-3">
                  <SnapshotRow label="count (captured at mount)" value="0" type="frozen" />
                  <SnapshotRow label="count (actual, in state)"  value={`${logs.length}`} type="actual" />
                  <Callout type="danger">
                    The callback was born when <Code>count = 0</Code>. It always computes <Code>0 + 1 = 1</Code>, so the counter bounces between 0 and 1 forever.
                  </Callout>
                </div>
              ) : (
                <div className="space-y-3">
                  <SnapshotRow label="countRef.current (live)" value={`${logs.length}`} type="live" />
                  <SnapshotRow label="setCount(c => c + 1)"    value="functional update" type="live" />
                  <Callout type="success">
                    <Code>setCount(c =&gt; c + 1)</Code> receives the real current value as an argument — no closure needed. The ref tracks the value for logging.
                  </Callout>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Interval Log" icon="📋">
            <div className="p-4 space-y-1 min-h-44 max-h-64 overflow-y-auto">
              {logs.length === 0
                ? <div className="text-center py-10 text-muted text-[13px]">Waiting for interval to fire…</div>
                : logs.map((l, i) => (
                    <div key={i} className={`flex items-center gap-3 text-[13px] py-1.5 border-b border-border/50 slide-in`}>
                      <span className="font-mono text-muted text-[11px] w-6 shrink-0">{i + 1}</span>
                      <span className={l.type === 'stale' ? 'text-red' : 'text-green'}>{l.msg}</span>
                      {l.type === 'stale' && (
                        <span className="ml-auto text-[10px] font-bold text-red bg-red/15 border border-red/30 px-1.5 py-0.5 rounded-full shrink-0">
                          STALE
                        </span>
                      )}
                    </div>
                  ))
              }
            </div>
          </Panel>

          <Panel title="The Fix" icon="💊">
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[13px] text-red font-bold mb-2">❌ Buggy — stale closure</p>
                <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1) // count = 0 forever
  }, 1000)
  return () => clearInterval(id)
}, []) // empty deps → frozen closure`}</pre>
              </div>
              <div>
                <p className="text-[13px] text-green font-bold mb-2">✅ Fixed — functional update</p>
                <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1) // c = current value
  }, 1000)
  return () => clearInterval(id)
}, []) // still empty — no closure needed`}</pre>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function SnapshotRow({ label, value, type }) {
  const styles = {
    frozen: 'text-red   bg-red/10   border-red/30',
    actual: 'text-yellow bg-yellow/10 border-yellow/30',
    live:   'text-green bg-green/10 border-green/30',
  }
  const icons = { frozen: '🧊', actual: '→', live: '✓' }
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 border font-mono text-[13px] ${styles[type]}`}>
      <span className="text-muted text-[12px]">{label}</span>
      <span className="font-bold">{icons[type]} {value}</span>
    </div>
  )
}
