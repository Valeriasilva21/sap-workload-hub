import { useState } from 'react'
import { Minus, Plus, UserPlus, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../ui/Primitives'

const clamp = (h) => Math.max(0, Math.min(80, Math.round(Number(h) * 2) / 2 || 0))
// Evita que Enter dentro de estos campos envíe el formulario de la integración
const noSubmit = (e) => e.key === 'Enter' && e.preventDefault()

/** Horas por persona en esta interfaz durante la semana seleccionada. Se guardan al instante. */
export default function WeekDedication({ integration, week }) {
  const { state, actions } = useStore()
  const [newMember, setNewMember] = useState('')
  const [newHours, setNewHours] = useState('')

  const members = Object.fromEntries(state.members.map((m) => [m.id, m]))
  const allocs = state.allocations.filter((a) => a.integrationId === integration.id && a.weekStart === week)
  const assigned = new Set(allocs.map((a) => a.memberId))
  const available = state.members.filter((m) => m.active !== false && !assigned.has(m.id))
  const total = allocs.reduce((s, a) => s + (Number(a.hours) || 0), 0)

  const add = () => {
    const memberId = newMember || available[0]?.id
    const hours = clamp(newHours)
    if (!memberId || hours <= 0) return
    actions.addAllocation({ memberId, integrationId: integration.id, weekStart: week, hours })
    setNewMember('')
    setNewHours('')
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="label mb-0">Dedicación registrada esta semana</p>
        <span className="mono text-xs font-semibold text-slate-700">{total} h total</span>
      </div>

      {allocs.length === 0 ? (
        <p className="mb-2 text-xs text-slate-600">Nadie ha registrado horas esta semana. Agrégalas aquí o desde “Mi Semana”.</p>
      ) : (
        <ul className="mb-2.5 space-y-1.5">
          {allocs.map((a) => {
            const m = members[a.memberId]
            const hours = Number(a.hours) || 0
            const pct = m?.capacity ? Math.round((hours / m.capacity) * 100) : 0
            const set = (h) => actions.updateAllocation(a.id, { hours: clamp(h) })
            return (
              <li key={a.id} className="flex items-center gap-2.5 rounded-xl border border-edge/70 bg-white/70 py-1.5 pl-2 pr-1.5">
                <Avatar member={m} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{m?.name ?? 'Sin asignar'}</span>
                <span className="mono hidden text-[11px] text-slate-500 sm:inline">{pct}% ded.</span>
                <div className="flex items-center rounded-full border border-edge/80 bg-white/80">
                  <button type="button" className="px-1.5 py-1 text-slate-600 hover:text-slate-900" onClick={() => set(hours - 1)} aria-label={`Restar hora a ${m?.name}`}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="0.5"
                    value={hours}
                    onChange={(e) => set(e.target.value)}
                    onKeyDown={noSubmit}
                    className="mono w-11 bg-transparent py-1 text-center text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`Horas de ${m?.name} esta semana`}
                  />
                  <button type="button" className="px-1.5 py-1 text-slate-600 hover:text-slate-900" onClick={() => set(hours + 1)} aria-label={`Sumar hora a ${m?.name}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-xs text-slate-600">h</span>
                <button
                  type="button"
                  onClick={() => actions.deleteAllocation(a.id)}
                  className="rounded-md p-1 text-slate-400 hover:bg-rose-500/15 hover:text-red-600"
                  aria-label={`Quitar a ${m?.name} de esta semana`}
                  title="Quitar de esta semana"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input h-9 min-w-0 flex-1 py-1 text-sm"
            value={newMember || available[0].id}
            onChange={(e) => setNewMember(e.target.value)}
            aria-label="Persona a agregar"
          >
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max="80"
            step="0.5"
            placeholder="Horas"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            className="input mono h-9 w-24 py-1 text-sm"
            aria-label="Horas a agregar"
          />
          <button type="button" className="btn-secondary h-9 px-3 text-xs" onClick={add} disabled={!(Number(newHours) > 0)}>
            <UserPlus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-slate-500">Los cambios de horas se guardan al instante.</p>
    </div>
  )
}
