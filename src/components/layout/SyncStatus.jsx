import { CloudOff, Database, Loader2, RefreshCw, RotateCcw, Wifi } from 'lucide-react'
import { useStore } from '../../store/useStore'

/** Estado de guardado: modo demo (navegador) o Supabase (compartido, en vivo). */
export function useSyncLabel() {
  const { sync } = useStore()
  if (sync.mode === 'local') return { tone: 'slate', text: 'Modo demo', icon: Database }
  if (sync.phase === 'error' || sync.phase === 'load-error') return { tone: 'red', text: 'Sin guardar', icon: CloudOff }
  if (sync.phase === 'saving' || sync.phase === 'loading') return { tone: 'blue', text: 'Guardando…', icon: Loader2, spin: true }
  return { tone: 'green', text: sync.live ? 'En vivo' : 'Guardado', icon: Wifi }
}

const DOT = { slate: 'bg-slate-400', red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-emerald-500' }

/** Indicador compacto (barra superior en móvil). */
export function SyncPill() {
  const label = useSyncLabel()
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-edge/80 bg-white/60 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-slate-700 lg:hidden">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[label.tone]} ${label.spin ? 'animate-pulse' : ''}`} />
      {label.text}
    </span>
  )
}

/** Tarjeta de la barra lateral. */
export function SyncCard({ onResetDemo }) {
  const { sync } = useStore()
  const label = useSyncLabel()
  const Icon = label.icon

  if (sync.mode === 'local') {
    return (
      <div className="space-y-2.5 rounded-xl border border-edge/80 bg-white/60 backdrop-blur p-3.5 text-xs text-slate-600">
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          <Database className="h-4 w-4 text-slate-500" /> Modo demo
        </p>
        <p className="leading-relaxed">Los cambios se guardan solo en este navegador.</p>
        <button onClick={onResetDemo} className="flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-800">
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar datos demo
        </button>
      </div>
    )
  }

  const failed = sync.phase === 'error' || sync.phase === 'load-error'
  return (
    <div
      className={`space-y-2 rounded-xl border p-3.5 text-xs ${
        failed ? 'border-rose-500/25 bg-rose-500/10 text-rose-800' : 'border-edge/80 bg-white/60 backdrop-blur text-slate-600'
      }`}
    >
      <p className="flex items-center gap-2 font-semibold text-slate-800">
        <span className={`h-2 w-2 rounded-full ${DOT[label.tone]} ${label.spin ? 'animate-pulse' : ''}`} />
        Supabase · {label.text}
        <Icon className={`ml-auto h-3.5 w-3.5 text-slate-500 ${label.spin ? 'animate-spin' : ''}`} />
      </p>
      {failed ? (
        <>
          <p className="leading-relaxed">No se pudo guardar. Se reintenta solo cada 5 s.</p>
          {sync.error && <p className="mono break-words text-[10px] text-red-700">{sync.error}</p>}
          <button onClick={sync.retry} className="flex items-center gap-1.5 font-medium text-red-700 hover:text-red-900">
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar ahora
          </button>
        </>
      ) : (
        <p className="leading-relaxed">
          Datos compartidos con todo el equipo.{sync.live ? ' Los cambios de los demás aparecen al instante.' : ''}
        </p>
      )}
    </div>
  )
}
