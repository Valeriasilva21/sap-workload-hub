import { useCallback, useMemo, useState } from 'react'
import { Eraser, Pencil, RotateCcw, Trash2, UserPlus, Users } from 'lucide-react'
import { LevelBadge } from '../ui/Badges'
import { useStore } from '../../store/useStore'
import { memberLoad } from '../../lib/selectors'
import { Avatar, CapacityBar, SectionCard, Toast, Toggle } from '../ui/Primitives'
import MemberFormModal from './MemberFormModal'

function MemberRow({ member, week, onEdit, onToast }) {
  const { state, actions } = useStore()
  const active = member.active !== false
  const load = memberLoad(state, member, week)
  const owned = state.integrations.filter((i) => i.ownerId === member.id).length
  const loggedWeeks = new Set(state.allocations.filter((a) => a.memberId === member.id).map((a) => a.weekStart)).size

  const remove = () => {
    const detail =
      owned || loggedWeeks
        ? `\n\nSe borrarán sus horas registradas (${loggedWeeks} semana(s)) y sus ${owned} interfaz(es) quedarán “Sin asignar”.\nSi solo dejó el equipo, mejor desactívalo para conservar el historial.`
        : ''
    if (window.confirm(`¿Eliminar a ${member.name}?${detail}`)) {
      actions.deleteMember(member.id)
      onToast(`${member.name} fue eliminado`)
    }
  }

  return (
    <li className={`flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center ${active ? '' : 'bg-slate-500/[0.04]'}`}>
      <div className={`flex min-w-0 flex-1 items-center gap-3 ${active ? '' : 'opacity-60'}`}>
        <Avatar member={member} size="lg" />
        <div className="min-w-0 cursor-pointer" onClick={() => onEdit(member)} title="Editar integrante">
          <p className="flex items-center gap-2 truncate font-semibold text-slate-900">
            {member.name}
            {!active && <span className="badge bg-slate-100 text-slate-600 ring-slate-300">Inactivo</span>}
          </p>
          <p className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <span className="truncate">{member.role || 'Sin rol definido'}</span>
            <LevelBadge level={member.level} />
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-3 gap-4 text-xs sm:w-[340px] sm:shrink-0 ${active ? '' : 'opacity-60'}`}>
        <div>
          <p className="text-slate-500">Capacidad</p>
          <p className="mono mt-0.5 text-sm font-semibold text-slate-900">{member.capacity} h</p>
        </div>
        <div>
          <p className="text-slate-500">Esta semana</p>
          {active ? (
            <>
              <p className="mono mt-0.5 text-sm font-semibold text-slate-900">
                {load.hours}
                <span className="font-normal text-slate-500">/{member.capacity} h</span>
              </p>
              <CapacityBar pct={load.pct} status={load.status} className="mt-1 h-1.5" />
            </>
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">—</p>
          )}
        </div>
        <div>
          <p className="text-slate-500">Responsable de</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            <span className="mono">{owned}</span> <span className="font-normal text-slate-600">interfaces</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Toggle
            checked={active}
            onChange={(v) => {
              actions.updateMember(member.id, { active: v })
              onToast(v ? `${member.name} vuelve a estar activo` : `${member.name} quedó inactivo`)
            }}
            label={`${member.name} activo`}
          />
          <span className="w-12">{active ? 'Activo' : 'Inactivo'}</span>
        </label>
        <div className="flex">
          <button
            onClick={() => onEdit(member)}
            className="btn-secondary px-3 py-1.5 text-xs"
            aria-label={`Editar ${member.name}`}
            title="Editar nombre, rol, nivel, capacidad y color"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={remove}
            className="btn-ghost p-2 hover:bg-rose-500/15 hover:text-red-600"
            aria-label={`Eliminar ${member.name}`}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  )
}

export default function TeamView({ week }) {
  const { state, actions, sync } = useStore()
  const shared = sync.mode === 'remote'
  const scope = shared ? ' para TODO el equipo' : ''
  const [modal, setModal] = useState(null) // { member } para editar · {} para crear
  const [toast, setToast] = useState(null)
  const clearToast = useCallback(() => setToast(null), [])

  const members = useMemo(
    () => [...state.members].sort((a, b) => (a.active === false) - (b.active === false) || a.name.localeCompare(b.name)),
    [state.members],
  )
  const activeMembers = members.filter((m) => m.active !== false)
  const totalCapacity = activeMembers.reduce((s, m) => s + Number(m.capacity || 0), 0)

  const clearWork = () => {
    const msg =
      `Se borrarán ${state.projects.length} proyectos, ${state.integrations.length} interfaces y todas las horas registradas.\n` +
      `El equipo se conserva. Esta acción no se puede deshacer${scope}.\n\n¿Empezar desde cero?`
    if (window.confirm(msg)) {
      actions.clearWorkData()
      setToast('Listo: el equipo se mantiene y el tablero quedó vacío')
    }
  }

  const resetDemo = () => {
    if (window.confirm(`¿Restaurar los datos de demostración? Se reemplazan el equipo y todos los datos actuales${scope}.`)) {
      actions.resetDemo()
      setToast('Datos de demostración restaurados')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionCard
        icon={Users}
        title="Integrantes"
        subtitle={
          <>
            <span className="mono-sm">{activeMembers.length}</span> activos · capacidad total{' '}
            <span className="mono-sm">{totalCapacity} h</span>/semana
          </>
        }
        actions={
          <button className="btn-primary" onClick={() => setModal({})}>
            <UserPlus className="h-4 w-4" /> Agregar integrante
          </button>
        }
      >
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Users className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-800">Aún no hay integrantes</p>
            <p className="max-w-sm text-sm text-slate-600">Agrega a las personas del área de Integraciones para que puedan registrar su semana.</p>
            <button className="btn-primary mt-2" onClick={() => setModal({})}>
              <UserPlus className="h-4 w-4" /> Agregar el primero
            </button>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200/70 border-t border-slate-200/80">
            {members.map((m) => (
              <MemberRow key={m.id} member={m} week={week} onEdit={(member) => setModal({ member })} onToast={setToast} />
            ))}
          </ul>
        )}
      </SectionCard>

      <section className="card p-5">
        <h2 className="text-[17px] text-slate-900">Datos de la app</h2>
        <p className="mt-1 text-sm text-slate-600">
          {shared
            ? 'Los datos están en Supabase y los comparte todo el equipo: estas acciones afectan a todos.'
            : 'Los datos se guardan en este navegador. Úsalo para preparar el equipo antes de empezar a registrar trabajo real.'}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Eraser className="h-4 w-4 text-slate-500" /> Empezar desde cero
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Conserva el equipo y elimina los proyectos, interfaces y horas de ejemplo.
            </p>
            <button className="btn-secondary mt-3 text-red-600" onClick={clearWork} disabled={!state.projects.length && !state.integrations.length}>
              Vaciar proyectos y horas
            </button>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <RotateCcw className="h-4 w-4 text-slate-500" /> Restaurar demo
            </p>
            <p className="mt-1 text-xs text-slate-600">Vuelve al equipo y los proyectos SAP de ejemplo para mostrar la app.</p>
            <button className="btn-secondary mt-3" onClick={resetDemo}>
              Restaurar datos demo
            </button>
          </div>
        </div>
      </section>

      <MemberFormModal open={Boolean(modal)} onClose={() => setModal(null)} member={modal?.member} onSaved={setToast} />
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
