import { createClient } from '@supabase/supabase-js'

// Se configuran en .env.local (desarrollo) o como variables del repositorio en GitHub (publicación).
// La clave publicable es pública por diseño; el acceso lo controlan las políticas RLS de supabase/schema.sql.
const env = import.meta.env ?? {}
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY

/** true cuando la app debe usar Supabase; si no, funciona solo con LocalStorage (modo demo). */
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  : null
