import { useMemo } from 'react'
import { Activity, Gauge, Layers, ShieldAlert } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { blockerList, indexById, teamKpis } from '../../lib/selectors'
import { isoWeekNumber } from '../../lib/date'
import { CapacityBar } from '../ui/Primitives'
import KpiCard from './KpiCard'
import WorkloadMatrix from './WorkloadMatrix'
import BlockersPanel from './BlockersPanel'
import RiskPanel from './RiskPanel'
import PipelinePanel from './PipelinePanel'

export default function Dashboard({ week, onOpenMember, onNavigate }) {
  const { state, actions } = useStore()
  const kpis = useMemo(() => teamKpis(state, week), [state, week])
  const blockers = useMemo(() => blockerList(state), [state])
  const { team } = kpis
  const maxHist = Math.max(100, ...kpis.history.map((h) => h.pct))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Gauge}
          label="Capacidad del equipo"
          value={team.pct}
          unit="%"
          tone={team.status.tone}
          sub={<><span className="mono-sm">{team.hours} h</span> asignadas de <span className="mono-sm">{team.capacity} h</span> · {team.status.label}</>}
        >
          <CapacityBar pct={team.pct} status={team.status} />
        </KpiCard>

        <KpiCard
          icon={Layers}
          label="Integraciones activas"
          value={kpis.active}
          tone="blue"
          sub={`${kpis.backlog} en backlog · ${kpis.done} completadas`}
        />

        <KpiCard
          icon={ShieldAlert}
          label="En riesgo / bloqueadas"
          value={kpis.blocked.length + kpis.risk.length}
          tone={kpis.blocked.length ? 'red' : kpis.risk.length ? 'amber' : 'green'}
        >
          <div className="flex flex-wrap gap-1.5 text-xs font-medium">
            <span className="badge bg-red-50 px-2 py-1 text-xs text-red-700 ring-red-600/30"><span className="font-mono font-semibold">{kpis.blocked.length}</span> bloqueadas</span>
            <span className="badge bg-amber-50 px-2 py-1 text-xs text-amber-800 ring-amber-600/30"><span className="font-mono font-semibold">{kpis.risk.length}</span> en riesgo por fecha</span>
          </div>
        </KpiCard>

        <KpiCard icon={Activity} label="Promedio ocupación semanal" value={kpis.avgOccupancy} unit="%" tone="slate" sub="Últimas 4 semanas">
          <div className="flex h-10 items-end gap-2">
            {kpis.history.map((h) => (
              <div key={h.week} className="flex flex-1 flex-col items-center gap-1" title={`Semana ${isoWeekNumber(h.week)}: ${h.pct}%`}>
                <div
                  className={`w-full rounded-sm ${h.week === week ? 'bg-blue-600' : 'bg-slate-300'}`}
                  style={{ height: `${Math.max(4, (h.pct / maxHist) * 28)}px` }}
                />
                <span className="font-mono text-[10px] leading-none text-slate-600">S{isoWeekNumber(h.week)}</span>
              </div>
            ))}
          </div>
        </KpiCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <WorkloadMatrix loads={team.loads} onOpenMember={onOpenMember} />
        </div>
        <div className="space-y-6">
          <BlockersPanel
            items={blockers}
            onResolve={(id) => actions.updateIntegration(id, { blocked: false })}
            onOpenBoard={() => onNavigate('kanban')}
          />
          <RiskPanel items={kpis.risk} projects={indexById(state.projects)} members={indexById(state.members)} />
          <PipelinePanel integrations={state.integrations} />
        </div>
      </div>
    </div>
  )
}
