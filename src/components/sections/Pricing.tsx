import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Card, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'
import { trackEvent } from '@/lib/analytics'
import { getServices, type Service } from '@/services/services'
import { useRealtime } from '@/hooks/use-realtime'

export function Pricing() {
  const [services, setServices] = useState<Service[]>([])

  const loadData = async () => {
    try {
      const data = await getServices()
      setServices(data)
    } catch (e) {
      console.error('Failed to load services:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('services', () => {
    loadData()
  })

  return (
    <section id="precos" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
              Preços claros, sem surpresa
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Valores justos para um serviço de excelência. Conheça nossa tabela de serviços.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 50}>
              <Card className="flex flex-col h-full bg-white border-2 border-secondary shadow-xl">
                <CardHeader className="text-center pb-8 pt-10 flex-1 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-primary mb-2">{service.name}</h3>
                  {service.description ? (
                    <p className="text-slate-500 mb-4 min-h-[40px]">{service.description}</p>
                  ) : (
                    <div className="mb-4 min-h-[40px]" />
                  )}

                  <div className="flex flex-col items-center mt-auto">
                    {service.is_starting_price && (
                      <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">
                        a partir de
                      </span>
                    )}
                    <div className="flex items-baseline justify-center gap-1">
                      {service.price > 0 ? (
                        <>
                          <span className="text-2xl font-bold text-slate-400">R$</span>
                          <span className="text-6xl font-extrabold text-primary">
                            {service.price.toFixed(2).replace('.', ',')}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-extrabold text-primary mt-2">Consulte</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="pb-8 pt-4 mt-auto">
                  <Button asChild className="w-full h-14 text-lg font-bold" variant="secondary">
                    <a
                      href="https://wa.me/5511953275624"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackEvent('click', { button: `pricing_${service.id}` })}
                    >
                      Agendar
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="max-w-4xl mx-auto bg-white border-2 border-primary/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-lg mb-16">
            <div className="bg-primary text-white p-4 rounded-full shrink-0">
              <Info size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-bold text-slate-800 mb-2">Informação Importante</h4>
              <p className="text-slate-600 text-lg">
                Atendemos com hora marcada e residencial. Avaliação de serviços no local. Agende seu
                horário com antecedência para garantir o melhor serviço no conforto da sua casa.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <div className="flex flex-col items-center mt-12 gap-6">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold">
              <a
                href="https://wa.me/5511953275624"
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('click', { button: 'pricing_whatsapp_all' })}
              >
                Tirar Dúvidas no WhatsApp
              </a>
            </Button>
            <p className="text-center text-slate-500 text-sm max-w-2xl mx-auto">
              * Nota: Serviços especializados como Polimento, Cristalização e Higienização de Bancos
              estão sujeitos a avaliação prévia do veículo para orçamento exato.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
