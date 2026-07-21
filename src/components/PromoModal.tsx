import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Droplets } from 'lucide-react'
import {
  getActivePromotion,
  getPopupEnabled,
  getPromotionImageUrl,
  type Promotion,
} from '@/services/promotions'

export function PromoModal() {
  const [open, setOpen] = useState(false)
  const [promotion, setPromotion] = useState<Promotion | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        if (sessionStorage.getItem('promo_shown')) return
        const enabled = await getPopupEnabled()
        if (!enabled) return
        const active = await getActivePromotion()
        if (!active || !active.image) return
        setPromotion(active)
        setOpen(true)
        sessionStorage.setItem('promo_shown', '1')
      } catch {
        // silently skip on error
      }
    }
    check()
  }, [])

  const imageUrl = promotion ? getPromotionImageUrl(promotion) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-md border-0 gap-0 mx-auto">
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt={promotion?.name}
              className="w-full h-auto block object-cover max-h-[60vh]"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Droplets className="text-blue-400" size={18} />
              <span className="text-white font-bold text-sm">Lava Rápido XUÁ</span>
            </div>
          </div>
        )}
        {promotion?.name && (
          <h2 className="px-6 pt-4 text-center text-xl font-bold text-slate-800">
            {promotion.name}
          </h2>
        )}
        {promotion?.description && (
          <p className="px-6 py-3 text-center text-slate-600 text-sm">{promotion.description}</p>
        )}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button asChild className="w-full">
            <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
              Agendar Agora
            </a>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
