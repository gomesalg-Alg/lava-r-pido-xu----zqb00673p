import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, Maximize2, Loader2, Download } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordId?: string
  filename?: string
  file?: File | null
  title: string
}

export function PdfViewerDialog({ open, onOpenChange, recordId, filename, file, title }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setZoom(1)
    setError(null)
    let revoked = false
    let createdUrl: string | null = null

    const load = async () => {
      setLoading(true)
      try {
        if (file) {
          createdUrl = URL.createObjectURL(file)
          if (!revoked) {
            setObjectUrl(createdUrl)
            setLoading(false)
          }
        } else if (recordId && filename) {
          const baseUrl = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '')
          const url = `${baseUrl}/api/files/accounts_payable/${recordId}/${filename}`
          const res = await fetch(url, {
            headers: { Authorization: pb.authStore.token || '' },
          })
          if (!res.ok) throw new Error('Failed to load PDF')
          const blob = await res.blob()
          if (revoked) return
          createdUrl = URL.createObjectURL(blob)
          setObjectUrl(createdUrl)
          setLoading(false)
        }
      } catch {
        setError('Erro ao carregar o documento.')
        setLoading(false)
      }
    }
    load()

    return () => {
      revoked = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
      setObjectUrl(null)
    }
  }, [open, file, recordId, filename])

  const handleDownload = () => {
    if (!objectUrl) return
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename || file?.name || 'document.pdf'
    a.click()
  }

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const resetZoom = () => setZoom(1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base truncate">{title}</DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm tabular-nums w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!objectUrl}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-slate-800 flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Carregando documento...</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {objectUrl && !loading && !error && (
            <iframe
              key={zoom}
              src={`${objectUrl}#zoom=${Math.round(zoom * 100)}&toolbar=1`}
              className="w-full h-full bg-white"
              style={{ border: 'none', minHeight: '100%' }}
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
