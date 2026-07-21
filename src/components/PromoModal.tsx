import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
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
      <DialogContent className="p-0 overflow-hidden max-w-4xl w-[90vw] sm:w-[80vw] border-0 gap-0 mx-auto bg-background rounded-2xl">
        <DialogClose className="absolute right-3 top-3 z-20 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 text-white shadow-lg ring-1 ring-white/20 transition-all duration-200 hover:scale-105">
          <X size={22} strokeWidth={2.5} />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        {imageUrl && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={promotion?.name}
              className="w-full h-auto block object-cover max-h-[85vh] sm:max-h-[90vh] rounded-2xl"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
