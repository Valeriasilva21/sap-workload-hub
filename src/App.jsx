import { useEffect, useState } from 'react'
import { pruneAttachments } from './services/attachments'
import { Sidebar, TabBar, Topbar } from './components/layout/Layout'
import Backdrop from './components/layout/Backdrop'
import Dashboard from './components/dashboard/Dashboard'
import KanbanBoard from './components/kanban/KanbanBoard'
import MyWeek from './components/myweek/MyWeek'
import TeamView from './components/team/TeamView'
import ProjectsView from './components/projects/ProjectsView'
import { currentWeekISO } from './lib/date'
import { usePersistentState } from './lib/usePersistentState'
import { useStore } from './store/useStore'
import { useTheme } from './lib/useTheme'
import { CloudOff, Loader2 } from 'lucide-react'

export default function App() {
  const [view, setView] = usePersistentState('hub:view', 'dashboard')
  const [memberId, setMemberId] = usePersistentState('hub:member', 'm2')
  const [week, setWeek] = useState(currentWeekISO)
  const { state, sync } = useStore()
  const [theme, toggleTheme] = useTheme()

  // Si una interfaz se elimina (aquí o desde otro equipo), se borran sus PDFs locales
  useEffect(() => {
    if (!state.loading) pruneAttachments(new Set(state.integrations.map((i) => i.id)))
  }, [state.loading, state.integrations])

  if (state.loading) {
    const failed = sync.phase === 'load-error'
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Backdrop />
        <div className="card flex max-w-sm flex-col items-center gap-3 p-8 text-center">
          {failed ? <CloudOff className="h-8 w-8 text-red-500" /> : <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
          <p className="font-semibold text-slate-900">{failed ? 'No se pudo conectar con Supabase' : 'Cargando datos del equipo…'}</p>
          {failed && (
            <>
              <p className="mono break-words text-xs text-slate-600">{sync.error}</p>
              <button className="btn-primary mt-2" onClick={sync.retry}>
                Reintentar
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const openMember = (id) => {
    setMemberId(id)
    setView('myweek')
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <Sidebar view={view} onNavigate={setView} />
      <div className="lg:pl-64">
        <Topbar view={view} week={week} onWeekChange={setWeek} theme={theme} onToggleTheme={toggleTheme} />
        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10">
          {view === 'dashboard' && <Dashboard week={week} onOpenMember={openMember} onNavigate={setView} />}
          {view === 'kanban' && <KanbanBoard week={week} />}
          {view === 'myweek' && <MyWeek week={week} memberId={memberId} onMemberChange={setMemberId} onNavigate={setView} />}
          {view === 'projects' && <ProjectsView week={week} />}
          {view === 'team' && <TeamView week={week} />}
        </main>
      </div>
      <TabBar view={view} onNavigate={setView} />
    </div>
  )
}
