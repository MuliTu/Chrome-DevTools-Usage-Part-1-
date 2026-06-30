const CHROME = [
  { num: 1,  label: 'Override JSON response', sub: 'Fix the price' },
  { num: 2,  label: 'Override response headers', sub: 'Fix CORS' },
  { num: 3,  label: 'Block request URL', sub: 'Remove slow tracker' },
  { num: 4,  label: 'Network Timing / TTFB', sub: 'Find the slow request' },
  { num: 5,  label: 'Copy as cURL', sub: 'Replay failed request' },
  { num: 6,  label: 'Add a Logpoint', sub: 'Debug without console.log' },
]
const REACT = [
  { num: 7,  label: 'Force Suspense fallback', sub: 'Toggle loading state' },
  { num: 8,  label: 'Force Error Boundary', sub: 'Trigger error UI' },
  { num: 9,  label: 'Edit live state', sub: 'Unblock star filter' },
  { num: 10, label: 'Highlight re-renders', sub: 'Find missing memo' },
  { num: 11, label: 'Profiler — why rendered', sub: 'Find bad prop' },
  { num: 12, label: 'StrictMode double-invoke', sub: 'Explain double fetch' },
]

function Item({ item, done, onDone }) {
  return (
    <li
      onClick={() => onDone(item.num)}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
        done
          ? 'border-success/25 bg-success/5'
          : 'border-border bg-surface2 hover:border-accent'
      }`}
    >
      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[0.6rem] shrink-0 transition-all ${
        done ? 'bg-success/20 border-success text-success' : 'border-border text-transparent'
      }`}>
        ✓
      </div>
      <div className="flex-1 leading-tight">
        <div className={done ? 'text-textbase' : 'text-muted'}>{item.label}</div>
        <div className="text-[0.68rem] text-[#555]">{item.sub}</div>
      </div>
    </li>
  )
}

export function Sidebar({ done, onDone, onReset }) {
  const pct = Math.round((done.length / 12) * 100)

  return (
    <aside className="w-[280px] shrink-0 bg-surface border-l border-border p-5 overflow-y-auto sticky top-[60px] max-h-[calc(100vh-60px)]">
      <p className="text-[0.65rem] font-bold tracking-[2px] uppercase text-muted mb-3">Progress</p>

      {/* Progress bar */}
      <div className="h-1 bg-surface2 rounded-full mb-1 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[0.7rem] text-muted mb-4 text-right">{done.length}/12 complete</p>

      {/* Chrome */}
      <p className="text-[0.63rem] font-bold tracking-[1.5px] uppercase text-muted mb-2">🔧 Chrome DevTools</p>
      <ul className="flex flex-col gap-1.5 mb-4">
        {CHROME.map(item => <Item key={item.num} item={item} done={done.includes(item.num)} onDone={onDone} />)}
      </ul>

      {/* React */}
      <p className="text-[0.63rem] font-bold tracking-[1.5px] uppercase text-muted mb-2">⚛️ React DevTools</p>
      <ul className="flex flex-col gap-1.5 mb-5">
        {REACT.map(item => <Item key={item.num} item={item} done={done.includes(item.num)} onDone={onDone} />)}
      </ul>

      <div className="h-px bg-border mb-4" />

      {/* Tips */}
      <div className="bg-surface2 border border-border rounded-lg p-3 mb-4">
        <p className="text-xs font-bold text-accent mb-2">Quick Opens</p>
        <p className="text-[0.74rem] text-muted leading-relaxed">
          <strong className="text-textbase">Cmd+Opt+I</strong> — DevTools<br />
          <strong className="text-textbase">Cmd+Shift+P</strong> — Command palette<br />
          <strong className="text-textbase">Cmd+Shift+R</strong> — Hard reload<br />
          <strong className="text-textbase">F8</strong> — Resume breakpoint<br />
          <strong className="text-textbase">Components tab</strong> — React DevTools
        </p>
      </div>

      <button
        onClick={onReset}
        className="w-full border border-border text-muted hover:border-danger hover:text-danger rounded-lg py-2 text-xs transition-all"
      >
        ↺ Reset all progress
      </button>
    </aside>
  )
}
