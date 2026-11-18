import { Workflow } from 'lucide-react'
import { STAGES } from '../../lib/constants'
import { isDone } from '../../lib/selectors'
import { SectionCard } from '../ui/Primitives'

export default function PipelinePanel({ integrations }) {
  const open = integrations.filter((i) => !isDone(i))
  const rows = STAGES.map((s) => {
    const items = open.filter((i) => i.stage === s.id)
    return { stage: s, count: items.length, blocked: items.filter((i) => i.blocked).length }
  })
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <SectionCard icon={Workflow} title="Avance por etapa" subtitle={`${open.length} integraciones abiertas`}>
      <ul className="space-y-3 p-5">
        {rows.map(({ stage, count, blocked }) => (
          <li key={stage.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{stage.label}</span>
              <span className="mono text-slate-700">
                {count}
                {blocked > 0 && <span className="ml-1.5 font-medium text-red-600">({blocked} bloq.)</span>}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${stage.dot}`} style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
