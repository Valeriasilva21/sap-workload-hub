import { ChevronLeft, ChevronRight, Clock, Paperclip } from 'lucide-react'
import { STAGE_IDS } from '../../lib/constants'
import { blockedDays, isAtRisk, isDone } from '../../lib/selectors'
import { Avatar, ProgressBar } from '../ui/Primitives'
import { BlockedBadge, DoneBadge, ProjectTag, RiskBadge, TechBadge } from '../ui/Badges'

export default function IntegrationCard({ integration: i, project, owner, hours, attachments = 0, onOpen, onMove }) {
  const idx = STAGE_IDS.indexOf(i.stage)
  const done = isDone(i)
  const risk = !i.blocked && isAtRisk(i)
  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', i.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      role="button"
      aria-label={`Editar ${i.name}`}
      className={`group card-hover cursor-grab rounded-2xl border bg-white/85 p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:cursor-grabbing ${
        i.blocked ? 'border-rose-300/70' : 'border-edge/80'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <ProjectTag project={project} />
        <TechBadge tech={i.technology} />
      </div>

      <h3 className="mt-2 text-sm font-semibold leading-snug text-slate-900">{i.name}</h3>
      {i.systems && <p className="mt-0.5 truncate text-xs text-slate-600" title={i.systems}>{i.systems}</p>}

      {(i.blocked || risk || done) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {i.blocked && <BlockedBadge days={blockedDays(i)} />}
          {risk && <RiskBadge />}
          {done && <DoneBadge />}
        </div>
      )}
      {i.blocked && i.blockReason && <p className="mt-1.5 line-clamp-2 text-xs text-red-700">{i.blockReason}</p>}

      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={i.progress} color={done ? 'bg-emerald-500' : i.blocked ? 'bg-red-400' : 'bg-blue-600'} />
        <span className="mono text-[11px] font-medium text-slate-600">{i.progress}%</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
          <Avatar member={owner} size="sm" />
          <span className="truncate">{owner?.name.split(' ')[0] ?? 'Sin asignar'}</span>
        </span>
        <span className="badge mono bg-slate-500/10 text-slate-700 ring-slate-500/15">
          <Clock className="h-3 w-3" />
          {hours} h/sem
        </span>
        {attachments > 0 && (
          <span
            className="badge mono bg-blue-500/10 text-blue-700 ring-blue-500/25"
            title={`${attachments} PDF adjunto${attachments === 1 ? '' : 's'}`}
            aria-label={`${attachments} PDF adjuntos`}
          >
            <Paperclip className="h-3 w-3" />
            {attachments}
          </span>
        )}
        <span className="flex">
          <button
            onClick={stop(() => onMove(STAGE_IDS[idx - 1]))}
            disabled={idx === 0}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:invisible"
            aria-label="Mover a la etapa anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={stop(() => onMove(STAGE_IDS[idx + 1]))}
            disabled={idx === STAGE_IDS.length - 1}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:invisible"
            aria-label="Mover a la etapa siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </span>
      </div>
    </article>
  )
}
