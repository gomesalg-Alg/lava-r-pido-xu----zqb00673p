import { Clock, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Reveal } from '@/components/Reveal'

export function BusinessHours() {
  return (
    <section id="horario" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
              Horário de Funcionamento
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Planeje sua visita. Estamos prontos para atender você e deixar seu carro impecável.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <Card className="max-w-4xl mx-auto border-2 border-slate-100 shadow-xl bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="bg-primary text-white p-10 flex flex-col items-center justify-center md:w-2/5 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10" />
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 relative z-10 border border-white/20">
                    <Clock size={40} className="text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 relative z-10 tracking-tight">
                    Lava Rápido&nbsp;<span>XUÁ</span>
                    <span>&nbsp;</span>
                  </h3>
                  <p className="text-primary-foreground/80 text-sm relative z-10 leading-relaxed max-w-[200px]">
                    Sempre à disposição para cuidar do seu veículo com máxima qualidade.
                  </p>
                </div>

                <div className="p-6 sm:p-8 md:p-10 md:w-3/5 flex flex-col justify-center bg-white overflow-hidden">
                  <div className="flex items-center gap-4 w-full">
                    <div className="bg-slate-50 p-3.5 rounded-xl text-primary shrink-0 shadow-sm border border-slate-100 hidden xl:block">
                      <CalendarDays size={26} />
                    </div>
                    <div className="flex-1 w-full flex flex-col gap-3 sm:gap-4 text-center xl:text-left">
                      <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-700">
                        Segunda-Feira à Sábado{' '}
                        <span className="text-primary font-bold block sm:inline mt-1 sm:mt-0">
                          08:00 às 18:00hrs
                        </span>
                      </p>
                      <p className="text-base sm:text-lg md:text-xl font-semibold text-slate-700">
                        Domingos e Feriados{' '}
                        <span className="text-primary font-bold block sm:inline mt-1 sm:mt-0">
                          08:00 às 13:00hrs
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
