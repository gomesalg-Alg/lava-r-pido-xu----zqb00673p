import { Droplet, Car, Sparkles, Sofa } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'
import { trackEvent } from '@/lib/analytics'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const promotions = [
  {
    title: 'Ducha com Pretinho',
    subtitle: 'Carro Porte Pequeno',
    price: 'R$ 20,00',
    icon: Droplet,
    description:
      'Lavagem externa rápida e eficiente, finalizada com aplicação de pretinho para renovar o visual dos pneus.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    shadow: 'shadow-blue-500/10',
  },
  {
    title: 'Ducha com Pretinho',
    subtitle: 'Carro de Porte Grande',
    price: 'R$ 25,00',
    icon: Car,
    description:
      'Cuidado ideal para SUVs e caminhonetes. Ducha externa completa com pneus limpos e brilhantes.',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-400/20',
    shadow: 'shadow-indigo-500/10',
  },
  {
    title: 'Polimento',
    subtitle: 'Brilho e Proteção',
    price: 'Sob Consulta',
    icon: Sparkles,
    description:
      'Restauração da pintura removendo riscos e imperfeições. Garanta um brilho espelhado e maior proteção.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    shadow: 'shadow-yellow-500/10',
  },
  {
    title: 'Higienização do Sofá',
    subtitle: 'Limpeza Profunda',
    price: 'Sob Consulta',
    icon: Sofa,
    description:
      'Removemos manchas, ácaros e sujeiras profundas. Traga conforto, saúde e beleza de volta para o seu lar.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/20',
    shadow: 'shadow-emerald-500/10',
  },
]

export function Promotions() {
  return (
    <section
      id="promocoes"
      className="py-24 bg-gradient-to-br from-primary to-blue-900 text-white overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Serviços em&nbsp;<span>Promoção</span>
              <span>&nbsp;</span>
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg md:text-xl text-slate-200 font-medium">
                Escolher o Lava Rápido XUÁ significa garantir o melhor cuidado para o seu veículo e
                estofados.
              </p>
              <p className="text-base text-slate-300">
                Utilizamos produtos de alta qualidade, aplicados por nossa equipe especializada com
                dedicação e atenção aos mínimos detalhes, entregando resultados impecáveis e
                proteção duradoura.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="max-w-6xl mx-auto px-4 sm:px-12">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 md:-ml-6">
                {promotions.map((promo, index) => {
                  const Icon = promo.icon
                  return (
                    <CarouselItem key={index} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                      <div
                        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 h-full flex flex-col hover:bg-white/15 transition-colors shadow-lg ${promo.shadow}`}
                      >
                        <div
                          className={`${promo.bgColor} ${promo.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}
                        >
                          <Icon size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{promo.title}</h3>
                        <span className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-wider block">
                          {promo.subtitle}
                        </span>
                        <div className="mb-6 text-2xl font-black text-white bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/10">
                          {promo.price}
                        </div>
                        <p className="text-slate-200 mb-8 flex-1 text-base leading-relaxed">
                          {promo.description}
                        </p>
                        <Button
                          asChild
                          variant="secondary"
                          className="w-full mt-auto font-semibold"
                        >
                          <a
                            href="https://wa.me/5511953275624"
                            target="_blank"
                            rel="noreferrer"
                            onClick={() =>
                              trackEvent('click', { button: 'promo_service', service: promo.title })
                            }
                          >
                            Agendar Agora
                          </a>
                        </Button>
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <div className="hidden sm:block">
                <CarouselPrevious className="hidden sm:flex bg-white/10 hover:bg-white text-white hover:text-primary border-white/20 -left-4 lg:-left-12 h-12 w-12" />
                <CarouselNext className="hidden sm:flex bg-white/10 hover:bg-white text-white hover:text-primary border-white/20 -right-4 lg:-right-12 h-12 w-12" />
              </div>
            </Carousel>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
