import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  createPromotion,
  updatePromotion,
  setActivePromotion,
  getPromotionImageUrl,
  type Promotion,
} from '@/services/promotions'
import { toDateInput, fromDatetimeLocal } from '@/lib/format'
import { Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  promotion?: Promotion | null
  onSaved: () => void
}

export function PromotionFormDialog({ open, onOpenChange, promotion, onSaved }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(promotion?.name || '')
      setDescription(promotion?.description || '')
      setIsActive(promotion?.is_active || false)
      setExpiresAt(promotion?.expires_at ? toDateInput(promotion.expires_at) : '')
      setImageFile(null)
    }
  }, [open, promotion])

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : promotion
      ? getPromotionImageUrl(promotion)
      : null

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome da promoção')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      fd.append('is_active', String(isActive))
      if (expiresAt) {
        fd.append('expires_at', fromDatetimeLocal(expiresAt + 'T00:00'))
      } else {
        fd.append('expires_at', '')
      }
      if (imageFile) fd.append('image', imageFile)

      let savedId: string
      if (promotion) {
        await updatePromotion(promotion.id, fd)
        savedId = promotion.id
      } else {
        const result = await createPromotion(fd)
        savedId = result.id
      }

      if (isActive) {
        await setActivePromotion(savedId)
      }

      toast.success(promotion ? 'Promoção atualizada!' : 'Promoção criada!')
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar promoção')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{promotion ? 'Editar Promoção' : 'Nova Promoção'}</DialogTitle>
          <DialogDescription>
            Configure o pop-up promocional exibido na página inicial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Black Friday, Happy Hour..."
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da promoção"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Validade</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <p className="text-xs text-slate-500">
              Opcional. Se definido, o pop-up não será exibido após esta data.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Imagem do Pop-up</Label>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setImageFile(f)
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Ativar pop-up</Label>
              <p className="text-sm text-slate-500">Apenas um pop-up pode estar ativo por vez.</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
