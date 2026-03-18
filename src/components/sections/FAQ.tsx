import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'
import { MessageCircle } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function FAQ() {
  const faqs = [
    {
      question: 'Vocês buscam o carro em qualquer endereço?',
      answer:
        'Atendemos num raio de até 2 km da nossa unidade na Av. João Goulart, 387 - Jd. Malia I - São Paulo - SP. O serviço de Leva e Traz é totalmente gratuito para endereços localizados nessa região. Para distâncias maiores, cobramos uma pequena taxa de deslocamento sob consulta.',
    },
    {
      question: 'Quanto tempo demora uma lavagem completa?',
      answer:
        'Uma lavagem completa geralmente leva entre 1 hora e 1h30m, dependendo do tamanho e do estado de sujeira do veículo. Sempre informamos a previsão de entrega na aprovação do serviço.',
    },
    {
      question: 'Quais são as formas de pagamento aceitas?',
      answer:
        'Aceitamos PIX, cartões de crédito e débito (Visa, Mastercard, Elo) e dinheiro em espécie. O pagamento pode ser feito no momento da devolução do veículo.',
    },
    {
      question: 'Como funciona o cartão fidelidade?',
      answer:
        'A cada lavagem (simples ou completa), você recebe um carimbo no seu cartão físico. Ao completar 10 carimbos, a 11ª lavagem do mesmo padrão é por nossa conta!',
    },
    {
      question: 'Vocês atendem em dias de chuva?',
      answer:
        'Sim! Nosso espaço é 100% coberto. Realizamos os serviços de lavagem interna e externa, polimento e cristalização normalmente, independentemente do clima externo.',
    },
  ]

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">Dúvidas Frequentes</h2>
            <p className="text-lg text-slate-600">
              Tudo o que você precisa saber sobre nossos serviços.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <Accordion
            type="single"
            collapsible
            className="w-full bg-white rounded-2xl shadow-sm p-4 md:p-8"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b-slate-100 last:border-0"
              >
                <AccordionTrigger className="text-left text-lg font-medium text-primary hover:text-secondary transition-colors py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-6 text-lg">Ainda tem dúvidas?</p>
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold shadow-md">
              <a
                href="https://wa.me/5511953275624"
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('click', { button: 'faq_contact' })}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar com a Equipe XUÁ
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
