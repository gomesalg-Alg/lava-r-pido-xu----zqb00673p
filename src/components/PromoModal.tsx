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
      <DialogContent className="p-0 overflow-hidden max-w-4xl w-[90vw] sm:w-[80vw] border-0 gap-0 mx-auto bg-background">
        <DialogClose className="absolute right-3 top-3 z-10 rounded-full bg-black/50 hover:bg-black/70 p-1.5 text-white transition-colors">
          <X size={20} />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        {imageUrl && (
          <div className="relative">
            <img
              src={imageUrl}
              alt={promotion?.name}
              className="w-full h-auto block object-contain max-h-[80vh]"
            />
          </div>
        )}
        <div className="px-6 pb-6 pt-4 flex justify-center">
          <Button variant="outline" className="w-full max-w-xs" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
