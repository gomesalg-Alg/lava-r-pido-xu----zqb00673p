import { Check } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/Reveal'

export function Pricing() {
  return (
    <section id="precos" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">
              Preços claros, sem surpresa
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Valores justos para um serviço de excelência. Escolha a categoria do seu veículo.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1 */}
          <Reveal delay={100}>
            <Card className="flex flex-col h-full bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-8 pt-10">
                <h3 className="text-2xl font-bold text-primary mb-2">Carro Pequeno</h3>
                <p className="text-slate-500 mb-6">Hatchbacks e compactos</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-slate-400">R$</span>
                  <span className="text-6xl font-extrabold text-primary">42</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">R$ 52 com cera líquida</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {[
                    'Lavagem externa completa',
                    'Aspiração interna',
                    'Limpeza de painel',
                    'Pretinho nos pneus',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <Check className="text-accent shrink-0" size={20} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pb-10 pt-4">
                <Button asChild className="w-full h-12 text-lg" variant="outline">
                  <a href="https://wa.me/5511953275624">Agendar Lavagem</a>
                </Button>
              </CardFooter>
            </Card>
          </Reveal>

          {/* Card 2 - Highlighted */}
          <Reveal delay={200}>
            <Card className="flex flex-col h-full bg-white border-2 border-secondary shadow-xl relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-secondary text-primary font-bold px-4 py-1 text-sm uppercase tracking-wider border-none">
                  Mais Procurado
                </Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-12">
                <h3 className="text-2xl font-bold text-primary mb-2">Carro Grande</h3>
                <p className="text-slate-500 mb-6">Sedans, SUVs e Caminhonetes</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-slate-400">R$</span>
                  <span className="text-6xl font-extrabold text-primary">49</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">R$ 59 com cera líquida</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  {[
                    'Lavagem externa completa',
                    'Aspiração interna profunda',
                    'Limpeza de painel e vidros',
                    'Pretinho nos pneus',
                    'Aromatizante interno',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <Check className="text-secondary shrink-0" size={20} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pb-10 pt-4">
                <Button asChild className="w-full h-14 text-lg font-bold" variant="secondary">
                  <a href="https://wa.me/5511953275624">Agendar Lavagem</a>
                </Button>
              </CardFooter>
            </Card>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <p className="text-center text-slate-500 mt-12 text-sm max-w-2xl mx-auto">
            * Nota: Serviços especializados como Polimento, Cristalização e Higienização de Bancos
            estão sujeitos a avaliação prévia do veículo para orçamento exato.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
