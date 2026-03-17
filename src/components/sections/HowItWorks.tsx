import { MessageSquare, Car, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

export function HowItWorks() {
  const steps = [
    {
      icon: MessageSquare,
      title: '1. Fale pelo WhatsApp',
      description: 'Mande uma mensagem escolhendo o serviço e o melhor horário para você.',
    },
    {
      icon: Car,
      title: '2. Buscamos seu veículo',
      description: 'Nossa equipe retira o carro no seu endereço com total segurança.',
    },
    {
      icon: ShieldCheck,
      title: '3. Devolvemos impecável',
      description: 'Seu carro retorna brilhando, higienizado e pronto para rodar.',
    },
  ]

  return (
    <section id="como-funciona" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">Como Funciona</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Três passos simples para deixar seu carro como novo, sem dor de cabeça.
            </p>
          </div>
        </Reveal>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-200 border-t-2 border-dashed border-slate-300 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <Reveal key={index} delay={index * 200}>
                <div className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-100 shadow-xl flex items-center justify-center mb-6 group-hover:border-secondary transition-colors duration-300">
                    <step.icon
                      size={40}
                      className="text-primary group-hover:text-secondary transition-colors duration-300"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-3">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
