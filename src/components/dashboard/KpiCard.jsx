const TONES = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-700',
}

export default function KpiCard({ icon: Icon, label, value, unit, sub, tone = 'blue', children }) {
  return (
    <div className="card flex flex-col p-5">
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
