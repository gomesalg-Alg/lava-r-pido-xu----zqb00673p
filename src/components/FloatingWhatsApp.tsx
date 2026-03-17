import { MessageCircle } from 'lucide-react'

export function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/5511953275624"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/30 transition-transform hover:scale-110 hover:shadow-xl animate-bounce"
      aria-label="Agendar pelo WhatsApp"
    >
      <MessageCircle size={32} />
    </a>
  )
}
