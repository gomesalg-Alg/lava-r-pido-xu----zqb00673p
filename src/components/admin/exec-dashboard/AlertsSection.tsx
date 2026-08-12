import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateOnlyBR } from '@/lib/format'
import type { ExecDashboardData } from '@/services/executive-dashboard'
import { Package, ReceiptText, Receipt } from 'lucide-react'

interface AlertItemProps {
  title: string
  subtitle: string
  right: string
  rightSub?: string
}

function AlertItem({ title, subtitle, right, rightSub }: AlertItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-800">{right}</p>
        {rightSub && <p className="text-xs text-slate-400">{rightSub}</p>}
      </div>
    </div>
  )
}

function EmptyMsg({ msg }: { msg: string }) {
  return <p className="text-sm text-slate-400 text-center py-4">{msg}</p>
}

export function AlertsSection({
  data,
  loading,
}: {
  data: ExecDashboardData | null
  loading: boolean
}) {
  if (loading && !data) return <Skeleton className="h-[200px] w-full" />
  if (!data) return null

  const cards = [
    {
      icon: <Package className="w-5 h-5 text-orange-600" />,
      title: 'Estoque Baixo',
      items: data.lowStockProducts,
      empty: 'Nenhum produto com estoque baixo',
      render: (item: { id: string; name: string; stock: number }) => (
        <AlertItem
          key={item.id}
          title={item.name}
          subtitle={`Estoque atual`}
          right={`${item.stock} un`}
        />
      ),
    },
    {
      icon: <ReceiptText className="w-5 h-5 text-red-600" />,
      title: 'Contas a Pagar Vencendo',
      items: data.upcomingPayables,
      empty: 'Nenhuma conta a pagar próxima',
      render: (item: {
        id: string
        supplier: string
        description: string
        dueDate: string
        amount: number
      }) => (
        <AlertItem
          key={item.id}
          title={item.supplier}
          subtitle={item.description}
          right={formatCurrency(item.amount)}
          rightSub={formatDateOnlyBR(item.dueDate)}
        />
      ),
    },
    {
      icon: <Receipt className="w-5 h-5 text-amber-600" />,
      title: 'Contas a Receber Atrasadas',
      items: data.overdueReceivables,
      empty: 'Nenhuma conta a receber atrasada',
      render: (item: {
        id: string
        customer: string
        description: string
        dueDate: string
        amount: number
      }) => (
        <AlertItem
          key={item.id}
          title={item.customer}
          subtitle={item.description}
          right={formatCurrency(item.amount)}
          rightSub={formatDateOnlyBR(item.dueDate)}
        />
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {c.icon}
              {c.title}
              {c.items.length > 0 && (
                <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {c.items.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {c.items.length > 0 ? c.items.map(c.render) : <EmptyMsg msg={c.empty} />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
