import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  Droplets,
  Users,
  Car,
  Tag,
  Building2,
  Activity,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'

const quickLinks = [
  {
    label: 'Clientes',
    description: 'Cadastre e gerencie clientes',
    to: '/admin/clientes',
    icon: Users,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    label: 'Veículos',
    description: 'Gerencie veículos cadastrados',
    to: '/admin/veiculos',
    icon: Car,
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    label: 'Serviços',
    description: 'Configure os serviços oferecidos',
    to: '/admin/servicos',
    icon: Tag,
    color: 'text-amber-600 bg-amber-50',
  },
  {
    label: 'Fornecedores',
    description: 'Gerencie fornecedores',
    to: '/admin/fornecedores',
    icon: Building2,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    label: 'Monitoramento',
    description: 'Acompanhe visitas ao site',
    to: '/admin/monitoramento',
    icon: Activity,
    color: 'text-rose-600 bg-rose-50',
  },
  {
    label: 'Empresa',
    description: 'Dados da empresa',
    to: '/admin/empresa',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50',
  },
]

export default function WelcomePage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Usuário'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bem-vindo, {firstName}!</h1>
            <p className="text-sm text-slate-500">
              Selecione uma opção abaixo para começar a gerenciar o sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${link.color}`}
                  >
                    <link.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{link.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{link.description}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-1 text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Acessar <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">
              Use o menu lateral para navegar entre todas as funcionalidades do sistema.
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              O botão de recolher/expandir menu e o botão de sair estão sempre disponíveis na barra
              lateral.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
