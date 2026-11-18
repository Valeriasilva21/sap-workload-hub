// Catálogos de dominio: etapas del ciclo de vida de una integración SAP,
// tecnologías y reglas del semáforo de cargabilidad.

export const STAGES = [
  {
    id: 'backlog',
    label: 'Backlog / Por Iniciar',
    short: 'Backlog',
    hint: 'Priorizado, sin iniciar',
    dot: 'bg-slate-400',
    soft: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'design',
    label: 'Análisis y Diseño Técnico',
    short: 'Diseño',
    hint: 'Mapeos y especificaciones',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    id: 'build',
    label: 'Desarrollo / Construcción',
    short: 'Desarrollo',
    hint: 'iFlows, WebServices, IDocs',
    dot: 'bg-blue-600',
    soft: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'test',
    label: 'Pruebas (QA / UAT)',
    short: 'QA / UAT',
    hint: 'Pruebas integrales y de usuario',
    dot: 'bg-violet-500',
    soft: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  {
    id: 'deploy',
    label: 'Pase a Producción / Estabilización',
    short: 'Producción',
    hint: 'Transportes e hypercare',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50 text-emerald-700',
  },
]

export const STAGE_IDS = STAGES.map((s) => s.id)
export const stageById = (id) => STAGES.find((s) => s.id === id) ?? STAGES[0]

export const TECHNOLOGIES = [
  { id: 'CPI', label: 'CPI', name: 'SAP Cloud Integration (iFlow)', className: 'bg-blue-50 text-blue-700 ring-blue-600/30' },
  { id: 'PO', label: 'PI/PO', name: 'SAP PI/PO', className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/30' },
  { id: 'API', label: 'API', name: 'API REST / OData', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/30' },
  { id: 'IDoc', label: 'IDoc', name: 'IDoc / ALE / EDI', className: 'bg-amber-50 text-amber-800 ring-amber-600/30' },
  { id: 'ABAP', label: 'ABAP/RFC', name: 'Proxy ABAP / RFC / BAPI', className: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/30 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:ring-fuchsia-400/30' },
]

export const techById = (id) => TECHNOLOGIES.find((t) => t.id === id) ?? TECHNOLOGIES[0]

// Clases completas (Tailwind necesita strings literales para no purgarlas).
export const COLOR_CLASSES = {
  blue: 'bg-blue-600',
  teal: 'bg-teal-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-600',
  orange: 'bg-orange-500',
  emerald: 'bg-emerald-600',
  slate: 'bg-slate-600',
  sky: 'bg-sky-600',
}

// Colores disponibles para avatares de integrantes
export const MEMBER_COLOR_KEYS = ['indigo', 'sky', 'violet', 'emerald', 'orange', 'rose', 'teal', 'amber', 'cyan', 'blue', 'slate']

export const PROJECT_COLOR_KEYS = ['blue', 'teal', 'violet', 'amber', 'rose', 'cyan', 'indigo', 'orange']

/** Semáforo: Verde < 85 % · Amarillo 85–100 % · Rojo > 100 % */
export const LOAD_THRESHOLDS = { optimal: 85, over: 100 }

const LOAD_STATUS = {
  available: {
    key: 'available',
    label: 'Disponible',
    range: '< 85 %',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/30',
    tone: 'green',
  },
  optimal: {
    key: 'optimal',
    label: 'Óptimo',
    range: '85–100 %',
    dot: 'bg-amber-400',
    bar: 'bg-amber-400',
    text: 'text-amber-700',
    pill: 'bg-amber-50 text-amber-800 ring-amber-600/30',
    tone: 'amber',
  },
  over: {
    key: 'over',
    label: 'Sobrecargado',
    range: '> 100 %',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
    text: 'text-red-700',
    pill: 'bg-red-50 text-red-700 ring-red-600/30',
    tone: 'red',
  },
}

export const LOAD_STATUS_LIST = Object.values(LOAD_STATUS)

export function loadStatus(pct) {
  if (pct > LOAD_THRESHOLDS.over) return LOAD_STATUS.over
  if (pct >= LOAD_THRESHOLDS.optimal) return LOAD_STATUS.optimal
  return LOAD_STATUS.available
}
