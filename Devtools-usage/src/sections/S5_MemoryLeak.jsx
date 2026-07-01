import { useState, useEffect, useRef } from 'react'
import { Panel, Badge, Btn, Toggle, Callout, Code } from '../components/UI'

const zombieRegistry = new Map() // id → { zombie: bool, ticks: number }
let registryListeners = []
const notifyRegistry = () => registryListeners.forEach(fn => fn(new Map(zombieRegistry)))
const subscribeRegistry = fn => {
  registryListeners.push(fn)
  return () => { registryListeners = registryListeners.filter(l => l !== fn) }
}

function BuggyWidget({ id, onLog }) {
  const [ticks, setTicks] = useState(0)
  useEffect(() => {
    onLog(`Widget #${id} mounted`, 'mount')
    zombieRegistry.set(id, { zombie: false, ticks: 0 })
    notifyRegistry()
    const timer = setInterval(() => {
      setTicks(t => {
        const next = t + 1
        zombieRegistry.set(id, { zombie: zombieRegistry.get(id)?.zombie ?? false, ticks: next })
        notifyRegistry()
        return next
      })
    }, 800)
    // BUG: no cleanup
    return () => {
      // not clearing timer — zombie!
    }
  }, [])
  return <WidgetUI id={id} ticks={ticks} />
}

function FixedWidget({ id, onLog }) {
  const [ticks, setTicks] = useState(0)
  useEffect(() => {
    onLog(`Widget #${id} mounted`, 'mount')
    zombieRegistry.set(id, { zombie: false, ticks: 0 })
    notifyRegistry()
    const timer = setInterval(() => {
      setTicks(t => {
        const next = t + 1
        zombieRegistry.set(id, { zombie: false, ticks: next })
        notifyRegistry()
        return next
      })
    }, 800)
    return () => {
      clearInterval(timer)
      onLog(`Widget #${id} cleanup — interval cleared ✓`, 'cleanup')
      zombieRegistry.delete(id)
      notifyRegistry()
    }
  }, [])
  return <WidgetUI id={id} ticks={ticks} />
}

function WidgetUI({ id, ticks }) {
  return (
    <div className="bg-surface3 border border-border rounded-2xl p-4 flex items-center justify-between">
      <div>
        <div className="text-[12px] text-muted mb-1">Widget #{id}</div>
        <div className="font-mono text-2xl font-extrabold text-text">ticks: {ticks}</div>
      </div>
      <div className="w-10 h-10 rounded-full bg-green/15 border border-green/40 flex items-center justify-center">
        <span className="text-green text-lg">✓</span>
      </div>
    </div>
  )
}

export default function S5_MemoryLeak() {
  const [fixed, setFixed]     = useState(false)
  const [widgets, setWidgets] = useState([])
  const [logs, setLogs]       = useState([])
  const [registry, setRegistry] = useState(new Map())
  const [zombies, setZombies] = useState(new Set())
  const widgetId = useRef(0)

  useEffect(() => subscribeRegistry(setRegistry), [])

  function addLog(msg, type) {
    setLogs(prev => [...prev.slice(-29), { msg, type }])
  }

  function spawn() {
    const id = ++widgetId.current
    setWidgets(prev => [...prev, id])
  }

  function remove(id) {
    setWidgets(prev => prev.filter(w => w !== id))
    addLog(`Widget #${id} unmounted from DOM`, 'unmount')
    if (!fixed) {
      // Mark as zombie — timer keeps running
      zombieRegistry.set(id, { zombie: true, ticks: zombieRegistry.get(id)?.ticks ?? 0 })
      notifyRegistry()
      setZombies(prev => new Set([...prev, id]))
      // Simulate continued zombie ticks
      let c = 0
      const z = setInterval(() => {
        if (c++ > 6) { clearInterval(z); return }
        addLog(`Widget #${id} setState on ⚠️ UNMOUNTED component — memory leak!`, 'zombie')
        const cur = zombieRegistry.get(id)
        if (cur) { zombieRegistry.set(id, { ...cur, ticks: cur.ticks + 1 }); notifyRegistry() }
      }, 800)
    }
  }

  const logColors = { mount: 'text-green', cleanup: 'text-yellow', unmount: 'text-muted', zombie: 'text-red' }

  return (
    <div className="space-y-7 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <Badge color="red">Memory Leak</Badge>
          <Badge color="muted">useEffect cleanup</Badge>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Memory Leak — Zombie Timers</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
          A component starts a <Code>setInterval</Code> on mount. Without a cleanup function,
          the interval <strong className="text-text">keeps running after unmount</strong> — calling <Code>setState</Code> on a dead component.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Toggle left="Buggy (no cleanup)" right="Fixed (cleanup)" value={fixed}
          onChange={v => { setFixed(v); setWidgets([]); setLogs([]); zombieRegistry.clear(); setZombies(new Set()); notifyRegistry() }} />
        <Btn onClick={spawn} variant="success">+ Spawn Widget</Btn>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <Panel title="Mounted Components" icon="⚛️">
            <div className="p-4 space-y-3 min-h-32">
              {widgets.length === 0
                ? <div className="text-center py-10 text-muted text-[13px]">No widgets — click Spawn Widget</div>
                : widgets.map(id => (
                    <div key={id} className="space-y-2">
                      {fixed ? <FixedWidget id={id} onLog={addLog} /> : <BuggyWidget id={id} onLog={addLog} />}
                      <Btn onClick={() => remove(id)} variant="danger" className="w-full justify-center text-[13px]">
                        ✕ Unmount Widget #{id}
                      </Btn>
                    </div>
                  ))
              }
            </div>
          </Panel>

          <Panel title="Active Timers" icon="💀">
            <div className="p-4 space-y-2.5 min-h-20">
              {registry.size === 0
                ? <div className="text-center py-6 text-muted text-[13px]">No active timers</div>
                : [...registry.entries()].map(([id, info]) => {
                    const isAlive = widgets.includes(id)
                    return (
                      <div key={id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] ${
                        isAlive ? 'bg-green/8 border-green/30' : 'bg-red/8 border-red/30'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 pulse-dot ${isAlive ? 'bg-green' : 'bg-red'}`} />
                        <span className={isAlive ? 'text-green' : 'text-red font-semibold'}>
                          Widget #{id} — ticks: {info.ticks}
                          {!isAlive && ' ⚠️ ZOMBIE'}
                        </span>
                      </div>
                    )
                  })
              }
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Component Log" icon="📋">
            <div className="p-4 overflow-y-auto max-h-64 space-y-1">
              {logs.length === 0
                ? <div className="text-center py-10 text-muted text-[13px]">Waiting for events…</div>
                : logs.map((l, i) => (
                    <div key={i} className={`text-[13px] py-1.5 border-b border-border/50 slide-in ${logColors[l.type]}`}>
                      {l.msg}
                    </div>
                  ))
              }
            </div>
          </Panel>

          <Panel title="The Fix" icon="💊">
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[13px] text-red font-bold mb-2">❌ Buggy — timer leaks forever</p>
                <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  const timer = setInterval(() => {
    setTicks(t => t + 1)
  }, 800)

  // ← no return!
  // timer keeps firing after unmount
}, [])`}</pre>
              </div>
              <div>
                <p className="text-[13px] text-green font-bold mb-2">✅ Fixed — return cleanup function</p>
                <pre className="bg-surface3 border border-border rounded-xl p-4 text-[13px] font-mono text-muted leading-relaxed">{`useEffect(() => {
  const timer = setInterval(() => {
    setTicks(t => t + 1)
  }, 800)

  return () => clearInterval(timer)
  // ↑ runs on unmount → no zombie
}, [])`}</pre>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Callout type="danger">
          Spawn a widget, then unmount it. In buggy mode the Active Timers panel shows the zombie timer still ticking — calling setState on a dead component.
        </Callout>
        <Callout type="success">
          In fixed mode, unmounting immediately clears the interval. The Active Timers panel empties. Clean slate.
        </Callout>
      </div>
    </div>
  )
}
