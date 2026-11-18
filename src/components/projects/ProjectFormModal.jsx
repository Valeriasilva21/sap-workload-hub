import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { COLOR_CLASSES, PROJECT_COLOR_KEYS } from '../../lib/constants'
import { Field, Modal } from '../ui/Primitives'

const PROJECT_COLORS = [...PROJECT_COLOR_KEYS, 'emerald', 'sky', 'slate']

/** Sugiere un código corto a partir del nombre: "Tesorería S/4HANA Bancos" → "TSB". */
const suggestCode = (name) =>
  name
    .split(/[\s/–-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 6)
    .toUpperCase()

export default function ProjectFormModal({ open, onClose, project, onSaved }) {
  const { state, actions } = useStore()
  const isEdit = Boolean(project)
  const [form, setForm] = useState({ name: '', code: '', color: '' })
  const [codeTouched, setCodeTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    if (project) {
      setForm({ name: project.name, code: project.code ?? '', color: project.color })
      setCodeTouched(true)
    } else {
      const used = new Set(state.projects.map((p) => p.color))
      setForm({ name: '', code: '', color: PROJECT_COLORS.find((c) => !used.has(c)) ?? 'blue' })
      setCodeTouched(false)
    }
    // Se reinicia solo al abrir o al cambiar de proyecto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id])

  const name = form.name.trim().replace(/\s+/g, ' ')
  const code = form.code.trim().toUpperCase()
  const duplicate = state.projects.some((p) => p.id !== project?.id && p.name.toLowerCase() === name.toLowerCase())
  const valid = name.length > 0 && !duplicate

  const setName = (v) => setForm((f) => ({ ...f, name: v, code: codeTouched ? f.code : suggestCode(v) }))

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const data = { name, code: code || suggestCode(name), color: form.color }
    if (isEdit) {
      actions.updateProject(project.id, data)
      onSaved?.(`Proyecto “${name}” actualizado`)
    } else {
      actions.addProject(data)
      onSaved?.(`Proyecto “${name}” creado`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}
      subtitle="Agrupa las interfaces en el tablero, los filtros y el tiempo por proyecto"
      footer={
        <>
          <span />
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" form="project-form" className="btn-primary" disabled={!valid}>
              {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
          <span className={`h-3 w-3 shrink-0 rounded-sm ${COLOR_CLASSES[form.color] ?? 'bg-slate-400'}`} />
          <span className="font-mono text-sm font-semibold text-slate-700">{code || suggestCode(name) || 'CÓDIGO'}</span>
          <span className="text-slate-400">·</span>
          <span className="truncate font-semibold text-slate-900">{name || 'Nombre del proyecto'}</span>
        </div>

        <Field label="Nombre del proyecto">
          <input
            className="input"
            autoFocus
            required
            maxLength={80}
            placeholder="Ej: Migración PI/PO → Integration Suite"
            value={form.name}
            onChange={(e) => setName(e.target.value)}
          />
          {duplicate && <span className="mt-1 block text-xs text-red-600">Ya existe un proyecto con ese nombre.</span>}
        </Field>

        <Field label="Código corto" hint="Aparece en las tarjetas del tablero. Se sugiere automáticamente desde el nombre.">
          <input
            className="input mono uppercase"
            maxLength={12}
            placeholder="Ej: MIG-CPI"
            value={form.code}
            onChange={(e) => {
              setCodeTouched(true)
              setForm((f) => ({ ...f, code: e.target.value }))
            }}
          />
        </Field>

        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color del proyecto">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={form.color === c}
                aria-label={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${COLOR_CLASSES[c]} ring-offset-2 ring-offset-surface transition ${
                  form.color === c ? 'ring-2 ring-slate-900' : 'hover:scale-110'
                }`}
              >
                {form.color === c && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
