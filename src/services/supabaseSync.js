// Sincronización con Supabase.
//
// La app sigue trabajando sobre su estado local (respuesta instantánea). Este módulo:
//   1. carga todo el estado desde la base al iniciar,
//   2. calcula las diferencias entre el último estado guardado y el actual y las envía,
//   3. escucha los cambios de otras personas en tiempo real.
// Así ninguna acción del store necesita saber que existe una base de datos.

import { supabase } from './supabaseClient'

const PAGE = 1000

/** Mapeo estado de la app (camelCase) ↔ filas de la base (snake_case). Solo columnas conocidas. */
export const TABLES = [
  {
    table: 'members',
    key: 'members',
    toRow: (m) => ({
      id: m.id,
      name: m.name,
      role: m.role ?? '',
      capacity: Number(m.capacity) || 40,
      color: m.color || 'blue',
      active: m.active !== false,
    }),
    fromRow: (r) => ({
      id: r.id,
      name: r.name,
      role: r.role ?? '',
      capacity: Number(r.capacity),
      color: r.color,
      active: r.active,
      createdAt: r.created_at,
    }),
  },
  {
    table: 'projects',
    key: 'projects',
    toRow: (p) => ({ id: p.id, code: p.code ?? '', name: p.name, color: p.color || 'blue' }),
    fromRow: (r) => ({ id: r.id, code: r.code, name: r.name, color: r.color }),
  },
  {
    table: 'integrations',
    key: 'integrations',
    toRow: (i) => ({
      id: i.id,
      project_id: i.projectId,
      name: i.name,
      systems: i.systems ?? '',
      technology: i.technology,
      stage: i.stage,
      owner_id: i.ownerId || null,
      progress: Math.round(Number(i.progress) || 0),
      due_date: i.dueDate || null,
      blocked: Boolean(i.blocked),
      block_reason: i.blockReason ?? '',
      blocked_since: i.blockedSince || null,
      updated_at: i.updatedAt || i.createdAt || new Date().toISOString(),
    }),
    fromRow: (r) => ({
      id: r.id,
      projectId: r.project_id,
      name: r.name,
      systems: r.systems ?? '',
      technology: r.technology,
      stage: r.stage,
      ownerId: r.owner_id ?? '',
      progress: r.progress,
      dueDate: r.due_date,
      blocked: r.blocked,
      blockReason: r.block_reason ?? '',
      blockedSince: r.blocked_since,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }),
  },
  {
    table: 'allocations',
    key: 'allocations',
    toRow: (a) => ({
      id: a.id,
      member_id: a.memberId,
      integration_id: a.integrationId,
      week_start: a.weekStart,
      hours: Number(a.hours) || 0,
    }),
    fromRow: (r) => ({
      id: r.id,
      memberId: r.member_id,
      integrationId: r.integration_id,
      weekStart: r.week_start,
      hours: Number(r.hours),
      createdAt: r.created_at,
    }),
  },
]

export const tableByName = Object.fromEntries(TABLES.map((t) => [t.table, t]))

/** Huella comparable de una fila (ignora campos que solo la base administra). */
const fingerprint = (t, item) => {
  const { updated_at: _ignored, ...row } = t.toRow(item)
  return JSON.stringify(row)
}

export const isSameRow = (t, a, b) => Boolean(a && b) && fingerprint(t, a) === fingerprint(t, b)

async function fetchTable(t) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(t.table)
      .select('*')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows.map(t.fromRow)
}

export async function loadAll() {
  const lists = await Promise.all(TABLES.map(fetchTable))
  return Object.fromEntries(TABLES.map((t, i) => [t.key, lists[i]]))
}

/** Diferencias entre dos estados: filas nuevas o modificadas y filas eliminadas, por tabla. */
export function diffStates(prev, next) {
  const changes = {}
  let count = 0
  for (const t of TABLES) {
    const before = new Map((prev?.[t.key] ?? []).map((x) => [x.id, x]))
    const after = next[t.key] ?? []
    const afterIds = new Set(after.map((x) => x.id))
    const upserts = after.filter((x) => !isSameRow(t, before.get(x.id), x))
    const deletes = [...before.keys()].filter((id) => !afterIds.has(id))
    changes[t.table] = { upserts, deletes }
    count += upserts.length + deletes.length
  }
  return { changes, count }
}

/**
 * Envía los cambios. Primero borra (de hijas a padres) y luego inserta/actualiza
 * (de padres a hijas), para respetar llaves foráneas y la restricción de unicidad semanal.
 */
export async function pushChanges(changes) {
  for (const t of [...TABLES].reverse()) {
    const ids = changes[t.table].deletes
    if (!ids.length) continue
    const { error } = await supabase.from(t.table).delete().in('id', ids)
    if (error) throw error
  }
  for (const t of TABLES) {
    const rows = changes[t.table].upserts.map(t.toRow)
    if (!rows.length) continue
    const { error } = await supabase.from(t.table).upsert(rows)
    if (error) throw error
  }
}

/** Aplica cambios ya confirmados sobre la "foto" de lo que hay en la base. */
export function applyChanges(snapshot, changes) {
  const next = { ...snapshot }
  for (const t of TABLES) {
    const { upserts, deletes } = changes[t.table]
    if (!upserts.length && !deletes.length) continue
    const map = new Map((snapshot[t.key] ?? []).map((x) => [x.id, x]))
    deletes.forEach((id) => map.delete(id))
    upserts.forEach((x) => map.set(x.id, x))
    next[t.key] = [...map.values()]
  }
  return next
}

/** Escucha cambios de cualquier persona. Devuelve una función para dejar de escuchar. */
export function subscribeToChanges(onChange, onStatus) {
  let channel = supabase.channel('workload-hub-db')
  for (const t of TABLES) {
    channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: t.table }, (payload) => {
      if (payload.eventType === 'DELETE') onChange({ table: t.table, type: 'delete', id: payload.old?.id })
      else onChange({ table: t.table, type: 'upsert', item: t.fromRow(payload.new) })
    })
  }
  channel.subscribe((status) => onStatus?.(status))
  return () => supabase.removeChannel(channel)
}
