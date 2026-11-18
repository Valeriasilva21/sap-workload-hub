// Utilidades de fecha sin dependencias. Las semanas comienzan el lunes (ISO 8601)
// y se representan como string 'YYYY-MM-DD' del lunes correspondiente.

const DAY_MS = 86_400_000

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const todayISO = () => toISO(new Date())

export function startOfWeek(date = new Date()) {
  const d = startOfDay(date)
  const offset = (d.getDay() + 6) % 7 // lunes = 0
  d.setDate(d.getDate() - offset)
  return d
}

export const currentWeekISO = () => toISO(startOfWeek())

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const addWeeks = (iso, n) => addDays(iso, n * 7)

/** Días completos transcurridos desde `iso` hasta hoy (mínimo 0). */
export function daysBetween(iso) {
  return Math.max(0, Math.round((startOfDay() - parseISO(iso)) / DAY_MS))
}

/** Días que faltan hasta `iso` (negativo si ya pasó). */
export function daysUntil(iso) {
  return Math.round((parseISO(iso) - startOfDay()) / DAY_MS)
}

export function isoWeekNumber(iso) {
  const d = parseISO(iso)
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - yearStart) / DAY_MS + 1) / 7)
}

const dayMonth = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })

export function formatWeekRange(iso) {
  const start = parseISO(iso)
  const end = parseISO(addDays(iso, 4))
  return `${dayMonth.format(start)} – ${dayMonth.format(end)} ${end.getFullYear()}`
}

export function formatShortDate(iso) {
  return iso ? dayMonth.format(parseISO(iso)) : '—'
}
