import { CalendarCheck, Moon, Sun, ChevronLeft, ChevronRight, LayoutDashboard, Network, SquareKanban, Users, FolderKanban } from 'lucide-react'
import { addWeeks, currentWeekISO, formatWeekRange, isoWeekNumber } from '../../lib/date'
import { useStore } from '../../store/useStore'
import { SyncCard, SyncPill } from './SyncStatus'

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard', subtitle: 'Capacidad, avance y bloqueos del equipo de Integraciones', icon: LayoutDashboard },
  { id: 'kanban', label: 'Tablero', title: 'Integraciones', subtitle: 'Ciclo de vida SAP: del backlog a producción', icon: SquareKanban },
  { id: 'myweek', label: 'Mi Semana', title: 'Mi Semana', subtitle: 'Registra tu carga en menos de 2 minutos', icon: CalendarCheck },
  { id: 'projects', label: 'Proyectos', title: 'Proyectos', subtitle: 'Proyectos y clientes que agrupan las interfaces', icon: FolderKanban },
  { id: 'team', label: 'Equipo', title: 'Equipo', subtitle: 'Integrantes, roles y capacidad semanal', icon: Users },
]

function AppIcon({ size = 'h-9 w-9' }) {
  return (
    <span
      className={`flex ${size} items-center justify-center rounded-[10px] bg-gradient-to-b from-blue-400 to-blue-700 text-snow shadow-[0_2px_6px_rgba(0,122,255,0.35)]`}
    >
      <Network className="h-[55%] w-[55%]" strokeWidth={2.25} />
    </span>
  )
}

/** Barra lateral estilo macOS: material translúcido, selección en gris suave, íconos en azul. */
export function Sidebar({ view, onNavigate }) {
  const { actions } = useStore()
  const reset = () => {
    if (window.confirm('¿Restaurar los datos de demostración? Se perderán los cambios locales.')) actions.resetDemo()
  }
  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r px-3 pb-4 pt-6 lg:flex">
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
                active ? 'bg-white/80 font-semibold text-blue-700 shadow-sm shadow-slate-900/[0.04] ring-1 ring-edge' : 'font-medium text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className="h-[18px] w-[18px] text-blue-600" strokeWidth={active ? 2.25 : 1.9} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto" />

      <SyncCard onResetDemo={reset} />
    </aside>
  )
}

export function WeekPicker({ week, onChange }) {
  const current = currentWeekISO()
  const isCurrent = week === current
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-edge/80 bg-white/55 p-1 shadow-sm shadow-slate-900/[0.04] backdrop-blur-xl">
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
/** Botón Sol / Luna para alternar Light Glass ↔ Dark Glass. */
export function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-edge/80 bg-white/55 text-slate-700 shadow-sm shadow-slate-900/[0.04] backdrop-blur-xl transition hover:bg-white/90 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
    >
      <Sun className={`absolute h-[18px] w-[18px] transition-all duration-300 ${dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      <Moon className={`absolute h-[18px] w-[18px] transition-all duration-300 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
    </button>
  )
}

export function Topbar({ view, week, onWeekChange, theme, onToggleTheme }) {
  const meta = NAV_ITEMS.find((n) => n.id === view) ?? NAV_ITEMS[0]
  return (
    <header className="glass sticky top-0 z-20 border-b">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-end justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:px-10 lg:pt-6">
        <div className="min-w-0">
          <p className="mb-0.5 flex items-center gap-1.5 text-[13px] font-medium text-slate-600 lg:hidden">
            <AppIcon size="h-5 w-5" /> Workload Hub
          </p>
          <h1 className="text-[28px] font-bold leading-tight text-slate-900 sm:text-[34px]">{meta.title}</h1>
          <p className="hidden text-[15px] text-slate-600 sm:block">{meta.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncPill />
          <WeekPicker week={week} onChange={onWeekChange} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}

/** Tab bar inferior estilo iOS (solo móvil/tablet). */
export function TabBar({ view, onNavigate }) {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 flex border-t border-edge/70 pb-[env(safe-area-inset-bottom)] lg:hidden">
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
