import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { ProjectTag, StageBadge, TechBadge } from '../ui/Badges'

const QUICK = [2, 4, 8]

function PendingRow({ integration: i, project, member, week, onLogged }) {
  const { actions } = useStore()
  const [hours, setHours] = useState('')

  const log = (h) => {
    const n = Math.max(0, Math.min(80, Math.round(Number(h) * 2) / 2 || 0))
    if (n <= 0) return
    actions.addAllocation({ memberId: member.id, integrationId: i.id, weekStart: week, hours: n })
    onLogged?.(`${n} h registradas en “${i.name}”`)
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex flex-wrap items-center gap-1.5">
          <ProjectTag project={project} />
          <TechBadge tech={i.technology} />
          <StageBadge stage={i.stage} />
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">{i.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {QUICK.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => log(h)}
            className="mono rounded-full border border-edge/80 bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-500/10 hover:text-blue-700"
            title={`Registrar ${h} h esta semana`}
          >
            {h} h
          </button>
        ))}
        <input
          type="number"
          min="0"
          max="80"
          step="0.5"
          placeholder="h"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && log(hours)}
          className="input mono h-8 w-16 py-1 text-center text-xs"
          aria-label={`Horas para ${i.name}`}
        />
        <button
          type="button"
          onClick={() => log(hours)}
          disabled={!(Number(hours) > 0)}
          className="btn-primary h-8 px-2.5 text-xs"
          aria-label={`Registrar horas en ${i.name}`}
          title="Registrar horas"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

/** Interfaces donde el integrante es responsable pero aún no tiene horas registradas en la semana. */
export default function PendingAssignments({ items, projects, member, week, onLogged }) {
  if (!items.length) return null
  return (
    <section className="card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-edge/70 px-4 py-3.5">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Asignadas a ti sin horas esta semana <span className="mono font-normal text-slate-500">({items.length})</span>
          </h2>
          <p className="text-xs text-slate-600">Eres responsable de estas interfaces. Registra cuántas horas les dedicarás y pasarán a “Mis asignaciones”.</p>
        </div>
      </header>
      <ul className="divide-y divide-slate-200/70">
        {items.map((i) => (
          <PendingRow key={i.id} integration={i} project={projects[i.projectId]} member={member} week={week} onLogged={onLogged} />
        ))}
      </ul>
    </section>
  )
}
