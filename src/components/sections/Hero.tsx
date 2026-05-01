import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, MessageSquare } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { trackEvent } from '@/lib/analytics'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

const HERO_IMAGES = [
  'https://img.usecurling.com/p/1920/1080?q=clean%20shiny%20car',
  'https://img.usecurling.com/p/1920/1080?q=car%20wash%20foam',
  'https://img.usecurling.com/p/1920/1080?q=car%20interior%20clean',
  'https://img.usecurling.com/p/1920/1080?q=polishing%20car',
]

export function Hero() {
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }))

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-slate-900">
        <Carousel
          plugins={[plugin.current]}
          opts={{ loop: true, duration: 40 }}
          className="w-full h-full"
        >
          <CarouselContent className="h-full ml-0">
            {HERO_IMAGES.map((src, index) => (
              <CarouselItem key={index} className="pl-0 h-[90vh] min-h-[90vh] relative">
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url('${src}')` }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="absolute inset-0 z-10 bg-primary/70 mix-blend-multiply" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent" />

      <div className="container mx-auto px-4 relative z-20 text-white pointer-events-none">
        <div className="max-w-3xl pointer-events-auto">
          <Reveal>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
              Seu carro em boas mãos — <span className="text-secondary">limpo, cuidado</span> e
              pronto pra você.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl leading-relaxed">
              O melhor cuidado para seu carro e sua casa!, Duchas e Lavagens Completas Lavagem
              Técnica de Motor, Polimento e Cristalização.&nbsp;
              <span class="font-semibold">NOVIDADE</span>: Limpeza e Higienização de Sofás,&nbsp;
              <span class="font-semibold">Serviço Leva e Traz</span> na sua região. Agende agora e
              sinta a diferença de um serviço especializado.&nbsp;Aqui perto de você.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg rounded-full font-bold shadow-xl hover:shadow-secondary/20"
              >
                <a
                  href="https://wa.me/5511953275624"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('conversion', { button: 'hero_whatsapp' })}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Agendar pelo WhatsApp
                </a>
              </Button>

              <div className="flex flex-col gap-3">
                <Badge
                  variant="outline"
                  className="bg-black/30 text-white border-white/20 backdrop-blur-sm py-1.5 px-4 text-sm font-medium"
                >
                  <MapPin className="mr-2 h-4 w-4 text-secondary" />
                  Av. João Goulart, 387 - Jd. Mália I - São Paulo - SP
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-black/30 text-white border-white/20 backdrop-blur-sm py-1.5 px-4 text-sm font-medium"
                >
                  <Phone className="mr-2 h-4 w-4 text-secondary" />
                  (11) 95327-5624
                </Badge>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
