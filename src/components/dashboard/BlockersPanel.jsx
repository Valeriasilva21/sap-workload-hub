import { CircleCheck, Clock, OctagonAlert } from 'lucide-react'
import { Avatar, SectionCard } from '../ui/Primitives'
import { DaysBadge } from '../ui/Badges'
import { ProjectTag, StageBadge, TechBadge } from '../ui/Badges'

export default function BlockersPanel({ items, onResolve, onOpenBoard }) {
  return (
    <SectionCard
      icon={OctagonAlert}
      title="Bloqueos activos"
      subtitle="Impedimentos reportados por el equipo"
      actions={
        items.length > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white">{items.length}</span>
        )
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
          <CircleCheck className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-slate-700">Sin bloqueos activos</p>
          <p className="text-xs text-slate-600">El equipo no reporta impedimentos.</p>
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {items.map(({ integration: i, project, owner, days }) => (
            <li key={i.id} className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug text-slate-900">{i.name}</p>
                <DaysBadge days={days} icon={Clock} />
              </div>
              <p className="mt-1.5 text-sm text-red-800">“{i.blockReason || 'Sin detalle del bloqueo'}”</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ProjectTag project={project} wrap />
                <TechBadge tech={i.technology} />
                <StageBadge stage={i.stage} />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-red-200/60 pt-2.5">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <Avatar member={owner} size="sm" /> {owner?.name ?? 'Sin responsable'}
                </span>
                <button
                  onClick={() => onResolve(i.id)}
                  className="shrink-0 rounded-full border border-slate-200/60 bg-slate-100/40 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-600/30 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  Marcar resuelto
                </button>
              </div>
            </li>
          ))}
          <li>
            <button onClick={onOpenBoard} className="w-full rounded-full py-2 text-[13px] font-medium text-blue-600 hover:bg-blue-50">
              Ver todo en el tablero →
            </button>
          </li>
        </ul>
      )}
    </SectionCard>
  )
}
