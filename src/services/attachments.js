// Adjuntos PDF por interfaz, guardados en Base64 en LocalStorage (almacenamiento temporal).
//
// Importante: viven SOLO en este navegador. No se sincronizan con Supabase, así que el
// resto del equipo no los ve. El navegador permite ~5 MB por sitio en total, por eso
// cada archivo se limita a 2 MB y se avisa cuando no queda espacio.
// Para compartirlos de verdad, el siguiente paso es Supabase Storage.

import { useSyncExternalStore } from 'react'

const KEY = 'sap-workload-hub:attachments'
export const MAX_FILE_BYTES = 2 * 1024 * 1024
export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024
const EMPTY = Object.freeze([])

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {}
  } catch {
    return {}
  }
}

let cache = read()
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

/** Escribe y avisa a los componentes. Lanza si el navegador no tiene espacio. */
function write(next) {
  if (Object.keys(next).length) localStorage.setItem(KEY, JSON.stringify(next))
  else localStorage.removeItem(KEY)
  cache = next
  emit()
}

function subscribe(listener) {
  listeners.add(listener)
  // Otras pestañas del mismo navegador
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = read()
      emit()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** { [integrationId]: Attachment[] } — se actualiza solo. */
export const useAttachmentsMap = () => useSyncExternalStore(subscribe, () => cache)
export const useAttachments = (integrationId) => useAttachmentsMap()[integrationId] ?? EMPTY

/** Bytes aproximados que ocupan los adjuntos en LocalStorage. */
export const attachmentsUsage = () => (localStorage.getItem(KEY)?.length ?? 0)

export const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)

export const formatBytes = (n) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const uid = () => `f_${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 10)}`

/** Agrega PDFs a una interfaz. Devuelve los agregados y los errores legibles por archivo. */
export async function addAttachments(integrationId, files) {
  const added = []
  const errors = []
  for (const file of files) {
    if (!isPdf(file)) {
      errors.push(`“${file.name}” no es un PDF.`)
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`“${file.name}” pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(MAX_FILE_BYTES)}.`)
      continue
    }
    let dataUrl
    try {
      dataUrl = await readAsDataURL(file)
    } catch {
      errors.push(`No se pudo leer “${file.name}”.`)
      continue
    }
    const attachment = { id: uid(), name: file.name, size: file.size, addedAt: new Date().toISOString(), dataUrl }
    try {
      write({ ...cache, [integrationId]: [...(cache[integrationId] ?? []), attachment] })
      added.push(attachment)
    } catch {
      errors.push(`No hay espacio para “${file.name}”: este navegador guarda hasta ~5 MB de adjuntos en total. Elimina alguno e inténtalo de nuevo.`)
    }
  }
  return { added, errors }
}

export function removeAttachment(integrationId, attachmentId) {
  const list = (cache[integrationId] ?? []).filter((a) => a.id !== attachmentId)
  const next = { ...cache }
  if (list.length) next[integrationId] = list
  else delete next[integrationId]
  write(next)
}

export function removeAttachmentsFor(integrationId) {
  if (!cache[integrationId]) return
  const next = { ...cache }
  delete next[integrationId]
  write(next)
}

/** Borra adjuntos de interfaces que ya no existen (por ejemplo, eliminadas por otra persona). */
export function pruneAttachments(validIds) {
  const orphans = Object.keys(cache).filter((id) => !validIds.has(id))
  if (!orphans.length) return
  const next = { ...cache }
  orphans.forEach((id) => delete next[id])
  write(next)
}

/** Convierte el Base64 guardado en una URL de Blob (más compatible para el visor y la descarga). */
export function toBlobUrl(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}
