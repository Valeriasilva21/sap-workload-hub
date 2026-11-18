import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { STAGES } from '../../lib/constants'
import { indexById, weekHoursByIntegration, weekMembersByIntegration } from '../../lib/selectors'
import KanbanFilters, { EMPTY_FILTERS } from './KanbanFilters'
import IntegrationCard from './IntegrationCard'
import IntegrationFormModal from './IntegrationFormModal'
import { useAttachmentsMap } from '../../services/attachments'

export default function KanbanBoard({ week }) {
  const { state, actions } = useStore()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [modal, setModal] = useState(null) // { id } para editar · { stage } para crear
  const [dragOver, setDragOver] = useState(null)

  const attachmentsMap = useAttachmentsMap()
  const hoursMap = useMemo(() => weekHoursByIntegration(state, week), [state, week])
  const weekMembers = useMemo(() => weekMembersByIntegration(state, week), [state, week])
  const projects = useMemo(() => indexById(state.projects), [state.projects])
  const members = useMemo(() => indexById(state.members), [state.members])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return state.integrations.filter((i) => {
      if (filters.projectId && i.projectId !== filters.projectId) return false
      if (filters.memberId && i.ownerId !== filters.memberId && !weekMembers[i.id]?.has(filters.memberId)) return false
      if (filters.tech && i.technology !== filters.tech) return false
      if (filters.blockedOnly && !i.blocked) return false
      if (q) {
        const hay = `${i.name} ${i.systems} ${projects[i.projectId]?.name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [state.integrations, filters, weekMembers, projects])

  const editing = modal?.id ? state.integrations.find((i) => i.id === modal.id) : null

  const onDrop = (e, stageId) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) actions.moveStage(id, stageId)
    setDragOver(null)
  }

  return (
    <div className="space-y-4">
      <KanbanFilters
        filters={filters}
        onChange={setFilters}
        total={filtered.length}
        onCreate={() => setModal({ stage: 'backlog' })}
      />

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {STAGES.map((stage, idx) => {
          const items = filtered.filter((i) => i.stage === stage.id)
          const hours = items.reduce((s, i) => s + (hoursMap[i.id] || 0), 0)
          const isOver = dragOver === stage.id
          return (
            <section
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(stage.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null)
              }}
              onDrop={(e) => onDrop(e, stage.id)}
              className={`flex w-[82vw] shrink-0 snap-start flex-col rounded-2xl border backdrop-blur-md transition sm:w-72 2xl:w-auto 2xl:min-w-0 2xl:flex-1 ${
                isOver ? 'border-blue-400/70 bg-blue-500/10' : 'border-edge/60 bg-white/40'
              }`}
            >
              <header className="px-3 pb-2 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stage.dot}`} />
                    <h2 className="truncate text-sm font-semibold text-slate-800">
                      <span className="font-mono text-slate-600">{idx + 1}.</span> {stage.label}
                    </h2>
                  </div>
                  <span className="mono flex h-6 min-w-6 items-center justify-center rounded-full border border-edge/80 bg-white/80 px-2 text-xs font-semibold text-slate-700">{items.length}</span>
                </div>
                <div className="mt-1 flex items-center justify-between pl-[18px] text-[11px] text-slate-600">
                  <span className="truncate">{stage.hint}</span>
                  <span className="mono shrink-0 font-medium text-slate-700">{hours} h/sem</span>
                </div>
              </header>

              <div className="flex min-h-[120px] flex-1 flex-col gap-2.5 px-2.5 pb-2.5">
                {items.map((i) => (
                  <IntegrationCard
                    key={i.id}
                    integration={i}
                    project={projects[i.projectId]}
                    owner={members[i.ownerId]}
                    hours={hoursMap[i.id] || 0}
                    attachments={attachmentsMap[i.id]?.length ?? 0}
                    onOpen={() => setModal({ id: i.id })}
                    onMove={(stageId) => actions.moveStage(i.id, stageId)}
                  />
                ))}
                {items.length === 0 && (
                  <p className="rounded-2xl border-2 border-dashed border-slate-300/70 py-6 text-center text-xs text-slate-500">
                    Arrastra una tarjeta aquí
                  </p>
                )}
                <button
                  onClick={() => setModal({ stage: stage.id })}
                  className="mt-auto flex items-center justify-center gap-1 rounded-full py-2 text-[13px] font-medium text-blue-600 hover:bg-white/70"
                >
                  <Plus className="h-3.5 w-3.5" /> Añadir
                </button>
              </div>
            </section>
          )
        })}
      </div>

      <IntegrationFormModal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        integration={editing}
        defaultStage={modal?.stage}
        week={week}
      />
    </div>
  )
}
