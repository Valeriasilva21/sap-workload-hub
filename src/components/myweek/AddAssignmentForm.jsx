import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { STAGES, TECHNOLOGIES } from '../../lib/constants'
import { isDone } from '../../lib/selectors'
import { Field } from '../ui/Primitives'
import ProjectSelect from '../ui/ProjectSelect'

const HOUR_CHIPS = [4, 8, 16, 24, 40]
const PCT_CHIPS = [10, 25, 50, 75, 100]

export default function AddAssignmentForm({ member, week, onDone, onCancel }) {
  const { state, actions } = useStore()
  const [projectId, setProjectId] = useState('')
  const [integrationId, setIntegrationId] = useState('')
  const [newName, setNewName] = useState('')
  const [tech, setTech] = useState('CPI')
  const [systems, setSystems] = useState('')
  const [stage, setStage] = useState('design')
  const [mode, setMode] = useState('hours')
  const [amount, setAmount] = useState(8)

  const assigned = new Set(
    state.allocations.filter((a) => a.memberId === member.id && a.weekStart === week).map((a) => a.integrationId),
  )
  const options = state.integrations.filter((i) => i.projectId === projectId && !isDone(i))
  const isNew = integrationId === '__new__'
  const hours =
    mode === 'hours' ? Number(amount) || 0 : Math.round(((member.capacity * (Number(amount) || 0)) / 100) * 2) / 2
  const canSubmit = projectId && (isNew ? newName.trim() : integrationId) && hours > 0

  const pickProject = (id) => {
    setProjectId(id)
    const hasOptions = state.integrations.some((i) => i.projectId === id && !isDone(i))
    setIntegrationId(hasOptions ? '' : '__new__')
  }

  const pickIntegration = (id) => {
    setIntegrationId(id)
    const found = state.integrations.find((i) => i.id === id)
    if (found) setStage(found.stage)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    let integ
    if (isNew) {
      integ = actions.addIntegration({
        projectId,
        name: newName.trim(),
        technology: tech,
        systems: systems.trim(),
        stage,
        ownerId: member.id,
      })
    } else {
      integ = state.integrations.find((i) => i.id === integrationId)
      if (integ.stage !== stage) actions.moveStage(integ.id, stage)
    }
    actions.addAllocation({ memberId: member.id, integrationId: integ.id, weekStart: week, hours })
    onDone(`“${integ.name}” añadida · ${hours} h`)
  }

  return (
    <form onSubmit={submit} className="card p-5 ring-2 ring-blue-500/30 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-slate-900">Nueva asignación</h2>
        <button type="button" onClick={onCancel} className="btn-ghost p-1.5" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proyecto">
          <ProjectSelect value={projectId} onChange={pickProject} />
        </Field>
        <Field label="Tarea / Interfaz">
          <select
            className="input"
            value={integrationId}
            disabled={!projectId}
            onChange={(e) => pickIntegration(e.target.value)}
          >
            <option value="" disabled>
              {projectId ? 'Selecciona una interfaz…' : 'Primero elige un proyecto'}
            </option>
            {options.map((i) => (
              <option key={i.id} value={i.id} disabled={assigned.has(i.id)}>
                {i.name}
                {assigned.has(i.id) ? ' (ya en tu semana)' : ''}
              </option>
            ))}
            <option value="__new__">+ Nueva interfaz…</option>
          </select>
        </Field>

        {isNew && (
          <>
            <Field label="Nombre de la nueva interfaz" className="sm:col-span-2">
              <input
                className="input"
                autoFocus
                placeholder="Ej: iFlow Maestro Clientes DEBMAS → CRM"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Field>
            <Field label="Tecnología">
              <select className="input" value={tech} onChange={(e) => setTech(e.target.value)}>
                {TECHNOLOGIES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sistemas (opcional)">
              <input className="input" placeholder="Ej: S/4HANA → Salesforce" value={systems} onChange={(e) => setSystems(e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Etapa" className="sm:col-span-2">
          <select className="input" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">Dedicación esta semana</span>
            <div className="flex rounded-[9px] bg-ink/[0.05] p-0.5 text-xs font-medium">
              {[
                ['hours', 'Horas'],
                ['pct', '% capacidad'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setMode(k)
                    setAmount(k === 'hours' ? 8 : 25)
                  }}
                  className={`rounded-[7px] px-3 py-1 ${mode === k ? 'bg-surface font-semibold text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-slate-400' : 'text-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(mode === 'hours' ? HOUR_CHIPS : PCT_CHIPS).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  Number(amount) === v ? 'border-transparent bg-blue-600 text-white' : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {v}
                {mode === 'hours' ? ' h' : '%'}
              </button>
            ))}
            <input
              type="number"
              min="0"
              max={mode === 'hours' ? 80 : 200}
              className="input w-24"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Valor de dedicación"
            />
            <span className="text-xs text-slate-600">
              = <strong className="text-slate-800">{hours} h</strong> ·{' '}
              {member.capacity ? Math.round((hours / member.capacity) * 100) : 0}% de {member.capacity} h
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          Guardar asignación
        </button>
      </div>
    </form>
  )
}
