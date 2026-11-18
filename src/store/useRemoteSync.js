import { useCallback, useEffect, useRef, useState } from 'react'
import { isSupabaseConfigured } from '../services/supabaseClient'
import {
  applyChanges,
  diffStates,
  isSameRow,
  loadAll,
  pushChanges,
  subscribeToChanges,
  tableByName,
} from '../services/supabaseSync'

const DEBOUNCE_MS = 400
const RETRY_MS = 5000
const REFRESH_AFTER_HIDDEN_MS = 60_000

/**
 * Mantiene el estado local sincronizado con Supabase.
 * - `syncedRef` guarda la última versión confirmada en la base.
 * - Cada cambio local se compara contra esa versión y se envía solo la diferencia.
 * - Los cambios remotos se aplican salvo que esa fila tenga una edición local pendiente.
 */
export function useRemoteSync(state, dispatch) {
  const [status, setStatus] = useState(
    isSupabaseConfigured
      ? { mode: 'remote', phase: 'loading', live: false, error: null }
      : { mode: 'local', phase: 'saved', live: false, error: null },
  )
  const stateRef = useRef(state)
  stateRef.current = state
  const syncedRef = useRef(null)
  const timer = useRef(null)
  const busy = useRef(false)
  const again = useRef(false)

  const hasPending = () => Boolean(syncedRef.current) && diffStates(syncedRef.current, stateRef.current).count > 0

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setStatus((s) => ({ ...s, phase: 'loading', error: null }))
      try {
        const data = await loadAll()
        if (silent && hasPending()) return // no pisar ediciones que aún no se guardan
        syncedRef.current = data
        dispatch({ type: 'LOADED', data })
        setStatus((s) => ({ ...s, phase: 'saved', error: null }))
      } catch (e) {
        if (!silent) setStatus((s) => ({ ...s, phase: 'load-error', error: e.message }))
      }
    },
    [dispatch],
  )

  const flush = useCallback(async () => {
    if (!syncedRef.current) return
    if (busy.current) {
      again.current = true
      return
    }
    const { changes, count } = diffStates(syncedRef.current, stateRef.current)
    if (!count) {
      setStatus((s) => (s.phase === 'saved' && !s.error ? s : { ...s, phase: 'saved', error: null }))
      return
    }
    busy.current = true
    setStatus((s) => ({ ...s, phase: 'saving' }))
    try {
      await pushChanges(changes)
      syncedRef.current = applyChanges(syncedRef.current, changes)
      setStatus((s) => ({ ...s, phase: 'saved', error: null, savedAt: Date.now() }))
    } catch (e) {
      setStatus((s) => ({ ...s, phase: 'error', error: e.message }))
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, RETRY_MS)
    } finally {
      busy.current = false
      if (again.current) {
        again.current = false
        flush()
      }
    }
  }, [])

  // Carga inicial + tiempo real
  useEffect(() => {
    if (!isSupabaseConfigured) return
    load()

    const onRemote = ({ table, type, id, item }) => {
      const t = tableByName[table]
      const synced = syncedRef.current
      const rowId = id ?? item?.id
      if (!t || !synced || !rowId) return
      const local = stateRef.current[t.key].find((x) => x.id === rowId)
      const base = synced[t.key].find((x) => x.id === rowId)
      const dirty = local ? !isSameRow(t, local, base) : Boolean(base)
      if (dirty) return // hay un cambio local pendiente para esta fila: se guardará el local
      const change = Object.fromEntries(
        Object.keys(tableByName).map((n) => [n, { upserts: [], deletes: [] }]),
      )
      if (type === 'delete') change[table].deletes.push(rowId)
      else change[table].upserts.push(item)
      syncedRef.current = applyChanges(synced, change)
      dispatch(type === 'delete' ? { type: 'REMOTE_DELETE', key: t.key, id: rowId } : { type: 'REMOTE_UPSERT', key: t.key, item })
    }

    const unsubscribe = subscribeToChanges(onRemote, (st) => setStatus((s) => ({ ...s, live: st === 'SUBSCRIBED' })))

    // Al volver a la pestaña tras un rato (o recuperar conexión), recarga por si se perdieron eventos
    let hiddenAt = 0
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt > REFRESH_AFTER_HIDDEN_MS) load({ silent: true })
    }
    const onOnline = () => {
      flush()
      load({ silent: true })
    }
    const onBeforeUnload = (e) => {
      if (hasPending()) e.preventDefault()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      unsubscribe()
      clearTimeout(timer.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cada cambio local programa un guardado (agrupa escrituras rápidas, p. ej. al tipear)
  useEffect(() => {
    if (!isSupabaseConfigured || !syncedRef.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(flush, DEBOUNCE_MS)
  }, [state, flush])

  return { ...status, retry: status.phase === 'load-error' ? () => load() : flush }
}
