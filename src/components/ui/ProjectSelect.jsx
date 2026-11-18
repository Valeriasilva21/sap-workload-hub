import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/useStore'

/** Selector de proyecto con creación en línea ("+ Nuevo proyecto…"). */
export default function ProjectSelect({ value, onChange }) {
  const { state, actions } = useStore()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const create = () => {
    if (!name.trim()) return
    const project = actions.addProject({ name: name.trim() })
    onChange(project.id)
    setName('')
    setCreating(false)
  }

  if (creating) {
    return (
      <div className="flex gap-2">
        <input
          className="input"
          autoFocus
          placeholder="Nombre del nuevo proyecto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              create()
            }
          }}
        />
        <button type="button" className="btn-primary" disabled={!name.trim()} onClick={create}>
          Crear
        </button>
        <button type="button" className="btn-ghost px-2" onClick={() => setCreating(false)} aria-label="Cancelar">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <select
      className="input"
      value={value}
      onChange={(e) => (e.target.value === '__new__' ? setCreating(true) : onChange(e.target.value))}
    >
      <option value="" disabled>
        Selecciona un proyecto…
      </option>
      {state.projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.code} · {p.name}
        </option>
      ))}
      <option value="__new__">+ Nuevo proyecto…</option>
    </select>
  )
}
