import { Component } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

/** Evita la pantalla en blanco si un componente falla: muestra un aviso y permite recargar. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[novaFlow] Error de interfaz:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <TriangleAlert className="h-8 w-8 text-amber-500" />
          <p className="font-semibold text-slate-900">Algo salió mal en esta pantalla</p>
          <p className="text-sm text-slate-600">Tus datos están a salvo. Recarga la página para continuar.</p>
          <p className="mono break-words text-[11px] text-slate-500">{String(this.state.error?.message ?? this.state.error)}</p>
          <button className="btn-primary mt-2" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" /> Recargar
          </button>
        </div>
      </div>
    )
  }
}
