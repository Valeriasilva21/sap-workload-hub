import { useMemo, useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { usePersistentState } from '../../lib/usePersistentState'
import { Avatar } from '../ui/Primitives'

const MAX = 1000

/** "hace 5 min", "ayer 14:20", "12 nov 09:15". */
function formatWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.round((Date.now() - d.getTime()) / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const time = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return `hoy ${time}`
  if (d.toDateString() === yesterday.toDateString()) return `ayer ${time}`
  return `${d.toLocaleDateString('es', { day: 'numeric', month: 'short' })} ${time}`
}

function readSelectedMember() {
  try {
    return JSON.parse(localStorage.getItem('hub:member')) ?? ''
  } catch {
    return ''
  }
}

/** Hilo de comentarios de una integración: se guarda al instante y se comparte con el equipo. */
export default function CommentsPanel({ integrationId }) {
  const { state, actions } = useStore()
  const [authorId, setAuthorId] = usePersistentState('hub:comment-author', readSelectedMember())
  const [text, setText] = useState('')

  const members = useMemo(() => Object.fromEntries(state.members.map((m) => [m.id, m])), [state.members])
  const active = state.members.filter((m) => m.active !== false)
  const author = members[authorId]?.active !== false && members[authorId] ? authorId : (active[0]?.id ?? '')
  const comments = useMemo(
    () =>
      state.comments
        .filter((c) => c.integrationId === integrationId)
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
    [state.comments, integrationId],
  )

  const body = text.trim()
  const post = () => {
    if (!body) return
    actions.addComment({ integrationId, memberId: author, body })
    setAuthorId(author)
    setText('')
  }

  return (
    <div>
      <p className="label flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" /> Comentarios
        {comments.length > 0 && <span className="mono text-slate-500">· {comments.length}</span>}
      </p>

      {comments.length > 0 && (
        <ul className="mb-3 max-h-64 space-y-2.5 overflow-y-auto pr-1">
          {comments.map((c) => {
            const m = members[c.memberId]
            return (
              <li key={c.id} className="group flex gap-2.5">
                <Avatar member={m} size="sm" />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-edge/80 bg-white/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-800">{m?.name ?? 'Sin autor'}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <time className="mono text-[11px] text-slate-500" dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString('es')}>
                        {formatWhen(c.createdAt)}
                      </time>
                      <button
                        type="button"
                        onClick={() => window.confirm('¿Eliminar este comentario?') && actions.deleteComment(c.id)}
                        className="rounded p-0.5 text-slate-400 opacity-0 transition hover:bg-rose-500/15 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                        aria-label="Eliminar comentario"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="rounded-2xl border border-edge/80 bg-white/70 p-2 focus-within:ring-2 focus-within:ring-blue-500/30">
        <textarea
          rows={2}
          maxLength={MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              post()
            }
          }}
          placeholder="Escribe un comentario: avances, acuerdos, cambios solicitados…"
          aria-label="Nuevo comentario"
          className="block w-full resize-none bg-transparent px-1.5 py-1 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
            Como
            <select
              value={author}
              onChange={(e) => setAuthorId(e.target.value)}
              className="min-w-0 rounded-full border border-edge/80 bg-white/80 px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Autor del comentario"
            >
              {active.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={post} disabled={!body}>
            <Send className="h-3.5 w-3.5" /> Comentar
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">⌘/Ctrl + Enter para enviar · visible para todo el equipo</p>
    </div>
  )
}
