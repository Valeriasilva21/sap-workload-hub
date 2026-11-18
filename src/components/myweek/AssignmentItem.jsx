import { Minus, OctagonAlert, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { STAGES, STAGE_IDS } from '../../lib/constants'
import { blockedDays } from '../../lib/selectors'
import { Toggle } from '../ui/Primitives'
import { ProjectTag, TechBadge } from '../ui/Badges'

function StageStepper({ value, onChange }) {
  const current = STAGE_IDS.indexOf(value)
  return (
    <div className="grid grid-cols-5 gap-0.5 rounded-[10px] bg-ink/[0.05] p-0.5" role="radiogroup" aria-label="Etapa">
      {STAGES.map((s, k) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={k === current}
          title={s.label}
          onClick={() => onChange(s.id)}
          className={`truncate rounded-[8px] px-1 py-1.5 text-[11px] font-medium transition sm:text-[13px] ${
            k === current
              ? 'bg-surface font-semibold text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-slate-400'
              : k < current
                ? 'text-blue-600 hover:bg-surface/60'
                : 'text-slate-600 hover:bg-surface/60'
          }`}
        >
          {s.short}
        </button>
      ))}
    </div>
  )
}

export default function AssignmentItem({ allocation, integration: i, project, member }) {
  const { actions } = useStore()
  const hours = Number(allocation.hours) || 0
  const pct = member.capacity ? Math.round((hours / member.capacity) * 100) : 0
  const days = blockedDays(i)
  const setHours = (h) => actions.updateAllocation(allocation.id, { hours: Math.max(0, Math.min(80, h)) })

  return (
    <article className={`card overflow-hidden ${i.blocked ? 'ring-2 ring-red-400/70' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ProjectTag project={project} />
            <TechBadge tech={i.technology} />
          </div>
          <h3 className="mt-1 font-semibold leading-snug text-slate-900">{i.name}</h3>
          {i.systems && <p className="text-xs text-slate-600">{i.systems}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-slate-100">
            <button className="px-2 py-1.5 text-slate-600 hover:text-slate-900" onClick={() => setHours(hours - 1)} aria-label="Restar hora">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min="0"
              max="80"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mono w-10 bg-transparent py-1.5 text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Horas esta semana"
            />
            <button className="px-2 py-1.5 text-slate-600 hover:text-slate-900" onClick={() => setHours(hours + 1)} aria-label="Sumar hora">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="w-14 text-xs leading-tight text-slate-600">
            h/sem
            <br />
            <span className="font-medium text-slate-800"><span className="mono">{pct}%</span> ded.</span>
          </span>
          <button
            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => actions.deleteAllocation(allocation.id)}
            aria-label="Quitar de mi semana"
            title="Quitar de mi semana"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <StageStepper value={i.stage} onChange={(stage) => actions.moveStage(i.id, stage)} />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">Avance</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={i.progress}
            onChange={(e) => actions.updateIntegration(i.id, { progress: Number(e.target.value) })}
            className="flex-1 accent-blue-600"
            aria-label="Avance de la interfaz"
          />
          <span className="mono w-10 text-right text-sm font-semibold text-slate-800">{i.progress}%</span>
        </div>
      </div>

      <div className={`border-t px-4 py-3 ${i.blocked ? 'border-red-100 bg-red-50' : 'border-slate-200/80 bg-slate-50'}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`flex items-center gap-2 text-sm font-medium ${i.blocked ? 'text-red-700' : 'text-slate-600'}`}>
            <OctagonAlert className="h-4 w-4" /> ¿Tienes algún bloqueo?
          </span>
          <Toggle checked={i.blocked} onChange={(v) => actions.updateIntegration(i.id, { blocked: v })} tone="red" label="Bloqueo" />
        </div>
        {i.blocked && (
          <div className="mt-2">
            <input
              className="input bg-surface"
              maxLength={140}
              placeholder="Ej: Falta conectividad VPN con proveedor"
              value={i.blockReason}
              onChange={(e) => actions.updateIntegration(i.id, { blockReason: e.target.value })}
            />
            <p className="mt-1 text-xs text-red-700">
              {days === 0 ? 'Bloqueado desde hoy' : `Detenido hace ${days} día${days === 1 ? '' : 's'}`} · visible en el dashboard del líder
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
