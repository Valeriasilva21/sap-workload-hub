import { useEffect, useState } from 'react'
import { MessageSquare, Paperclip, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { STAGES, TECHNOLOGIES } from '../../lib/constants'
import { blockedDays } from '../../lib/selectors'
import { Avatar, Field, Modal, Toggle } from '../ui/Primitives'
import ProjectSelect from '../ui/ProjectSelect'
import AttachmentsPanel from '../attachments/AttachmentsPanel'
import CommentsPanel from '../comments/CommentsPanel'
import { removeAttachmentsFor } from '../../services/attachments'

const EMPTY = {
  projectId: '',
  name: '',
  systems: '',
  technology: 'CPI',
  stage: 'backlog',
  ownerId: '',
  progress: 0,
  dueDate: '',
  blocked: false,
  blockReason: '',
  weekHours: '',
}

export default function IntegrationFormModal({ open, onClose, integration, defaultStage, week }) {
  const { state, actions } = useStore()
  const [form, setForm] = useState(EMPTY)
  const isEdit = Boolean(integration)

  useEffect(() => {
    if (!open) return
    setForm(
      integration
        ? { ...EMPTY, ...integration, dueDate: integration.dueDate ?? '', weekHours: '' }
        : { ...EMPTY, stage: defaultStage ?? 'backlog', projectId: state.projects[0]?.id ?? '', ownerId: state.members.find((m) => m.active !== false)?.id ?? '' },
    )
    // Se reinicia solo al abrir o al cambiar de tarjeta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, integration?.id, defaultStage])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.projectId && form.name.trim()
  const members = Object.fromEntries(state.members.map((m) => [m.id, m]))
  const weekAllocs = isEdit ? state.allocations.filter((a) => a.integrationId === integration.id && a.weekStart === week) : []

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const data = {
      projectId: form.projectId,
      name: form.name.trim(),
      systems: form.systems.trim(),
      technology: form.technology,
      stage: form.stage,
      ownerId: form.ownerId,
      progress: Number(form.progress),
      dueDate: form.dueDate || null,
      blocked: form.blocked,
      blockReason: form.blockReason.trim(),
    }
    if (isEdit) {
      actions.updateIntegration(integration.id, data)
    } else {
      const created = actions.addIntegration(data)
      const h = Number(form.weekHours)
      if (h > 0 && form.ownerId) actions.addAllocation({ memberId: form.ownerId, integrationId: created.id, weekStart: week, hours: h })
    }
    onClose()
  }

  const remove = () => {
    if (window.confirm(`¿Eliminar "${integration.name}"? También se borrarán sus horas registradas.`)) {
      actions.deleteIntegration(integration.id)
      removeAttachmentsFor(integration.id)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar integración' : 'Nueva integración'}
      subtitle={isEdit ? integration.name : 'Registra una nueva interfaz en el ciclo de vida'}
      footer={
        <>
          {isEdit ? (
            <button type="button" className="btn-danger" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" form="integration-form" className="btn-primary" disabled={!valid}>
              {isEdit ? 'Guardar cambios' : 'Crear integración'}
            </button>
          </div>
        </>
      }
    >
      <form id="integration-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Proyecto" className="sm:col-span-2">
          <ProjectSelect value={form.projectId} onChange={set('projectId')} />
        </Field>
        <Field label="Nombre de la interfaz" className="sm:col-span-2">
          <input
            className="input"
            required
            placeholder="Ej: IDoc DEBMAS → CRM"
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
          />
        </Field>
        <Field label="Sistemas (origen → destino)" className="sm:col-span-2">
          <input className="input" placeholder="Ej: S/4HANA → Salesforce" value={form.systems} onChange={(e) => set('systems')(e.target.value)} />
        </Field>
        <Field label="Tecnología">
          <select className="input" value={form.technology} onChange={(e) => set('technology')(e.target.value)}>
            {TECHNOLOGIES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Etapa">
          <select className="input" value={form.stage} onChange={(e) => set('stage')(e.target.value)}>
            {STAGES.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsable">
          <select className="input" value={form.ownerId} onChange={(e) => set('ownerId')(e.target.value)}>
            <option value="">Sin asignar</option>
            {state.members.filter((m) => m.active !== false || m.id === form.ownerId).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha comprometida (go-live)">
          <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate')(e.target.value)} />
        </Field>
        <Field label={`Avance: ${form.progress}%`} className="sm:col-span-2">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={form.progress}
            onChange={(e) => set('progress')(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </Field>

        {isEdit ? (
          <div className="rounded-2xl border border-edge/80 bg-white/50 p-3.5 sm:col-span-2">
            <p className="label">Dedicación registrada esta semana</p>
            {weekAllocs.length === 0 ? (
              <p className="text-xs text-slate-600">Nadie ha registrado horas esta semana. Se cargan desde “Mi Semana”.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {weekAllocs.map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5 rounded-full bg-surface py-0.5 pl-0.5 pr-2.5 text-xs shadow-sm ring-1 ring-slate-200">
                    <Avatar member={members[a.memberId]} size="sm" />
                    {members[a.memberId]?.name.split(' ')[0]} · <strong>{a.hours} h</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Field label="Horas esta semana para el responsable (opcional)" hint="Crea la asignación semanal automáticamente">
            <input
              type="number"
              min="0"
              max="80"
              className="input"
              placeholder="Ej: 8"
              value={form.weekHours}
              onChange={(e) => set('weekHours')(e.target.value)}
            />
          </Field>
        )}

        <div
          className={`rounded-2xl p-3.5 sm:col-span-2 ${form.blocked ? 'border border-rose-500/20 bg-rose-500/[0.07]' : 'border border-edge/80 bg-white/50'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">¿Tiene algún bloqueo?</p>
              <p className="text-xs text-slate-600">
                {form.blocked && integration?.blockedSince
                  ? `Detenida hace ${blockedDays(integration)} día(s)`
                  : 'Se mostrará en el panel de bloqueos del líder'}
              </p>
            </div>
            <Toggle checked={form.blocked} onChange={set('blocked')} tone="red" label="Bloqueo" />
          </div>
          {form.blocked && (
            <input
              className="input mt-3"
              autoFocus
              maxLength={140}
              placeholder="Ej: Falta conectividad VPN con proveedor"
              value={form.blockReason}
              onChange={(e) => set('blockReason')(e.target.value)}
            />
          )}
        </div>

        <div className="rounded-2xl border border-edge/80 bg-white/40 p-3.5 sm:col-span-2">
          {isEdit ? (
            <AttachmentsPanel integrationId={integration.id} />
          ) : (
            <p className="flex items-center gap-2 text-xs text-slate-600">
              <Paperclip className="h-4 w-4 text-slate-500" /> Podrás adjuntar PDFs (especificaciones, mapeos, evidencias de pruebas) después de crear la integración.
            </p>
          )}
        </div>
      </form>
      {/* Fuera del <form>: comentar se guarda al instante, sin “Guardar cambios” */}
      <div className="mt-4 rounded-2xl border border-edge/80 bg-white/40 p-3.5">
        {isEdit ? (
          <CommentsPanel integrationId={integration.id} />
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate-600">
            <MessageSquare className="h-4 w-4 text-slate-500" /> Podrás dejar comentarios para el equipo después de crear la integración.
          </p>
        )}
      </div>
    </Modal>
  )
}
