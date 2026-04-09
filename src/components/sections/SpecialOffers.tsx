import { Reveal } from '@/components/Reveal'
import { Droplets } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function SpecialOffers() {
  return (
    <section id="servicos-promocao" className="relative py-20 bg-[#000a20] overflow-hidden">
      {/* Decorative water background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,26,102,0.8)_0%,rgba(0,10,32,1)_100%)]"></div>

      {/* Animated Droplets for water effect */}
      <div className="absolute top-10 left-10 text-blue-500/20 rotate-12 blur-[1px]">
        <Droplets size={80} />
      </div>
      <div className="absolute top-1/4 right-5 text-blue-400/30 -rotate-12 blur-[2px]">
        <Droplets size={120} />
      </div>
      <div className="absolute bottom-1/3 left-5 text-blue-300/20 rotate-45 blur-[1px]">
        <Droplets size={90} />
      </div>
      <div className="absolute bottom-20 right-1/4 text-blue-500/30 -rotate-45 blur-[2px]">
        <Droplets size={70} />
      </div>
      <div className="absolute top-1/2 left-1/4 text-blue-400/10 rotate-90 blur-[3px]">
        <Droplets size={150} />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-4 tracking-tight leading-tight">
              SERVIÇOS
              <br />
              EM PROMOÇÃO:
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col items-center gap-12 max-w-4xl mx-auto w-full mb-16">
          {/* POLIMENTO */}
          <Reveal delay={100} className="w-full flex justify-center">
            <div className="relative transform -skew-x-12 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 px-8 py-2 md:py-3 shadow-[0_8px_30px_rgba(234,179,8,0.4)] border-b-4 border-orange-800 rounded-sm w-[90%] md:w-auto text-center">
              <span className="relative transform skew-x-12 block text-5xl md:text-7xl font-black italic text-yellow-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] tracking-wider px-4">
                POLIMENTO
              </span>
              {/* Inner glow */}
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
              {/* Light flare fake */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-yellow-200 blur-[2px]"></div>
            </div>
          </Reveal>

          {/* HIGIENIZAÇÃO */}
          <Reveal delay={200} className="w-full flex justify-center">
            <div className="relative transform -skew-x-12 bg-gradient-to-r from-green-800 via-green-600 to-green-800 px-8 py-2 md:py-3 shadow-[0_8px_30px_rgba(34,197,94,0.4)] border-b-4 border-green-950 rounded-sm w-[90%] md:w-auto text-center">
              <span className="relative transform skew-x-12 block text-5xl md:text-7xl font-black italic text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] tracking-wider px-4">
                HIGIENIZAÇÃO
              </span>
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
              <div className="absolute bottom-0 left-1/3 w-1/4 h-1 bg-green-300 blur-[2px]"></div>
            </div>
          </Reveal>

          {/* HIGIENIZAÇÃO DE SOFÁS */}
          <Reveal delay={300} className="w-full flex justify-center">
            <div className="relative transform -skew-x-12 bg-gradient-to-r from-green-800 via-green-600 to-green-800 px-8 py-4 md:py-5 shadow-[0_8px_30px_rgba(34,197,94,0.4)] border-b-4 border-green-950 rounded-sm w-[95%] md:w-auto text-center flex flex-col justify-center items-center">
              <span className="relative transform skew-x-12 block text-4xl md:text-6xl lg:text-7xl font-black italic text-white drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] tracking-wider leading-none mb-2">
                HIGIENIZAÇÃO
              </span>
              <span className="relative transform skew-x-12 block text-4xl md:text-6xl lg:text-7xl font-black italic text-yellow-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.8)] tracking-wider leading-none">
                DE SOFÁS
              </span>
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
              <div className="absolute bottom-0 right-1/4 w-1/4 h-1 bg-blue-300 blur-[2px]"></div>
            </div>
          </Reveal>
        </div>

        {/* Contact Info */}
        <Reveal delay={400}>
          <div className="flex justify-center mt-8">
            <a
              href="https://wa.me/5511953275624"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('click', { button: 'promo_whatsapp_contact' })}
              className="group flex items-center gap-3 sm:gap-5 hover:scale-105 transition-transform duration-300 bg-black/40 backdrop-blur-md px-6 py-4 md:px-8 md:py-5 rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 md:w-14 md:h-14 fill-[#25D366] group-hover:drop-shadow-[0_0_15px_rgba(37,211,102,0.8)] transition-all duration-300"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-wider drop-shadow-md">
                (11) 9 5327-5624
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
