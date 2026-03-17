import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, MessageSquare } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20">
      <div className="absolute inset-0 z-0 bg-[url('https://img.usecurling.com/p/1920/1080?q=clean%20shiny%20car')] bg-cover bg-center bg-no-repeat" />
      <div className="absolute inset-0 z-10 bg-primary/70 mix-blend-multiply" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />

      <div className="container mx-auto px-4 relative z-20 text-white">
        <div className="max-w-3xl">
          <Reveal>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight">
              Seu carro em boas mãos — <span className="text-secondary">limpo, cuidado</span> e
              pronto pra você.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl leading-relaxed">
              Lavagens simples, completas, polimento, cristalização e muito mais. Buscamos e
              entregamos seu veículo. Aqui perto de você.
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
                <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
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
                  Av. João Goulart, 387
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
