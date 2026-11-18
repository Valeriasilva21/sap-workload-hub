import { useCallback, useMemo, useState } from 'react'
import { FolderKanban, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { COLOR_CLASSES, STAGES } from '../../lib/constants'
import { isDone, weekHoursByIntegration } from '../../lib/selectors'
import { SectionCard, Toast } from '../ui/Primitives'
import ProjectFormModal from './ProjectFormModal'

function StageBar({ items }) {
  const total = items.length
  if (!total) return <div className="h-1.5 w-full rounded-full bg-slate-100" />
  return (
    <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full">
      {STAGES.map((s) => {
        const n = items.filter((i) => i.stage === s.id).length
        return n ? <div key={s.id} className={s.dot} style={{ width: `${(n / total) * 100}%` }} title={`${s.label}: ${n}`} /> : null
      })}
    </div>
  )
}

export default function ProjectsView({ week }) {
  const { state, actions, sync } = useStore()
  const [modal, setModal] = useState(null) // { project } para editar · {} para crear
  const [toast, setToast] = useState(null)
  const clearToast = useCallback(() => setToast(null), [])
  const hours = useMemo(() => weekHoursByIntegration(state, week), [state, week])

  const rows = useMemo(
    () =>
      [...state.projects]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => {
          const items = state.integrations.filter((i) => i.projectId === p.id)
          const open = items.filter((i) => !isDone(i))
          return {
            project: p,
            items: open,
            total: items.length,
            done: items.length - open.length,
            blocked: open.filter((i) => i.blocked).length,
            weekHours: items.reduce((s, i) => s + (hours[i.id] || 0), 0),
          }
        }),
    [state.projects, state.integrations, hours],
  )

  const remove = ({ project, total }) => {
    const loggedHours = state.allocations.filter((a) =>
      state.integrations.some((i) => i.id === a.integrationId && i.projectId === project.id),
    ).length
    const scope = sync.mode === 'remote' ? ' para todo el equipo' : ''
    const detail = total
      ? `\n\nSe eliminarán también sus ${total} interfaz(es) y ${loggedHours} registro(s) de horas${scope}. No se puede deshacer.`
      : ''
    if (window.confirm(`¿Eliminar el proyecto “${project.name}”?${detail}`)) {
      actions.deleteProject(project.id)
      setToast(`Proyecto “${project.name}” eliminado`)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionCard
        icon={FolderKanban}
        title="Proyectos"
        subtitle={
          <>
            <span className="mono-sm">{state.projects.length}</span> proyectos ·{' '}
            <span className="mono-sm">{state.integrations.filter((i) => !isDone(i)).length}</span> interfaces abiertas
          </>
        }
        actions={
          <button className="btn-primary" onClick={() => setModal({})}>
            <FolderPlus className="h-4 w-4" /> Nuevo proyecto
          </button>
        }
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <FolderKanban className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-800">Aún no hay proyectos</p>
            <p className="max-w-sm text-sm text-slate-600">
              Crea los proyectos o clientes del área (por ejemplo “Migración PI/PO” o “Tesorería – Bancos”) para agrupar sus interfaces.
            </p>
            <button className="btn-primary mt-2" onClick={() => setModal({})}>
              <FolderPlus className="h-4 w-4" /> Crear el primero
            </button>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200/70 border-t border-slate-200/80">
            {rows.map((row) => {
              const { project: p } = row
              return (
                <li key={p.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 cursor-pointer items-center gap-3" onClick={() => setModal({ project: p })} title="Editar proyecto">
                    <span className={`h-9 w-1.5 shrink-0 rounded-full ${COLOR_CLASSES[p.color] ?? 'bg-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="font-mono text-xs font-semibold text-slate-600">{p.code || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs sm:w-[360px] sm:shrink-0">
                    <div>
                      <p className="text-slate-500">Interfaces</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        <span className="mono">{row.items.length}</span> <span className="font-normal text-slate-600">abiertas</span>
                      </p>
                      <div className="mt-1">
                        <StageBar items={row.items} />
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Esta semana</p>
                      <p className="mono mt-0.5 text-sm font-semibold text-slate-900">{row.weekHours} h</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Estado</p>
                      <p className="mt-0.5 text-sm">
                        {row.blocked > 0 ? (
                          <span className="badge bg-red-50 font-semibold text-red-700 ring-red-600/30">
                            <span className="font-mono">{row.blocked}</span> bloq.
                          </span>
                        ) : (
                          <span className="text-slate-600">
                            <span className="mono">{row.done}</span> completadas
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal({ project: p })} className="btn-secondary px-3 py-1.5 text-xs" aria-label={`Editar ${p.name}`}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => remove(row)}
                      className="btn-ghost p-2 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${p.name}`}
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </SectionCard>

      <ProjectFormModal open={Boolean(modal)} onClose={() => setModal(null)} project={modal?.project} onSaved={setToast} />
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}
