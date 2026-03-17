import { Star, CarFront, Map } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

export function SocialProof() {
  const items = [
    {
      icon: Star,
      text: 'Clientes satisfeitos na região.',
    },
    {
      icon: CarFront,
      text: 'Atendemos carros de todos os tamanhos.',
    },
    {
      icon: Map,
      text: 'Sistema leva e traz até 2 km.',
    },
  ]

  return (
    <section className="bg-secondary text-primary py-8 shadow-inner relative z-30 -mt-2">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-primary/20">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pt-4 md:pt-0 first:pt-0 md:px-6 first:pl-0 last:pr-0"
              >
                <div className="bg-primary text-secondary p-3 rounded-full shrink-0">
                  <item.icon size={24} />
                </div>
                <p className="font-bold text-lg leading-tight">{item.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
