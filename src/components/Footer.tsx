import { Droplets, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-slate-300 py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-secondary text-primary p-2 rounded-lg">
              <Droplets size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Lava Rápido XUÁ</span>
          </div>
          <p className="text-sm opacity-80 mb-6 leading-relaxed">
            Seu carro em boas mãos. Qualidade, rapidez e conveniência para você e seu veículo.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-secondary transition-colors" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-secondary transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6 text-lg">Links Rápidos</h4>
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
              <a href="#horario" className="hover:text-secondary transition-colors">
                Horário de Funcionamento
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-secondary transition-colors">
                Dúvidas Frequentes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6 text-lg">Horário de Funcionamento</h4>
          <div className="w-full overflow-hidden">
            <div className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-2">
              <p className="text-[11px] min-[380px]:text-xs sm:text-sm md:text-xs lg:text-sm text-slate-300 whitespace-nowrap">
                <span className="font-medium">Segunda-Feira à Sábado</span>{' '}
                <span className="text-white font-bold">08:00 às 23:00hrs</span>
                <span className="mx-2 text-white/20">|</span>
                <span className="font-medium">Domingos e Feriados</span>{' '}
                <span className="text-white font-bold">08:00 às 13:00hrs</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6 text-lg">Contato & Localização</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={20} className="text-secondary shrink-0 mt-0.5" />
              <span className="leading-relaxed">
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
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-center text-sm opacity-60 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>
          &copy; {new Date().getFullYear()} Lava Rápido XUÁ. Todos os direitos reservados.
        </span>
      </div>
    </footer>
  )
}
