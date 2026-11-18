// Capa de persistencia. Toda la app habla con `repository` y no sabe dónde
// viven los datos. Hoy: LocalStorage. Mañana: Supabase (ver supabaseRepository.js).

const STORAGE_KEY = 'sap-workload-hub:state'

export const localStorageRepository = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* almacenamiento lleno o bloqueado: la app sigue funcionando en memoria */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
  },
}

export const repository = localStorageRepository
