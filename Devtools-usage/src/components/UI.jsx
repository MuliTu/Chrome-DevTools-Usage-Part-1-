export function Panel({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border bg-surface2 shrink-0">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted">{title}</span>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export function Badge({ children, color = 'accent' }) {
  const colors = {
    accent:  'bg-accent/15 text-accent   border-accent/30',
    green:   'bg-green/15  text-green    border-green/30',
    red:     'bg-red/15    text-red      border-red/30',
    yellow:  'bg-yellow/15 text-yellow   border-yellow/30',
    blue:    'bg-blue/15   text-blue     border-blue/30',
    purple:  'bg-purple/15 text-purple   border-purple/30',
    orange:  'bg-orange/15 text-orange   border-orange/30',
    muted:   'bg-surface3  text-muted    border-border',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${colors[color]}`}>
      {children}
    </span>
  )
}

export function Btn({ onClick, children, variant = 'primary', size = 'md', disabled = false, className = '' }) {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95'
  const sizes = {
    sm: 'px-3.5 py-1.5 text-[13px]',
    md: 'px-4    py-2   text-sm',
    lg: 'px-6    py-3   text-base',
  }
  const variants = {
    primary: 'bg-accent hover:bg-accent/85 text-white shadow-lg shadow-accent/20',
    ghost:   'bg-surface3 hover:bg-border text-text border border-border hover:border-border2',
    danger:  'bg-red/15   hover:bg-red/25  text-red  border border-red/30',
    success: 'bg-green/15 hover:bg-green/25 text-green border border-green/30',
  }
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Toggle({ left, right, value, onChange }) {
  return (
    <div className="inline-flex items-center bg-surface2 border border-border rounded-xl p-1 gap-1">
      <button
        onClick={() => onChange(false)}
        className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
          !value
            ? 'bg-red/20 text-red border border-red/40 shadow-sm'
            : 'text-muted hover:text-text'
        }`}
      >
        🐛 {left}
      </button>
      <button
        onClick={() => onChange(true)}
        className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
          value
            ? 'bg-green/20 text-green border border-green/40 shadow-sm'
            : 'text-muted hover:text-text'
        }`}
      >
        ✓ {right}
      </button>
    </div>
  )
}

export function Callout({ type = 'info', children }) {
  const styles = {
    info:    { wrap: 'bg-blue/8   border-blue/25',   text: 'text-blue/90',   icon: 'ℹ️'  },
    warn:    { wrap: 'bg-yellow/8 border-yellow/25', text: 'text-yellow/90', icon: '⚠️'  },
    danger:  { wrap: 'bg-red/8    border-red/25',    text: 'text-red/90',    icon: '🚨'  },
    success: { wrap: 'bg-green/8  border-green/25',  text: 'text-green/90',  icon: '✅'  },
    tip:     { wrap: 'bg-accent/8 border-accent/25', text: 'text-accent/90', icon: '💡'  },
  }
  const s = styles[type]
  return (
    <div className={`flex gap-3 border rounded-xl p-4 ${s.wrap}`}>
      <span className="shrink-0 text-base mt-0.5">{s.icon}</span>
      <span className={`text-[13px] leading-relaxed text-text/75`}>{children}</span>
    </div>
  )
}

export function Code({ children }) {
  return (
    <code className="font-mono bg-surface3 text-purple px-1.5 py-0.5 rounded-md text-[0.85em] border border-border">
      {children}
    </code>
  )
}

export function RenderBadge({ count }) {
  return (
    <span
      key={count}
      className="font-mono text-[11px] font-bold bg-accent/20 text-accent border border-accent/50 rounded-full px-2.5 py-0.5 count-pop"
    >
      ×{count}
    </span>
  )
}

export function TimelineEvent({ color, label, time, sub, isNew }) {
  const dotColors = {
    green:  'bg-green',
    blue:   'bg-blue',
    purple: 'bg-purple',
    orange: 'bg-orange',
    red:    'bg-red',
    yellow: 'bg-yellow',
    muted:  'bg-muted',
  }
  return (
    <div className={`flex items-start gap-3 py-2.5 px-4 ${isNew ? 'slide-in' : ''}`}>
      <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[color] ?? 'bg-muted'}`} />
        <div className="w-px flex-1 bg-border min-h-[14px]" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-text">{label}</span>
          {time != null && (
            <span className="font-mono text-[11px] text-muted shrink-0">+{time}ms</span>
          )}
        </div>
        {sub && <div className="text-[12px] text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
