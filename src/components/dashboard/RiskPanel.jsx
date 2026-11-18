import { CalendarClock } from 'lucide-react'
import { daysUntil, formatShortDate } from '../../lib/date'
import { Avatar, ProgressBar, SectionCard } from '../ui/Primitives'
import { StageBadge } from '../ui/Badges'

export default function RiskPanel({ items, members }) {
  if (items.length === 0) return null
  const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return (
    <SectionCard icon={CalendarClock} title="En riesgo por fecha" subtitle="Vencen en ≤ 14 días con avance < 60 %">
      <ul className="divide-y divide-slate-200/70">
        {sorted.map((i) => {
          const d = daysUntil(i.dueDate)
          return (
            <li key={i.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar member={members[i.ownerId]} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900" title={i.name}>
                  {i.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <StageBadge stage={i.stage} />
                  <ProgressBar value={i.progress} className="h-1 w-16" color="bg-amber-500" />
                  <span className="mono text-[11px] text-slate-600">{i.progress}%</span>
                </div>
              </div>
              <span className={`mono text-right text-xs font-medium ${d < 0 ? 'text-red-600' : 'text-amber-700'}`}>
                {d < 0 ? `Vencida hace ${Math.abs(d)}d` : d === 0 ? 'Vence hoy' : `${d} días`}
                <span className="block font-sans text-[11px] font-normal text-slate-600">{formatShortDate(i.dueDate)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
