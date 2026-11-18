import { useState } from 'react'
import { Sidebar, TabBar, Topbar } from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import KanbanBoard from './components/kanban/KanbanBoard'
import MyWeek from './components/myweek/MyWeek'
import TeamView from './components/team/TeamView'
import { currentWeekISO } from './lib/date'
import { usePersistentState } from './lib/usePersistentState'
import { useTheme } from './lib/useTheme'

export default function App() {
  const [view, setView] = usePersistentState('hub:view', 'dashboard')
  const [memberId, setMemberId] = usePersistentState('hub:member', 'm2')
  const [week, setWeek] = useState(currentWeekISO)
  const [theme, setTheme] = useTheme()

  const openMember = (id) => {
    setMemberId(id)
    setView('myweek')
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar view={view} onNavigate={setView} theme={theme} onThemeChange={setTheme} />
      <div className="lg:pl-64">
        <Topbar view={view} week={week} onWeekChange={setWeek} theme={theme} onThemeChange={setTheme} />
        <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10">
          {view === 'dashboard' && <Dashboard week={week} onOpenMember={openMember} onNavigate={setView} />}
          {view === 'kanban' && <KanbanBoard week={week} />}
          {view === 'myweek' && <MyWeek week={week} memberId={memberId} onMemberChange={setMemberId} onNavigate={setView} />}
          {view === 'team' && <TeamView week={week} />}
        </main>
      </div>
      <TabBar view={view} onNavigate={setView} />
    </div>
  )
}
