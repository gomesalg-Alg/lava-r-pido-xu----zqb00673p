import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { DollarSign, ClipboardList, TrendingUp, UserPlus } from 'lucide-react'

interface Props {
  todayRevenue: number
  todayOSCount: number
  averageTicket: number
  newCustomersCount: number
  loading: boolean
}

export function SummaryCards({
  todayRevenue,
  todayOSCount,
  averageTicket,
  newCustomersCount,
  loading,
}: Props) {
  const cards = [
    {
      label: 'Receita do Dia',
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'OS do Dia',
      value: todayOSCount.toLocaleString('pt-BR'),
      icon: ClipboardList,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(averageTicket),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Clientes Novos',
      value: newCustomersCount.toLocaleString('pt-BR'),
      icon: UserPlus,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-full ${c.bg} shrink-0`}>
              <c.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500 truncate">{c.label}</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900">
                {loading ? '...' : c.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
