import { Plus, Search, X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { TECHNOLOGIES } from '../../lib/constants'
import { Toggle } from '../ui/Primitives'

export const EMPTY_FILTERS = { q: '', projectId: '', memberId: '', tech: '', blockedOnly: false }

export default function KanbanFilters({ filters, onChange, total, onCreate }) {
  const { state } = useStore()
  const set = (k) => (v) => onChange({ ...filters, [k]: v })
  const active = Object.entries(filters).filter(([, v]) => v).length

  return (
    <div className="card flex flex-col gap-3 p-3 2xl:flex-row 2xl:flex-wrap 2xl:items-center">
      <div className="relative 2xl:w-64 2xl:shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          className="input pl-9"
          placeholder="Buscar interfaz o sistema…"
          value={filters.q}
          onChange={(e) => set('q')(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:flex 2xl:flex-1">
        <select className="input 2xl:w-auto 2xl:max-w-[240px]" value={filters.projectId} onChange={(e) => set('projectId')(e.target.value)}>
          <option value="">Todos los proyectos</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="input 2xl:w-auto" value={filters.memberId} onChange={(e) => set('memberId')(e.target.value)}>
          <option value="">Todo el equipo</option>
          {state.members.filter((m) => m.active !== false).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select className="input 2xl:w-auto" value={filters.tech} onChange={(e) => set('tech')(e.target.value)}>
          <option value="">Toda tecnología</option>
          {TECHNOLOGIES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="col-span-2 flex items-center gap-2 whitespace-nowrap px-1 text-sm text-slate-600 sm:col-span-1">
          <Toggle checked={filters.blockedOnly} onChange={set('blockedOnly')} tone="red" label="Solo bloqueadas" />
          Solo bloqueadas
        </label>
      </div>
      <div className="flex items-center justify-between gap-2 2xl:ml-auto">
        <span className="text-xs text-slate-600">{total} tarjetas</span>
        {active > 0 && (
          <button className="btn-ghost px-2 py-1.5 text-xs" onClick={() => onChange(EMPTY_FILTERS)}>
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
        <button className="btn-primary" onClick={onCreate}>
          <Plus className="h-4 w-4" /> Nueva integración
        </button>
      </div>
    </div>
  )
}
