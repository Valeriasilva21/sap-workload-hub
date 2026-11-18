import { ArrowRight, Ban, Users } from 'lucide-react'
import { COLOR_CLASSES } from '../../lib/constants'
import { Avatar, CapacityBar, SectionCard } from '../ui/Primitives'
import { LevelBadge, LoadPill, Semaphore, SemaphoreLegend } from '../ui/Badges'

function MemberLoadCard({ load, onOpen }) {
  const { member, hours, capacity, pct, status, breakdown, blocked, free } = load
  return (
    <article className="card-hover flex flex-col rounded-2xl border border-edge/80 bg-white/60 p-4 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-start gap-3">
        <Avatar member={member} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600"><span className="truncate">{member.role}</span><LevelBadge level={member.level} /></p>
          <div className="mt-1.5">
            <LoadPill status={status} />
          </div>
        </div>
        <Semaphore status={status} />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-sm text-slate-600">
          <span className="mono text-xl font-semibold text-slate-900">{hours}</span>
          <span className="mono text-slate-600">/{capacity} h</span>
        </p>
        <p className={`mono text-sm font-semibold ${status.text}`}>{pct}%</p>
      </div>
      <CapacityBar pct={pct} status={status} className="mt-2 h-2.5" />
      <p className="mt-1.5 text-[11px] text-slate-600">
        <span className="mono-sm font-medium text-slate-700">{Math.abs(free)} h</span>
        {free >= 0 ? ' disponibles esta semana' : ' sobre su capacidad'}
      </p>

      <div className="mt-4 border-t border-slate-200/80 pt-3">
        <p className="mb-2 text-xs font-semibold text-slate-700">Tiempo por proyecto</p>
        {breakdown.length === 0 ? (
          <p className="text-xs text-slate-500">Sin carga registrada para esta semana.</p>
        ) : (
          <>
            <div className="mb-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              {breakdown.map((b) => (
                <div
                  key={b.project?.id ?? 'none'}
                  className={COLOR_CLASSES[b.project?.color] ?? 'bg-slate-400'}
                  style={{ width: `${(b.hours / Math.max(hours, 1)) * 100}%` }}
                  title={`${b.project?.name}: ${b.hours} h`}
                />
              ))}
            </div>
            <ul className="space-y-1.5">
              {breakdown.map((b) => (
                <li key={b.project?.id ?? 'none'} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${COLOR_CLASSES[b.project?.color] ?? 'bg-slate-400'}`} />
                  <span className="min-w-0 flex-1 truncate text-slate-700" title={b.items.map((i) => i.name).join('\n')}>
                    {b.project?.name ?? 'Sin proyecto'}
                    <span className="text-slate-600"> · <span className="mono-sm">{b.items.length}</span> int.</span>
                  </span>
                  <span className="mono w-12 shrink-0 text-right text-[11px] font-medium text-slate-900">{b.hours} h</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3">
        {blocked > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <Ban className="h-3.5 w-3.5" /> {blocked} bloqueo{blocked > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-xs text-slate-500">Sin bloqueos</span>
        )}
        <button onClick={() => onOpen(member.id)} className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-800">
          Ver semana <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  )
}

export default function WorkloadMatrix({ loads, onOpenMember }) {
  return (
    <SectionCard
      icon={Users}
      title="Matriz de cargabilidad"
      subtitle="Horas asignadas vs. capacidad semanal por integrante"
      actions={<SemaphoreLegend />}
    >
      {loads.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-slate-600">Agrega integrantes en la sección Equipo para ver su cargabilidad.</p>
      )}
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
        {loads.map((l) => (
          <MemberLoadCard key={l.member.id} load={l} onOpen={onOpenMember} />
        ))}
      </div>
    </SectionCard>
  )
}
