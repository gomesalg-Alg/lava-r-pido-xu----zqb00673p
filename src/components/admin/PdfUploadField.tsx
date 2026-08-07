import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Eye, Trash2 } from 'lucide-react'
import { PdfViewerDialog } from './PdfViewerDialog'

interface Props {
  label: string
  value: string
  recordId?: string
  onChange: (file: File | null, removed: boolean) => void
  error?: string
}

export function PdfUploadField({ label, value, recordId, onChange, error }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removed, setRemoved] = useState(false)
  const [localError, setLocalError] = useState('')
  const [viewerOpen, setViewerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setLocalError('Apenas arquivos PDF são permitidos.')
      setSelectedFile(null)
      setRemoved(false)
      onChange(null, false)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setLocalError('')
    setSelectedFile(file)
    setRemoved(false)
    onChange(file, false)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setRemoved(true)
    onChange(null, true)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayName = selectedFile?.name || (removed ? '' : value || '')
  const canView = !!selectedFile || (!!value && !removed && !!recordId)

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="flex-1 text-sm"
        />
        {canView && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setViewerOpen(true)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {displayName && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-red-600 hover:text-red-700"
            onClick={handleRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      {displayName && (
        <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{displayName}</span>
        </div>
      )}
      {(localError || error) && <p className="text-sm text-red-500">{localError || error}</p>}
      {viewerOpen && (
        <PdfViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          file={selectedFile}
          recordId={recordId}
          filename={selectedFile ? '' : value}
          title={label}
        />
      )}
    </div>
  )
}
