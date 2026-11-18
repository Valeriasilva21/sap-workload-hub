// Selectores puros: derivan métricas a partir del estado normalizado.
// Al migrar a Supabase, estas funciones pueden reemplazarse por vistas SQL
// (ver supabase/schema.sql → member_week_load).

import { loadStatus } from './constants'
import { addWeeks, daysBetween, daysUntil } from './date'

export const indexById = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]))

const sumHours = (list) => list.reduce((s, a) => s + (Number(a.hours) || 0), 0)

export const isDone = (i) => i.stage === 'deploy' && Number(i.progress) >= 100

/** En riesgo: fecha comprometida vencida, o vence en ≤ 14 días con avance < 60 %. */
export function isAtRisk(i) {
  if (isDone(i) || !i.dueDate) return false
  const d = daysUntil(i.dueDate)
  return d < 0 || (d <= 14 && Number(i.progress) < 60)
}

export const blockedDays = (i) => (i.blocked && i.blockedSince ? daysBetween(i.blockedSince) : 0)

export function weekHoursByIntegration(state, week) {
  const map = {}
  for (const a of state.allocations) {
    if (a.weekStart !== week) continue
    map[a.integrationId] = (map[a.integrationId] || 0) + (Number(a.hours) || 0)
  }
  return map
}

export function weekMembersByIntegration(state, week) {
  const map = {}
  for (const a of state.allocations) {
    if (a.weekStart !== week) continue
    ;(map[a.integrationId] ??= new Set()).add(a.memberId)
  }
  return map
}

export function memberLoad(state, member, week) {
  const ints = indexById(state.integrations)
  const projs = indexById(state.projects)
  const allocations = state.allocations.filter((a) => a.memberId === member.id && a.weekStart === week)
  const hours = sumHours(allocations)
  const capacity = Number(member.capacity) || 0
  const pct = capacity ? Math.round((hours / capacity) * 100) : 0

  const byProject = {}
  let blocked = 0
  for (const a of allocations) {
    const integ = ints[a.integrationId]
    if (!integ) continue
    if (integ.blocked) blocked++
    const project = projs[integ.projectId]
    const key = project?.id ?? 'none'
    byProject[key] ??= { project, hours: 0, items: [] }
    byProject[key].hours += Number(a.hours) || 0
    byProject[key].items.push(integ)
  }

  return {
    member,
    allocations,
    hours,
    capacity,
    pct,
    free: capacity - hours,
    status: loadStatus(pct),
    breakdown: Object.values(byProject).sort((a, b) => b.hours - a.hours),
    blocked,
  }
}

export function teamLoad(state, week) {
  const loads = state.members.filter((m) => m.active !== false).map((m) => memberLoad(state, m, week))
  const hours = loads.reduce((s, l) => s + l.hours, 0)
  const capacity = loads.reduce((s, l) => s + l.capacity, 0)
  const pct = capacity ? Math.round((hours / capacity) * 100) : 0
  return { loads, hours, capacity, pct, status: loadStatus(pct) }
}

export function teamHistory(state, week, n = 4) {
  return Array.from({ length: n }, (_, k) => {
    const w = addWeeks(week, -(n - 1 - k))
    const t = teamLoad(state, w)
    return { week: w, pct: t.pct, hours: t.hours }
  })
}

export function teamKpis(state, week) {
  const team = teamLoad(state, week)
  const open = state.integrations.filter((i) => !isDone(i))
  const history = teamHistory(state, week, 4)
  return {
    team,
    active: open.filter((i) => i.stage !== 'backlog').length,
    backlog: open.filter((i) => i.stage === 'backlog').length,
    done: state.integrations.length - open.length,
    blocked: open.filter((i) => i.blocked),
    risk: open.filter((i) => !i.blocked && isAtRisk(i)),
    history,
    avgOccupancy: Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length),
  }
}

export function blockerList(state) {
  const projs = indexById(state.projects)
  const members = indexById(state.members)
  return state.integrations
    .filter((i) => i.blocked && !isDone(i))
    .map((i) => ({ integration: i, project: projs[i.projectId], owner: members[i.ownerId], days: blockedDays(i) }))
    .sort((a, b) => b.days - a.days)
}

/** Asignaciones de `fromWeek` que aún no existen en `toWeek` y cuya interfaz sigue abierta. */
export function cloneCandidates(state, memberId, fromWeek, toWeek) {
  const existing = new Set(
    state.allocations.filter((a) => a.memberId === memberId && a.weekStart === toWeek).map((a) => a.integrationId),
  )
  const ints = indexById(state.integrations)
  return state.allocations.filter(
    (a) =>
      a.memberId === memberId &&
      a.weekStart === fromWeek &&
      !existing.has(a.integrationId) &&
      ints[a.integrationId] &&
      !isDone(ints[a.integrationId]),
  )
}
