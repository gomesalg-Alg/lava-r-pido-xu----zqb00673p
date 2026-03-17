import { useState, useEffect } from 'react'
import { Menu, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { name: 'Serviços', href: '#servicos' },
  { name: 'Preços', href: '#precos' },
  { name: 'Promoções', href: '#promocoes' },
  { name: 'Como Funciona', href: '#como-funciona' },
  { name: 'FAQ', href: '#faq' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5',
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <div className="bg-primary text-white p-2 rounded-lg group-hover:bg-secondary transition-colors">
            <Droplets size={24} />
          </div>
          <span
            className={cn(
              'text-2xl font-bold tracking-tight',
              isScrolled ? 'text-primary' : 'text-white',
            )}
          >
            XUÁ
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={cn(
                'text-sm font-medium hover:text-secondary transition-colors',
                isScrolled ? 'text-slate-600' : 'text-slate-200',
              )}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button
            asChild
            variant="secondary"
            className="font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
              Agendar Agora
            </a>
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={isScrolled ? 'text-primary' : 'text-white'}
              >
                <Menu size={28} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="text-left mb-6 text-primary">Menu de Navegação</SheetTitle>
              <nav className="flex flex-col gap-6 mt-8">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-slate-700 hover:text-secondary transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <Button asChild variant="secondary" className="w-full text-lg h-12">
                    <a href="https://wa.me/5511953275624" target="_blank" rel="noreferrer">
                      Agendar Agora
                    </a>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
