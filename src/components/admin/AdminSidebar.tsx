import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Droplets, LayoutDashboard, Building2, Users, UserCheck, LogOut } from 'lucide-react'

const topItems = [{ label: 'Painel', path: '/admin', icon: LayoutDashboard, end: true }]

const groups = [
  {
    label: 'Cadastro',
    items: [
      { label: 'Empresa', path: '/admin/empresa', icon: Building2 },
      { label: 'Usuários', path: '/admin/usuarios', icon: Users },
      { label: 'Clientes', path: '/admin/clientes', icon: UserCheck },
    ],
  },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path)

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-slate-200">
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-200 shrink-0">
        <Droplets className="text-primary" size={28} />
        <div className="leading-tight">
          <p className="font-bold text-sm">Lava Rápido</p>
          <p className="font-bold text-sm text-primary">XUÁ</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          {topItems.map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              active={isActive(item.path, item.end)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {group.label}
            </p>
            {group.items.map((item) => (
              <SidebarLink
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-200 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>
    </div>
  )
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: { label: string; path: string; icon: any }
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </Link>
  )
}
