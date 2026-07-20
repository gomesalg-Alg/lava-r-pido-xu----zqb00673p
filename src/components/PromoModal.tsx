import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import promoImg from '@/assets/happhour-d60e4.png'

export function PromoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden flex items-center justify-center">
        <DialogTitle className="sr-only">NOVO ESPAÇO HAPPY-HOUR</DialogTitle>
        <DialogDescription className="sr-only">
          Venha para o ambiente familiar depois do serviço!
        </DialogDescription>
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 md:-top-4 md:-right-4 z-50 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors shadow-xl"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <img
            src={promoImg}
            alt="Lava Rápido Xuá - Novo Espaço Happy Hour"
            className="w-full h-auto max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
