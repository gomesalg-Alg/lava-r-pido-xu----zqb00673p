import { Droplets, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-slate-300 py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-secondary text-primary p-2 rounded-lg">
              <Droplets size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">XUÁ</span>
          </div>
          <p className="text-sm opacity-80 mb-6">
            Seu carro em boas mãos. Qualidade, rapidez e conveniência para você e seu veículo.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-secondary transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-secondary transition-colors">
              <Facebook size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Links Rápidos</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href="#servicos" className="hover:text-secondary transition-colors">
                Nossos Serviços
              </a>
            </li>
            <li>
              <a href="#precos" className="hover:text-secondary transition-colors">
                Tabela de Preços
              </a>
            </li>
            <li>
              <a href="#promocoes" className="hover:text-secondary transition-colors">
                Promoções
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-secondary transition-colors">
                Dúvidas Frequentes
              </a>
            </li>
          </ul>
        </div>

        <div className="col-span-1 md:col-span-2">
          <h4 className="text-white font-semibold mb-6">Contato & Localização</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={20} className="text-secondary shrink-0" />
              <span>
                Av. João Goulart, 387 - Jd. Malia I
                <br />
                São Paulo - SP
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={20} className="text-secondary shrink-0" />
              <span>(11) 95327-5624</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={20} className="text-secondary shrink-0" />
              <span>contato@lavarapidoxua.com.br</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-700 text-center text-sm opacity-60">
        &copy; {new Date().getFullYear()} Lava Rápido XUÁ. Todos os direitos reservados.
      </div>
    </footer>
  )
}
