import { CalendarCheck, ChevronLeft, ChevronRight, Database, LayoutDashboard, Monitor, Moon, Network, RotateCcw, SquareKanban, Sun, Users } from 'lucide-react'
import { addWeeks, currentWeekISO, formatWeekRange, isoWeekNumber } from '../../lib/date'
import { useStore } from '../../store/useStore'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard', subtitle: 'Capacidad, avance y bloqueos del equipo de Integraciones', icon: LayoutDashboard },
  { id: 'kanban', label: 'Tablero', title: 'Integraciones', subtitle: 'Ciclo de vida SAP: del backlog a producción', icon: SquareKanban },
  { id: 'myweek', label: 'Mi Semana', title: 'Mi Semana', subtitle: 'Registra tu carga en menos de 2 minutos', icon: CalendarCheck },
  { id: 'team', label: 'Equipo', title: 'Equipo', subtitle: 'Integrantes, roles y capacidad semanal', icon: Users },
]

function AppIcon({ size = 'h-9 w-9' }) {
  return (
    <span
      className={`flex ${size} items-center justify-center rounded-[10px] bg-gradient-to-b from-blue-400 to-blue-700 text-white shadow-[0_2px_6px_rgba(0,122,255,0.35)]`}
    >
      <Network className="h-[55%] w-[55%]" strokeWidth={2.25} />
    </span>
  )
}

const THEMES = [
  { id: 'auto', label: 'Auto', icon: Monitor },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
]

/** Control segmentado de apariencia (como en Ajustes del Sistema). */
export function ThemeSwitcher({ theme, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-[9px] bg-ink/[0.06] p-0.5" role="radiogroup" aria-label="Apariencia">
      {THEMES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={theme === id}
          onClick={() => onChange(id)}
          className={`flex items-center justify-center gap-1 rounded-[7px] py-1 text-[11px] font-medium transition ${
            theme === id
              ? 'bg-surface text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-slate-400'
              : 'text-slate-600 hover:text-slate-700'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

/** Botón compacto para móvil: rota Auto → Claro → Oscuro. */
function ThemeCycleButton({ theme, onChange }) {
  const idx = THEMES.findIndex((t) => t.id === theme)
  const current = THEMES[idx] ?? THEMES[0]
  const next = THEMES[(idx + 1) % THEMES.length]
  const Icon = current.icon
  return (
    <button
      onClick={() => onChange(next.id)}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] text-slate-600 lg:hidden"
      aria-label={`Apariencia: ${current.label}. Cambiar a ${next.label}`}
      title={`Apariencia: ${current.label}`}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  )
}

/** Barra lateral estilo macOS: material translúcido, selección en gris suave, íconos en azul. */
export function Sidebar({ view, onNavigate, theme, onThemeChange }) {
  const { actions } = useStore()
  const reset = () => {
    if (window.confirm('¿Restaurar los datos de demostración? Se perderán los cambios locales.')) actions.resetDemo()
  }
  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 px-3 pb-4 pt-6 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <AppIcon />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-slate-900">Workload Hub</p>
          <p className="text-xs text-slate-600">SAP Integraciones</p>
        </div>
      </div>

      <p className="mb-1 mt-8 px-3 text-[11px] font-semibold text-slate-500">Vistas</p>
      <nav className="space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition ${
                active ? 'bg-ink/[0.07] font-semibold text-slate-900' : 'font-medium text-slate-700 hover:bg-ink/[0.04]'
              }`}
            >
              <Icon className="h-[18px] w-[18px] text-blue-600" strokeWidth={active ? 2.25 : 1.9} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1.5 px-1 pb-3">
        <p className="px-2 text-[11px] font-semibold text-slate-500">Apariencia</p>
        <ThemeSwitcher theme={theme} onChange={onThemeChange} />
      </div>

      <div className="space-y-2.5 rounded-xl bg-ink/[0.035] p-3.5 text-xs text-slate-600">
        <p className="flex items-center gap-2 font-semibold text-slate-700">
          <Database className="h-4 w-4 text-slate-500" /> Modo demo
        </p>
        <p className="leading-relaxed">Los cambios se guardan en este navegador. Estructura lista para Supabase.</p>
        <button onClick={reset} className="flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-800">
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar datos demo
        </button>
      </div>
    </aside>
  )
}

export function WeekPicker({ week, onChange }) {
  const current = currentWeekISO()
  const isCurrent = week === current
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-ink/[0.05] p-1">
      <button
        onClick={() => onChange(addWeeks(week, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-surface hover:shadow-sm"
        aria-label="Semana anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-[150px] rounded-full bg-surface px-3 py-1 text-center leading-tight shadow-sm">
        <p className="text-xs font-semibold text-slate-900">
          Semana {isoWeekNumber(week)}
          {isCurrent && <span className="ml-1 font-medium text-blue-600">· actual</span>}
        </p>
        <p className="text-[11px] text-slate-600">{formatWeekRange(week)}</p>
      </div>
      <button
        onClick={() => onChange(addWeeks(week, 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 transition hover:bg-surface hover:shadow-sm"
        aria-label="Semana siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isCurrent && (
        <button onClick={() => onChange(current)} className="rounded-full px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-surface">
          Hoy
        </button>
      )}
    </div>
  )
}

/** Encabezado con "Large Title" y barra translúcida. */
export function Topbar({ view, week, onWeekChange, theme, onThemeChange }) {
  const meta = NAV_ITEMS.find((n) => n.id === view) ?? NAV_ITEMS[0]
  return (
    <header className="glass sticky top-0 z-20 border-b border-slate-200/80">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:px-10 lg:pt-6">
        <div className="min-w-0">
          <p className="mb-0.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-600 lg:hidden">
            <AppIcon size="h-5 w-5" /> Workload Hub
          </p>
          <h1 className="text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]">{meta.title}</h1>
          <p className="hidden text-[15px] text-slate-600 sm:block">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <WeekPicker week={week} onChange={onWeekChange} />
          <ThemeCycleButton theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}

/** Tab bar inferior estilo iOS (solo móvil/tablet). */
export function TabBar({ view, onNavigate }) {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium ${
              active ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.7} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
