import { Gift, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'

export function Promotions() {
  return (
    <section id="promocoes" className="py-24 bg-gradient-to-br from-primary to-blue-900 text-white">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Vantagens Exclusivas XUÁ</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Valorizamos quem escolhe cuidar do carro com a gente.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Promo 1 */}
          <Reveal delay={100}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 h-full flex flex-col hover:bg-white/15 transition-colors">
              <div className="bg-secondary/20 text-secondary w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Gift size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cartão Fidelidade</h3>
              <p className="text-slate-200 mb-6 flex-1 text-lg">
                Complete 10 lavagens e a{' '}
                <span className="text-secondary font-bold">11ª é por nossa conta!</span> Retire seu
                cartão físico na próxima visita e comece a pontuar.
              </p>
              <Button asChild variant="secondary" className="w-fit">
                <a href="https://wa.me/5511953275624">Quero Meu Cartão</a>
              </Button>
            </div>
          </Reveal>

          {/* Promo 2 */}
          <Reveal delay={200}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 h-full flex flex-col hover:bg-white/15 transition-colors">
              <div className="bg-accent/20 text-accent w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Indique um Amigo</h3>
              <p className="text-slate-200 mb-6 flex-1 text-lg">
                Seu amigo ganha 10% de desconto na primeira lavagem e você ganha{' '}
                <span className="font-bold text-accent">2 selos extras</span> no seu cartão
                fidelidade.
              </p>
              <Button
                asChild
                variant="outline"
                className="w-fit border-white text-white hover:bg-white hover:text-primary"
              >
                <a href="https://wa.me/5511953275624">Saber Mais</a>
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
