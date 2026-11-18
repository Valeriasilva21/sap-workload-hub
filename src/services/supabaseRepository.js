// Adaptador de referencia para Supabase/PostgreSQL (no se usa en la demo).
//
// Pasos para activarlo:
//   1. npm i @supabase/supabase-js
//   2. Ejecutar supabase/schema.sql en tu proyecto
//   3. const client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
//   4. Cargar el estado con `loadAll(client)` y reemplazar los dispatch del store
//      por las funciones de escritura de abajo (o sincronizar tras cada acción).

const toCamel = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]))

const toSnake = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]))

async function select(client, table) {
  const { data, error } = await client.from(table).select('*')
  if (error) throw error
  return data.map(toCamel)
}

export async function loadAll(client) {
  const [members, projects, integrations, allocations] = await Promise.all([
    select(client, 'members'),
    select(client, 'projects'),
    select(client, 'integrations'),
    select(client, 'allocations'),
  ])
  return { version: 1, members, projects, integrations, allocations }
}

export const createSupabaseWriter = (client) => ({
  upsertIntegration: (integration) => client.from('integrations').upsert(toSnake(integration)),
  deleteIntegration: (id) => client.from('integrations').delete().eq('id', id),
  upsertAllocations: (allocations) => client.from('allocations').upsert(allocations.map(toSnake)),
  deleteAllocation: (id) => client.from('allocations').delete().eq('id', id),
  insertProject: (project) => client.from('projects').insert(toSnake(project)),
})
