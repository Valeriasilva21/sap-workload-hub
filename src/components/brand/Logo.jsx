import { useId } from 'react'

export const BRAND = {
  name: 'novaFlow',
  by: 'by Weinnova',
  tagline: 'SAP Integration & Workload Hub',
}

/**
 * Isotipo de novaFlow: tres nodos unidos por una curva ascendente continua
 * (integración + flujo) sobre una baldosa en degradado azul → índigo con brillo de cristal.
 * Se ve igual en tema claro y oscuro porque no depende del fondo.
 */
export function LogoMark({ size = 36, className = '' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="novaFlow"
      className={`shrink-0 drop-shadow-[0_4px_10px_rgba(79,70,229,0.35)] ${className}`}
    >
      <defs>
        <linearGradient id={`${id}-tile`} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="16" y1="1" x2="16" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-flow`} x1="7" y1="23" x2="25" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      {/* Baldosa con brillo superior (efecto cristal) */}
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-tile)`} />
      <rect x="1" y="1" width="30" height="15" rx="9" fill={`url(#${id}-shine)`} />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" stroke="#fff" strokeOpacity="0.25" />
      {/* Flujo continuo entre nodos */}
      <path
        d="M8.5 22.5C12.6 22.5 12.4 16 16 16C19.6 16 19.4 9.5 23.5 9.5"
        stroke={`url(#${id}-flow)`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Nodos: origen, hub central (con anillo) y destino */}
      <circle cx="8.5" cy="22.5" r="2.6" fill="#fff" fillOpacity="0.85" />
      <circle cx="16" cy="16" r="3.6" fill="#fff" fillOpacity="0.22" />
      <circle cx="16" cy="16" r="2.2" fill="#fff" />
      <circle cx="23.5" cy="9.5" r="2.6" fill="#fff" />
    </svg>
  )
}

/** Subtítulo completo en una línea: "by Weinnova • SAP Integration & Workload Hub". */
export function BrandTagline({ className = '' }) {
  return (
    <span className={`text-slate-600 ${className}`}>
      <span className="font-semibold text-slate-700">{BRAND.by}</span>
      <span className="text-slate-400"> • </span>
      {BRAND.tagline}
    </span>
  )
}

/** Logotipo: "nova" en peso medio + "Flow" en negrita con acento azul → índigo. */
export function Wordmark({ className = 'text-[17px]' }) {
  return (
    <span className={`font-sans leading-none tracking-[-0.02em] ${className}`}>
      <span className="font-medium text-slate-900">nova</span>
      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-extrabold text-transparent dark:to-indigo-400">
        Flow
      </span>
    </span>
  )
}

/** Marca completa: isotipo + nombre + "by Weinnova • SAP Integration & Workload Hub". */
export function Brand({ compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark size={compact ? 24 : 38} />
      <div className="min-w-0">
        <Wordmark className={compact ? 'text-[15px]' : 'text-[19px]'} />
        {!compact && (
          <div className="mt-1 leading-tight" title={`${BRAND.by} • ${BRAND.tagline}`}>
            <p className="text-[11px] font-semibold text-slate-700">{BRAND.by}</p>
            <p className="text-[10.5px] text-slate-600">{BRAND.tagline}</p>
          </div>
        )}
      </div>
    </div>
  )
}
