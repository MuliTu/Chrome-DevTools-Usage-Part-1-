import { useState } from 'react'

// Scenarios auto-completed by the app; manual button only for others
// S1: auto (price returns 49), S2: auto (tracker onerror)
// S3: auto (checkout response time > 1200ms = throttle active), S4: auto (order placed)
const AUTO_COMPLETE = new Set([1, 2, 3, 4])

export function Challenge({ num, title, tool, isReact, broken, desc, hint, codeSnippet, done, onDone }) {
  const [open, setOpen]       = useState(num === 1 || num === 7)
  const [showHint, setShowHint] = useState(false)
  const [copied, setCopied]   = useState(false)

  function copySnippet() {
    navigator.clipboard.writeText(codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border rounded-xl mb-3 overflow-hidden transition-colors ${
      done ? 'border-success/30 bg-success/[0.02]' : 'border-border bg-surface hover:border-[#3e3e54]'
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-colors ${
          done ? 'bg-success/20 border-success/50 text-success' : 'bg-surface2 border-border text-muted'
        }`}>
          {done ? '✓' : num}
        </div>

        <span className="font-semibold flex-1 text-sm text-textbase">{title}</span>

        <span className={`text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
          isReact
            ? 'bg-info/10 text-info border-info/30'
            : 'bg-surface2 text-muted border-border'
        }`}>
          {tool}
        </span>

        <span className={`text-muted text-xs transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
      </div>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5">
          <div className="inline-flex items-center gap-2 bg-danger/10 text-danger border border-danger/25 rounded-md px-3 py-1.5 text-xs font-medium mb-3">
            🔴 {broken}
          </div>

          <p
            className="text-muted text-sm leading-relaxed mb-3"
            dangerouslySetInnerHTML={{ __html: desc }}
          />

          {/* Code snippet with copy button */}
          {codeSnippet && (
            <div className="relative mb-4">
              <pre className="bg-[#0a0a10] border border-border rounded-xl p-4 text-[0.78rem] font-mono text-info leading-relaxed overflow-x-auto">
                {codeSnippet}
              </pre>
              <button
                onClick={copySnippet}
                className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[0.72rem] font-semibold border transition-all ${
                  copied
                    ? 'bg-success/20 border-success/50 text-success'
                    : 'bg-surface2 border-border text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          )}

          <button
            className="w-full text-left border border-dashed border-border text-muted hover:border-accent hover:text-accent rounded-md px-3 py-2 text-sm transition-all mb-1"
            onClick={() => setShowHint(s => !s)}
          >
            {showHint ? '🙈 Hide steps' : '💡 Show steps'}
          </button>

          {showHint && (
            <div className="bg-surface2 border border-border rounded-lg p-4 mt-2">
              <ol className="list-decimal list-inside space-y-1.5">
                {hint.map((step, i) => (
                  <li
                    key={i}
                    className="text-muted text-[0.82rem] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                ))}
              </ol>
            </div>
          )}

          {AUTO_COMPLETE.has(num) ? (
            done && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-success border border-success/30 bg-success/10 rounded-md px-3 py-1.5">
                ✓ Auto-completed!
              </div>
            )
          ) : (
            <button
              onClick={() => onDone(num)}
              className={`mt-4 border rounded-md px-3 py-1.5 text-xs transition-all ${
                done
                  ? 'border-success/30 text-success bg-success/10'
                  : 'border-border text-muted hover:border-success hover:text-success'
              }`}
            >
              {done ? '✓ Completed!' : '✓ Mark as complete'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
