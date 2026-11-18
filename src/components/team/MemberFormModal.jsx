import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { COLOR_CLASSES, MEMBER_COLOR_KEYS, MEMBER_LEVELS } from '../../lib/constants'
import { LevelBadge } from '../ui/Badges'
import { Avatar, Field, Modal } from '../ui/Primitives'

const ROLE_SUGGESTIONS = [
  'Arquitecto/a de Integración',
  'Senior CPI Developer',
  'Consultor/a CPI / API Management',
  'Desarrollador/a PI/PO',
  'Desarrollador/a ABAP / IDoc',
  'Consultor/a Integration Suite',
  'Líder Técnico de Integraciones',
]
const CAPACITY_CHIPS = [20, 30, 40, 45]

export default function MemberFormModal({ open, onClose, member, onSaved }) {
  const { state, actions } = useStore()
  const isEdit = Boolean(member)
  const [form, setForm] = useState({ name: '', role: '', level: '', capacity: 40, color: '' })

  useEffect(() => {
    if (!open) return
    if (member) {
      setForm({ name: member.name, role: member.role ?? '', level: member.level ?? '', capacity: member.capacity, color: member.color })
    } else {
      const used = new Set(state.members.map((m) => m.color))
      setForm({ name: '', role: '', level: '', capacity: 40, color: MEMBER_COLOR_KEYS.find((c) => !used.has(c)) ?? 'blue' })
    }
    // Se reinicia solo al abrir o al cambiar de integrante
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member?.id])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const name = form.name.trim().replace(/\s+/g, ' ')
  const capacity = Number(form.capacity)
  const duplicate = state.members.some((m) => m.id !== member?.id && m.name.toLowerCase() === name.toLowerCase())
  const valid = name.length >= 2 && capacity > 0 && capacity <= 60 && !duplicate

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const data = { name, role: form.role.trim(), level: form.level, capacity, color: form.color }
    if (isEdit) {
      actions.updateMember(member.id, data)
      onSaved?.(`${name} actualizado`)
    } else {
      actions.addMember(data)
      onSaved?.(`${name} se unió al equipo`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar integrante' : 'Agregar integrante'}
      subtitle="Aparecerá en el dashboard, el tablero y “Mi Semana”"
      footer={
        <>
          <span />
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" form="member-form" className="btn-primary" disabled={!valid}>
              {isEdit ? 'Guardar cambios' : 'Agregar al equipo'}
            </button>
          </div>
        </>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-white/80 bg-white/60 p-4">
          <Avatar member={{ name: name || '?', color: form.color }} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{name || 'Nombre del integrante'}</p>
            <p className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
              <span className="truncate">{form.role || 'Rol'}</span>
              <LevelBadge level={form.level} />
            </p>
          </div>
          <span className="mono ml-auto shrink-0 whitespace-nowrap text-sm font-medium text-slate-700">{capacity || 0} h/sem</span>
        </div>

        <Field label="Nombre y apellido">
          <input
            className="input"
            autoFocus
            required
            maxLength={60}
            placeholder="Ej: Ana Pérez"
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
          />
          {duplicate && <span className="mt-1 block text-xs text-red-600">Ya hay alguien con ese nombre en el equipo.</span>}
        </Field>

        <div>
          <span className="label">Nivel</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nivel">
            {[{ id: '', label: 'Sin nivel' }, ...MEMBER_LEVELS].map((l) => (
              <button
                key={l.id || 'none'}
                type="button"
                role="radio"
                aria-checked={form.level === l.id}
                onClick={() => set('level')(l.id)}
                className={`rounded-full border px-3 py-1 text-sm font-medium ${
                  form.level === l.id ? 'border-transparent bg-gradient-to-b from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-600/25' : 'border-white/80 bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Rol" hint="Elige una sugerencia o escribe el tuyo">
          <input
            className="input"
            list="role-suggestions"
            maxLength={60}
            placeholder="Ej: Senior CPI Developer"
            value={form.role}
            onChange={(e) => set('role')(e.target.value)}
          />
          <datalist id="role-suggestions">
            {ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>

        <div>
          <span className="label">Capacidad semanal (horas dedicadas a Integraciones)</span>
          <div className="flex flex-wrap items-center gap-2">
            {CAPACITY_CHIPS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => set('capacity')(h)}
                className={`mono rounded-full border px-3 py-1 text-sm font-medium ${
                  capacity === h ? 'border-transparent bg-gradient-to-b from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-600/25' : 'border-white/80 bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {h} h
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="60"
              className="input mono w-24"
              value={form.capacity}
              onChange={(e) => set('capacity')(e.target.value)}
              aria-label="Horas semanales"
            />
          </div>
          <span className="mt-1 block text-[11px] text-slate-500">
            Si la persona comparte tiempo con soporte u otra área, indica solo las horas para Integraciones.
          </span>
        </div>

        <div>
          <span className="label">Color del avatar</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color del avatar">
            {MEMBER_COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={form.color === c}
                aria-label={c}
                onClick={() => set('color')(c)}
                className={`flex h-8 w-8 items-center justify-center rounded-full ${COLOR_CLASSES[c]} ring-offset-2 ring-offset-white transition ${
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
