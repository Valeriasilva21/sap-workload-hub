import { useCallback, useMemo, useState } from 'react'
import { CalendarPlus, Copy, Plus, UserPlus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { addWeeks, isoWeekNumber } from '../../lib/date'
import { cloneCandidates, indexById, isDone, memberLoad } from '../../lib/selectors'
import { STAGE_IDS } from '../../lib/constants'
import PendingAssignments from './PendingAssignments'
import { Avatar, CapacityBar, Toast } from '../ui/Primitives'
import { LoadPill, Semaphore } from '../ui/Badges'
import AssignmentItem from './AssignmentItem'
import AddAssignmentForm from './AddAssignmentForm'

function MemberSwitcher({ members, value, onChange }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {members.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition ${
            m.id === value
              ? 'border-transparent bg-blue-600 text-snow shadow-[0_2px_8px_rgba(0,122,255,0.35)]'
              : 'border-edge/80 bg-white/70 text-slate-700 shadow-sm shadow-slate-900/[0.03] backdrop-blur hover:bg-white'
          }`}
        >
          <Avatar member={m} size="sm" />
          {m.name.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}

export default function MyWeek({ week, memberId, onMemberChange, onNavigate }) {
  const { state } = useStore()
  const activeMembers = state.members.filter((m) => m.active !== false)
  const member = activeMembers.find((m) => m.id === memberId) ?? activeMembers[0]

  if (!member) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-12 text-center">
        <UserPlus className="h-10 w-10 text-slate-300" />
        <p className="text-base font-semibold text-slate-800">Primero agrega a tu equipo</p>
        <p className="text-sm text-slate-600">Cada integrante elige su nombre aquí para registrar su semana.</p>
        <button className="btn-primary mt-2" onClick={() => onNavigate('team')}>
          Ir a Equipo
        </button>
      </div>
    )
  }
  return <MyWeekContent week={week} member={member} members={activeMembers} onMemberChange={onMemberChange} />
}

function MyWeekContent({ week, member, members, onMemberChange }) {
  const { state, actions } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState(null)
  const clearToast = useCallback(() => setToast(null), [])

  const load = useMemo(() => memberLoad(state, member, week), [state, member, week])
  const prevWeek = addWeeks(week, -1)
  const candidates = useMemo(() => cloneCandidates(state, member.id, prevWeek, week), [state, member.id, prevWeek, week])
  const ints = indexById(state.integrations)
  const projs = indexById(state.projects)
  const cloneHours = candidates.reduce((s, a) => s + Number(a.hours), 0)
  // Interfaces de las que es responsable y que aún no tienen horas suyas esta semana
  const pending = useMemo(() => {
    const logged = new Set(load.allocations.map((a) => a.integrationId))
    return state.integrations
      .filter((i) => i.ownerId === member.id && !logged.has(i.id) && !isDone(i))
      .sort((a, b) => STAGE_IDS.indexOf(b.stage) - STAGE_IDS.indexOf(a.stage) || a.name.localeCompare(b.name))
  }, [state.integrations, load.allocations, member.id])

  const clone = () => {
    const n = actions.cloneAllocations(candidates, week)
    setToast(`Se clonaron ${n} asignaciones (${cloneHours} h) de la semana ${isoWeekNumber(prevWeek)}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="mb-2 text-[13px] font-semibold text-slate-600">¿Quién eres?</p>
        <MemberSwitcher members={members} value={member.id} onChange={onMemberChange} />
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar member={member} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-slate-900">{member.name}</p>
            <p className="text-sm text-slate-600">{member.role}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="metric text-[34px] leading-none text-slate-900">
                {load.hours}
                <span className="mono ml-1 text-base font-medium text-slate-600">/{load.capacity} h</span>
              </p>
              <LoadPill status={load.status} />
            </div>
            <Semaphore status={load.status} />
          </div>
        </div>
        <CapacityBar pct={load.pct} status={load.status} className="mt-4 h-3" />
        <p className="mt-1.5 text-xs text-slate-600">
          <span className="mono-sm font-medium text-slate-800">{load.pct}%</span> de tu capacidad semanal ·{' '}
          <span className="mono-sm font-medium text-slate-800">{Math.abs(load.free)} h</span>
          {load.free >= 0 ? ' disponibles' : ' sobre capacidad — conversa con tu líder'}
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary flex-1 sm:flex-none" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Añadir asignación
          </button>
          <button
            className="btn-secondary flex-1 sm:flex-none"
            onClick={clone}
            disabled={candidates.length === 0}
            title={candidates.length === 0 ? 'No hay tareas pendientes de la semana pasada por clonar' : undefined}
          >
            <Copy className="h-4 w-4" /> Clonar semana pasada
            {candidates.length > 0 && (
              <span className="rounded-full bg-blue-100 px-1.5 text-xs font-semibold text-blue-800">{candidates.length}</span>
            )}
          </button>
        </div>
      </section>

      {showForm && (
        <AddAssignmentForm
          member={member}
          week={week}
          onCancel={() => setShowForm(false)}
          onDone={(msg) => {
            setShowForm(false)
            setToast(msg)
          }}
        />
      )}

      <PendingAssignments items={pending} projects={projs} member={member} week={week} onLogged={setToast} />

      {load.allocations.length === 0 ? (
        pending.length > 0 && candidates.length === 0 ? null : (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <CalendarPlus className="h-10 w-10 text-slate-300" />
          <p className="text-base font-semibold text-slate-800">Aún no registras horas para la semana {isoWeekNumber(week)}</p>
          <p className="max-w-md text-sm text-slate-600">
            Clona tu semana pasada para partir con tus tareas recurrentes, o añade una asignación nueva.
          </p>
          {candidates.length > 0 && (
            <button className="btn-primary mt-2" onClick={clone}>
              <Copy className="h-4 w-4" /> Clonar {candidates.length} tareas ({cloneHours} h)
            </button>
          )}
        </div>
        )
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Mis asignaciones <span className="font-normal text-slate-500">({load.allocations.length})</span>
          </h2>
          {load.allocations.map((a) =>
            ints[a.integrationId] ? (
              <AssignmentItem
                key={a.id}
                allocation={a}
                integration={ints[a.integrationId]}
                project={projs[ints[a.integrationId].projectId]}
                member={member}
              />
            ) : null,
          )}
        </div>
      )}

      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
