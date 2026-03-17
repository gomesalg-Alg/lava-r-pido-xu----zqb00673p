import { Droplets, Sparkles, Wind, SprayCan, ShieldCheck, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'

const services = [
  {
    icon: Droplets,
    title: 'Lavagem Simples',
    description:
      'Ducha externa com shampoo automotivo neutro, secagem e limpeza básica de tapetes.',
  },
  {
    icon: Sparkles,
    title: 'Lavagem Completa',
    description:
      'Limpeza detalhada interna e externa, aspiração profunda, painel, vidros e aplicação de cera líquida.',
  },
  {
    icon: Wind,
    title: 'Higienização Interna',
    description: 'Limpeza profunda de bancos, teto e carpete, removendo manchas e odores.',
  },
  {
    icon: SprayCan,
    title: 'Polimento',
    description: 'Remoção de riscos superficiais e restauração do brilho original da pintura.',
  },
  {
    icon: ShieldCheck,
    title: 'Cristalização',
    description:
      'Aplicação de película protetora que garante brilho intenso e duradouro à pintura.',
  },
  {
    icon: Wrench,
    title: 'Limpeza de Motor',
    description: 'Lavagem técnica a seco do motor, protegendo componentes elétricos.',
  },
]

export function Services() {
  return (
    <section id="servicos" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
              Tudo que seu veículo precisa
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Em um só lugar, com produtos de alta qualidade e profissionais qualificados.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Reveal key={index} delay={index * 100}>
              <Card className="group h-full border-border hover:border-accent hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-slate-100 text-primary flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                    <service.icon size={28} />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-slate-600 leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div className="text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-white border-2 text-lg h-14 px-8"
            >
              <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
                Solicitar Orçamento Personalizado
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
