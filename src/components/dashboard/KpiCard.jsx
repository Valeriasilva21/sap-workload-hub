const TONES = {
  blue: 'bg-blue-500/10 text-blue-700 ring-1 ring-inset ring-blue-500/15',
  green: 'bg-emerald-500/15 text-emerald-700 ring-1 ring-inset ring-emerald-500/20',
  amber: 'bg-amber-500/15 text-amber-700 ring-1 ring-inset ring-amber-500/20',
  red: 'bg-rose-500/15 text-rose-700 ring-1 ring-inset ring-rose-500/20',
  slate: 'bg-slate-500/10 text-slate-700 ring-1 ring-inset ring-slate-500/15',
}

export default function KpiCard({ icon: Icon, label, value, unit, sub, tone = 'blue', children }) {
  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-600">{label}</p>
          <p className="metric mt-2 flex items-baseline gap-0.5 text-[34px] leading-none text-slate-900">
            {value}
            {unit && <span className="text-lg font-medium text-slate-500">{unit}</span>}
          </p>
        </div>
        <span className={`rounded-xl p-2.5 ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {children && <div className="mt-auto pt-3">{children}</div>}
      {sub && <p className="mt-2 text-xs text-slate-600">{sub}</p>}
    </div>
  )
}
