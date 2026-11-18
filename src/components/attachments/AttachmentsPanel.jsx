import { useRef, useState } from 'react'
import { Download, Eye, FileText, FileUp, Loader2, Paperclip, Trash2 } from 'lucide-react'
import {
  MAX_FILE_BYTES,
  STORAGE_BUDGET_BYTES,
  addAttachments,
  attachmentsUsage,
  formatBytes,
  removeAttachment,
  toBlobUrl,
  useAttachments,
} from '../../services/attachments'
import PdfViewerModal from './PdfViewerModal'

const shortDate = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Zona de carga (drag & drop) + lista de PDFs de una interfaz. */
export default function AttachmentsPanel({ integrationId }) {
  const files = useAttachments(integrationId)
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState([])
  const [viewing, setViewing] = useState(null)

  const usage = attachmentsUsage()
  const usagePct = Math.min(100, Math.round((usage / STORAGE_BUDGET_BYTES) * 100))

  const upload = async (list) => {
    if (!list?.length) return
    setBusy(true)
    const { errors: errs } = await addAttachments(integrationId, [...list])
    setErrors(errs)
    setBusy(false)
  }

  const download = (file) => {
    const url = toBlobUrl(file.dataUrl)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const remove = (file) => {
    if (window.confirm(`¿Eliminar “${file.name}”?`)) removeAttachment(integrationId, file.id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <Paperclip className="h-4 w-4 text-slate-500" /> Documentos PDF
          {files.length > 0 && (
            <span className="badge mono bg-blue-500/10 text-blue-700 ring-blue-500/25">{files.length}</span>
          )}
        </p>
        <span className="text-[11px] text-slate-500" title="Espacio de adjuntos usado en este navegador">
          <span className="mono">{formatBytes(usage)}</span> de ~5 MB
        </span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload(e.dataTransfer.files)
        }}
        className={`flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
          dragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-300/70 bg-white/40 hover:border-blue-300 hover:bg-white/70'
        }`}
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : <FileUp className={`h-6 w-6 ${dragging ? 'text-blue-600' : 'text-slate-500'}`} />}
        <span className="text-sm font-medium text-slate-800">
          {dragging ? 'Suelta los PDFs aquí' : 'Arrastra PDFs aquí o haz clic para elegir'}
        </span>
        <span className="text-[11px] text-slate-500">
          Máx. {formatBytes(MAX_FILE_BYTES)} por archivo · se guardan solo en este navegador
        </span>
        <span className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-slate-200/70" aria-hidden="true">
          <span
            className={`block h-full rounded-full ${usagePct > 85 ? 'bg-rose-500' : 'bg-blue-500'}`}
            style={{ width: `${usagePct}%` }}
          />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(e) => {
          upload(e.target.files)
          e.target.value = ''
        }}
      />

      {errors.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2 text-xs text-rose-700" role="alert">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-slate-200/60 overflow-hidden rounded-2xl border border-edge/80 bg-white/50">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/20">
                <FileText className="h-[18px] w-[18px]" />
              </span>
              <button
                type="button"
                onClick={() => setViewing(f)}
                className="min-w-0 flex-1 text-left"
                title="Ver PDF"
              >
                <p className="truncate text-sm font-medium text-slate-900 hover:text-blue-700">{f.name}</p>
                <p className="mono text-[11px] text-slate-500">
                  {formatBytes(f.size)} · {shortDate.format(new Date(f.addedAt))}
                </p>
              </button>
              <div className="flex shrink-0">
                <button type="button" onClick={() => setViewing(f)} className="btn-ghost p-2" aria-label={`Ver ${f.name}`} title="Ver">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => download(f)} className="btn-ghost p-2" aria-label={`Descargar ${f.name}`} title="Descargar">
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className="btn-ghost p-2 hover:bg-rose-500/10 hover:text-rose-600"
                  aria-label={`Eliminar ${f.name}`}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PdfViewerModal attachment={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
