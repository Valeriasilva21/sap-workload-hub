import { useEffect, useState } from 'react'
import { Download, ExternalLink } from 'lucide-react'
import { formatBytes, toBlobUrl } from '../../services/attachments'
import { Modal } from '../ui/Primitives'

/** Visor de PDF en un iframe limpio, con descarga y apertura en pestaña nueva. */
export default function PdfViewerModal({ attachment, onClose }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!attachment) return
    const blobUrl = toBlobUrl(attachment.dataUrl)
    setUrl(blobUrl)
    return () => {
      URL.revokeObjectURL(blobUrl)
      setUrl(null)
    }
  }, [attachment])

  // La URL se libera un render después de cerrar: mostrar solo si ambos existen
  const ready = Boolean(attachment && url)

  return (
    <Modal
      open={Boolean(attachment)}
      onClose={onClose}
      size="xl"
      bodyClassName="p-0"
      title={attachment?.name ?? ''}
      subtitle={attachment ? `PDF · ${formatBytes(attachment.size)}` : ''}
      footer={
        ready && (
          <>
            <span className="text-xs text-slate-600">Guardado solo en este navegador</span>
            <div className="flex gap-2">
              <a className="btn-secondary" href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Abrir en pestaña
              </a>
              <a className="btn-primary" href={url} download={attachment.name}>
                <Download className="h-4 w-4" /> Descargar
              </a>
            </div>
          </>
        )
      }
    >
      {ready && (
        <iframe
          title={`Vista previa de ${attachment.name}`}
          src={url}
          className="block h-[70vh] w-full border-0 bg-slate-100"
        />
      )}
    </Modal>
  )
}
