import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, type ComponentType } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import {
  Activity,
  BarChart3,
  Settings,
  Users,
  Car,
  Building2,
  LayoutDashboard,
  Menu,
  LogOut,
  Wrench,
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
    label: 'Operações',
    icon: Activity,
    items: [
      { label: 'Serviços', to: '/admin', icon: Wrench },
      { label: 'Clientes', to: '/admin/clientes', icon: Users },
      { label: 'Veículos', to: '/admin/veiculos', icon: Car },
    ],
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    items: [{ label: 'Monitoramento', to: '/admin', icon: BarChart3 }],
  },
  {
    label: 'Configurações',
    icon: Settings,
    items: [
      { label: 'Painel', to: '/admin', icon: LayoutDashboard },
      { label: 'Empresa', to: '/admin/empresa', icon: Building2 },
      { label: 'Usuários', to: '/admin/usuarios', icon: Users },
    ],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to)

  return (
    <nav className="flex flex-col gap-6 p-4">
      {menuGroups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 px-3 mb-2">
            <group.icon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase">{group.label}</span>
          </div>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(item.to)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h1 className="font-bold text-lg text-slate-800">Lava Rápido XUÁ</h1>
          <p className="text-xs text-slate-400">Painel Administrativo</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
        <div className="p-4 border-t border-slate-200">
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h1 className="font-bold text-lg text-slate-800">Lava Rápido XUÁ</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="p-4 border-t border-slate-200">
            <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
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
