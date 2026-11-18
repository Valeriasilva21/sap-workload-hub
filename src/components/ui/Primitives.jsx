import { useEffect } from 'react'
import { X } from 'lucide-react'
import { COLOR_CLASSES } from '../../lib/constants'

export function Avatar({ member, size = 'md' }) {
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  const initials = (member?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      title={member?.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-white/25 to-transparent font-semibold text-white ring-2 ring-surface ${
        COLOR_CLASSES[member?.color] ?? 'bg-slate-400'
      } ${sizes[size]}`}
    >
      {initials}
    </span>
  )
}

/** Barra de capacidad con escala hasta 125 % y marca en el 100 % para visualizar la sobrecarga. */
export function CapacityBar({ pct, status, className = 'h-2.5' }) {
  const MAX = 125
  const width = (Math.min(pct, MAX) / MAX) * 100
  return (
    <div className={`relative w-full rounded-full bg-ink/[0.06] ${className}`}>
      <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${status.bar}`} style={{ width: `${width}%` }} />
      <div
        className="absolute -inset-y-1 w-[2px] rounded-full bg-slate-900/40"
        style={{ left: `${(100 / MAX) * 100}%` }}
        title="100 % de capacidad"
      />
    </div>
  )
}

export function ProgressBar({ value, className = 'h-1.5', color = 'bg-blue-600' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-ink/[0.06] ${className}`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function Toggle({ checked, onChange, label, tone = 'blue' }) {
  const on = tone === 'red' ? 'bg-red-500' : 'bg-emerald-500'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[28px] w-[46px] shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 ${
        checked ? on : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-surface shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.04)] transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[22px] bg-surface shadow-apple-lg sm:max-w-2xl sm:rounded-[22px]">
        <span className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Cerrar">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/80 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, className = '', hint }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  )
}

export function SectionCard({ title, subtitle, icon: Icon, actions, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-2 pt-5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-blue-50 text-blue-600">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-800/95 px-5 py-3 text-sm font-medium text-slate-50 shadow-apple-lg backdrop-blur-xl lg:bottom-8">
      {message}
    </div>
  )
}
