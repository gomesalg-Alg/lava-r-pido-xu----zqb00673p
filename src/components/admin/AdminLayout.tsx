import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import {
  Droplets,
  Menu,
  LogOut,
  ChevronDown,
  ClipboardList,
  Users,
  Truck,
  Car,
  Tag,
  BarChart3,
  Activity,
  Settings,
  Building2,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Wrench,
  SlidersHorizontal,
  Wallet,
  Package,
  ShoppingCart,
} from 'lucide-react'

interface MenuItem {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

interface MenuGroup {
  label: string
  icon: ComponentType<{ className?: string }>
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: 'INÍCIO',
    icon: LayoutDashboard,
    items: [{ label: 'Painel', to: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'CADASTRO',
    icon: ClipboardList,
    items: [
      { label: 'Serviços', to: '/admin/servicos', icon: Tag },
      { label: 'Produtos', to: '/admin/produtos', icon: Package },
      { label: 'Clientes', to: '/admin/clientes', icon: Users },
      { label: 'Veículos', to: '/admin/veiculos', icon: Car },
      { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck },
      { label: 'Plano de Contas', to: '/admin/plano-contas', icon: Wallet },
    ],
  },
  {
    label: 'OPERAÇÕES',
    icon: ShoppingCart,
    items: [
      { label: 'Frente de Caixa', to: '/admin/frente-caixa', icon: ShoppingCart },
      { label: 'Ordens de Serviço', to: '/admin/ordem-servico', icon: Wrench },
    ],
  },
  {
    label: 'RELATÓRIO',
    icon: BarChart3,
    items: [{ label: 'Monitoramento', to: '/admin/monitoramento', icon: Activity }],
  },
  {
    label: 'CONFIGURAÇÕES',
    icon: Settings,
    items: [
      { label: 'Empresa', to: '/admin/empresa', icon: Building2 },
      { label: 'Usuários', to: '/admin/usuarios', icon: User },
      { label: 'Configuração de Ambiente', to: '/admin/ambiente', icon: SlidersHorizontal },
    ],
  },
]

function BrandHeader({ isMini }: { isMini?: boolean }) {
  return (
    <div
      className={cn(
        'h-16 flex items-center border-b border-slate-800 shrink-0',
        isMini ? 'px-0 justify-center' : 'px-6 justify-start',
      )}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Droplets className="text-blue-400 shrink-0" size={28} />
        {!isMini && (
          <div className="leading-tight whitespace-nowrap">
            <p className="font-bold text-sm text-white">Lava Rápido</p>
            <p className="font-bold text-sm text-blue-400">XUÁ</p>
          </div>
        )}
      </div>
    </div>
  )
}

function LogoutButton({ onClick, isMini }: { onClick: () => void; isMini?: boolean }) {
  if (isMini) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
            onClick={onClick}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Sair</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-1"
      onClick={onClick}
    >
      <LogOut className="w-4 h-4 mr-2" /> Sair
    </Button>
  )
}

function SidebarContent({
  onNavigate,
  isMini,
  onExpand,
}: {
  onNavigate?: () => void
  isMini?: boolean
  onExpand?: () => void
}) {
  const location = useLocation()

  // Initialize with all menus collapsed, except the one containing the active route
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const state = new Set(menuGroups.map((g) => g.label))
    for (const group of menuGroups) {
      const hasActive = group.items.some((item) =>
        item.to === '/admin'
          ? location.pathname === '/admin'
          : location.pathname.startsWith(item.to),
      )
      if (hasActive) state.delete(group.label)
    }
    return state
  })

  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)

  const toggle = (label: string) => {
    if (isMini && onExpand) {
      onExpand()
      setCollapsed((prev) => {
        const next = new Set(prev)
        next.delete(label)
        return next
      })
      return
    }

    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <nav className="flex flex-col gap-1 p-3">
      {menuGroups.map((group) => {
        const isCollapsed = collapsed.has(group.label)

        return (
          <div key={group.label} className="mb-1">
            {isMini ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggle(group.label)}
                    className="flex items-center justify-center w-10 h-10 mx-auto rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    <group.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{group.label}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold uppercase text-slate-400 hover:text-slate-200 transition-colors rounded-md hover:bg-slate-800/50"
              >
                <group.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left tracking-wide">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isCollapsed && 'rotate-180',
                  )}
                />
              </button>
            )}

            {!isCollapsed && !isMini && (
              <div className="flex flex-col gap-0.5 mt-1 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 pl-10 pr-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive(item.to)
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMini, setIsMini] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          'hidden md:flex flex-col bg-slate-900 shrink-0 transition-all duration-300',
          isMini ? 'w-16' : 'w-64',
        )}
      >
        <BrandHeader isMini={isMini} />
        <div className="flex-1 overflow-y-auto">
          <SidebarContent isMini={isMini} onExpand={() => setIsMini(false)} />
        </div>
        <div
          className={cn(
            'p-3 border-t border-slate-800 flex gap-2 transition-all',
            isMini ? 'flex-col items-center' : 'items-center',
          )}
        >
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'text-slate-400 hover:text-white hover:bg-slate-800 shrink-0',
                  isMini ? 'w-10 h-10' : '',
                )}
                onClick={() => setIsMini(!isMini)}
              >
                {isMini ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isMini ? 'Expandir Menu' : 'Recolher Menu'}
            </TooltipContent>
          </Tooltip>
          <LogoutButton onClick={handleSignOut} isMini={isMini} />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col bg-slate-900 border-slate-800">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">Navegue pelas páginas do sistema.</SheetDescription>
          <BrandHeader />
          <div className="flex-1 overflow-y-auto">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="p-3 border-t border-slate-800 flex gap-2 items-center">
            <LogoutButton onClick={handleSignOut} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 p-4 bg-white border-b border-slate-200">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg text-slate-800">Lava Rápido XUÁ</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
