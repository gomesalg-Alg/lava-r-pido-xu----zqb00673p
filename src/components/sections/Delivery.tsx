import { CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'

export function Delivery() {
  const benefits = [
    'Buscamos no seu endereço',
    'Devolvemos o carro impecável',
    'Grátis para raio de até 2km',
    'Motoristas qualificados',
  ]

  return (
    <section className="bg-primary text-white py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Sem tempo para ir até nós?{' '}
                <span className="text-secondary">A gente vai até você.</span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Conheça nosso sistema Leva e Traz. Você não precisa interromper sua rotina para ter
                um carro limpo.
              </p>

              <ul className="space-y-4 mb-10">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-lg font-medium">
                    <CheckCircle2 className="text-secondary shrink-0" size={24} />
                    {benefit}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant="secondary"
                size="lg"
                className="h-14 px-8 text-lg rounded-full font-bold shadow-lg"
              >
                <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
                  <MapPin className="mr-2" />
                  Agendar Coleta pelo WhatsApp
                </a>
              </Button>
            </Reveal>
          </div>

          <div className="lg:w-1/2 w-full">
            <Reveal delay={200} className="relative">
              <div className="absolute inset-0 bg-secondary/20 rounded-2xl blur-3xl transform -rotate-6 scale-105" />
              <img
                src="https://img.usecurling.com/p/800/600?q=city%20map%20route"
                alt="Mapa da área de cobertura"
                className="relative z-10 rounded-2xl shadow-2xl border-4 border-white/10 w-full object-cover aspect-video"
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-primary p-4 rounded-full shadow-xl border-4 border-white animate-pulse">
                <MapPin className="text-secondary w-8 h-8" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
