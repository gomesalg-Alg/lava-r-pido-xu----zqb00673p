import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Eye, Trash2, Upload, FileCheck2, X, Maximize2, Minimize2 } from 'lucide-react'
import { PdfViewerDialog } from './PdfViewerDialog'
import type { AccountsPayable } from '@/services/accounts-payable'

export const PDF_FIELDS = ['nota_compra', 'boleto_pagamento', 'comprovante_pagamento'] as const
export type PdfField = (typeof PDF_FIELDS)[number]

const CATEGORIES: { label: string; field: PdfField }[] = [
  { label: 'NOTA FISCAL', field: 'nota_compra' },
  { label: 'BOLETO BANCARIO', field: 'boleto_pagamento' },
  { label: 'COMPROVANTE DE PAGAMENTO', field: 'comprovante_pagamento' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AccountsPayable | null
  pdfFiles?: Record<PdfField, File | null>
  removedFiles?: Record<PdfField, boolean>
  onPdfChange?: (field: PdfField, file: File | null, removed: boolean) => void
  readOnly?: boolean
}

export function DigitalDocumentDialog({
  open,
  onOpenChange,
  record,
  pdfFiles,
  removedFiles,
  onPdfChange,
  readOnly = false,
}: Props) {
  const [viewerField, setViewerField] = useState<PdfField | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const inputRefs = useRef<Record<PdfField, HTMLInputElement | null>>({
    nota_compra: null,
    boleto_pagamento: null,
    comprovante_pagamento: null,
  })

  const handleFileSelect = (field: PdfField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, [field]: 'Apenas arquivos PDF são permitidos.' }))
      onPdfChange?.(field, null, false)
      if (inputRefs.current[field]) inputRefs.current[field]!.value = ''
      return
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    onPdfChange(field, file, false)
  }

  const handleInclude = (field: PdfField) => {
    inputRefs.current[field]?.click()
  }

  const handleExclude = (field: PdfField) => {
    onPdfChange?.(field, null, true)
    if (inputRefs.current[field]) inputRefs.current[field]!.value = ''
  }

  const getDisplayName = (field: PdfField) => {
    if (pdfFiles?.[field]) return pdfFiles[field]!.name
    if (removedFiles?.[field]) return ''
    return record?.[field] || ''
  }

  const hasFile = (field: PdfField) =>
    !!pdfFiles?.[field] || (!!record?.[field] && !removedFiles?.[field])

  const viewerFile = viewerField ? (pdfFiles?.[viewerField] ?? null) : null
  const viewerFilename = viewerField && !pdfFiles?.[viewerField] ? record?.[viewerField] || '' : ''
  const viewerLabel = viewerField
    ? CATEGORIES.find((c) => c.field === viewerField)?.label || 'Documento'
    : ''

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`${isExpanded ? 'max-w-7xl w-[95vw]' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto transition-all duration-300`}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Objeto Digitalizado</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsExpanded((prev) => !prev)}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {CATEGORIES.map((cat) => {
              const attached = hasFile(cat.field)
              const name = getDisplayName(cat.field)
              const gridClass = isExpanded ? 'grid grid-cols-1 md:grid-cols-3 gap-3' : 'space-y-3'
              return (
                <div key={cat.field} className={gridClass}>
                  <input
                    ref={(el) => {
                      inputRefs.current[cat.field] = el
                    }}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(cat.field, e)}
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      {attached ? (
                        <FileCheck2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-medium text-sm">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleInclude(cat.field)}
                        >
                          <Upload className="w-4 h-4 mr-1" /> Incluir
                        </Button>
                      )}
                      {attached && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setViewerField(cat.field)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!readOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleExclude(cat.field)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Excluir
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {name && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 truncate pl-7">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                  )}
                  {errors[cat.field] && (
                    <p className="text-sm text-red-500 pl-7">{errors[cat.field]}</p>
                  )}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" /> Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {viewerField && (
        <PdfViewerDialog
          open={!!viewerField}
          onOpenChange={(o) => !o && setViewerField(null)}
          file={viewerFile}
          recordId={record?.id}
          filename={viewerFilename}
          title={viewerLabel}
        />
      )}
    </>
  )
}
