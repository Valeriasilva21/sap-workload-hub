import { Ban, CircleCheck, TriangleAlert } from 'lucide-react'
import { COLOR_CLASSES, LOAD_STATUS_LIST, stageById, techById } from '../../lib/constants'

/** Tecnología (CPI, PI/PO, IDoc…): etiqueta técnica en monoespaciada. */
export function TechBadge({ tech }) {
  const t = techById(tech)
  return (
    <span title={t.name} className={`badge font-mono font-semibold tracking-tight ${t.className}`}>
      {t.label}
    </span>
  )
}

export function StageBadge({ stage }) {
  const s = stageById(stage)
  return (
    <span className={`badge gap-1.5 ring-slate-300/60 ${s.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.short}
    </span>
  )
}

export function LoadPill({ status }) {
  return (
    <span className={`badge gap-1.5 text-xs ${status.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  )
}

/** Semáforo de 3 luces: se enciende la que corresponde al estado de carga. */
export function Semaphore({ status }) {
  const lights = [
    { key: 'over', on: 'bg-red-500 shadow-[0_0_6px] shadow-red-400' },
    { key: 'optimal', on: 'bg-amber-400 shadow-[0_0_6px] shadow-amber-300' },
    { key: 'available', on: 'bg-emerald-500 shadow-[0_0_6px] shadow-emerald-400' },
  ]
  return (
    <span
      className="inline-flex flex-col gap-[3px] rounded-full bg-[#0F172A] px-1 py-1.5 ring-1 ring-ink/10"
      role="img"
      aria-label={`Semáforo: ${status.label}`}
    >
      {lights.map((l) => (
        <span key={l.key} className={`h-2 w-2 rounded-full ${status.key === l.key ? l.on : 'bg-[#334155]'}`} />
      ))}
    </span>
  )
}

export function SemaphoreLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {LOAD_STATUS_LIST.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          {s.label} <span className="mono-sm text-slate-600">{s.range}</span>
        </span>
      ))}
    </div>
  )
}

export function BlockedBadge({ days }) {
  return (
    <span className="badge bg-red-50 font-semibold text-red-700 ring-red-600/30">
      <Ban className="h-3 w-3" />
      Bloqueado
      {days != null && <span className="font-mono font-medium">· {days}d</span>}
    </span>
  )
}

/** Días detenido ("6 días"): rojo desde 5 días, ámbar antes. */
export function DaysBadge({ days, icon: Icon }) {
  const tone = days >= 5 ? 'bg-red-50 text-red-700 ring-red-600/30' : 'bg-amber-50 text-amber-800 ring-amber-600/30'
  return (
    <span className={`badge font-mono font-semibold ${tone}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {days === 0 ? 'hoy' : `${days} día${days === 1 ? '' : 's'}`}
    </span>
  )
}

export function RiskBadge() {
  return (
    <span className="badge bg-amber-50 font-semibold text-amber-800 ring-amber-600/30">
      <TriangleAlert className="h-3 w-3" />
      En riesgo
    </span>
  )
}

export function DoneBadge() {
  return (
    <span className="badge bg-emerald-50 font-semibold text-emerald-700 ring-emerald-600/30">
      <CircleCheck className="h-3 w-3" />
      Completada
    </span>
  )
}

/** Proyecto: código técnico (MIG-CPI, P2P-ARB…) en mono + nombre. `wrap` permite saltos de línea en vez de truncar. */
export function ProjectTag({ project, className = '', wrap = false }) {
  if (!project) return null
  return (
    <span className={`inline-flex min-w-0 gap-1.5 text-[11px] font-medium text-slate-600 ${wrap ? 'items-baseline' : 'items-center'} ${className}`}>
      <span className={`h-2 w-2 shrink-0 rounded-sm ${COLOR_CLASSES[project.color] ?? 'bg-slate-400'}`} />
      <span className={wrap ? 'leading-snug' : 'truncate'} title={project.name}>
        <span className="font-mono font-semibold text-slate-700">{project.code}</span>
        <span className="text-slate-500"> · </span>
        {project.name}
      </span>
    </span>
  )
}
