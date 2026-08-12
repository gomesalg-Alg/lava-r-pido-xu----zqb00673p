import pb from '@/lib/pocketbase/client'
import type { ServiceOrder, ServiceOrderItem } from './service-orders'
import type { OrderPayment } from './order-payments'
import type { Product } from './products'
import type { AccountsPayable } from './accounts-payable'
import type { AccountsReceivable } from './accounts-receivable'

export type ExecPeriod = 'today' | '7days' | '30days' | 'month'

export interface ExecDashboardData {
  todayRevenue: number
  todayOSCount: number
  averageTicket: number
  newCustomersCount: number
  osVolume: { label: string; count: number }[]
  paymentMethodDist: { method: string; count: number; amount: number; percentage: number }[]
  osStatusDist: { status: string; count: number }[]
  topServices: { name: string; quantity: number; revenue: number }[]
  vehiclesByType: { type: string; count: number }[]
  vehiclesByUse: { uso: string; count: number }[]
  operatorPerformance: { name: string; itemCount: number; revenue: number }[]
  lowStockProducts: { id: string; name: string; stock: number }[]
  upcomingPayables: {
    id: string
    supplier: string
    description: string
    dueDate: string
    amount: number
  }[]
  overdueReceivables: {
    id: string
    customer: string
    description: string
    dueDate: string
    amount: number
  }[]
}

const LOW_STOCK = 5
const UPCOMING_DAYS = 7

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isToday(s: string): boolean {
  if (!s) return false
  const d = new Date(s)
  const n = new Date()
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  )
}

function getDatePart(s: string): string {
  return s ? s.split('T')[0].split(' ')[0] : ''
}

function periodStart(period: ExecPeriod): Date {
  const n = new Date()
  switch (period) {
    case 'today':
      return new Date(n.getFullYear(), n.getMonth(), n.getDate())
    case '7days':
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() - 6)
    case '30days':
      return new Date(n.getFullYear(), n.getMonth(), n.getDate() - 29)
    case 'month':
      return new Date(n.getFullYear(), n.getMonth(), 1)
  }
}

export async function fetchExecDashboardData(period: ExecPeriod): Promise<ExecDashboardData> {
  const now = new Date()
  const ps = dateStr(periodStart(period))
  const today = dateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
  const future = dateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + UPCOMING_DAYS))

  const [orders, payments, customers, vehicles, products, items, payables, receivables] =
    await Promise.all([
      pb.collection('service_orders').getFullList<ServiceOrder>({
        filter: `created >= "${ps} 00:00:00"`,
        sort: 'created',
        expand: 'customer_id,vehicle_id',
      }),
      pb
        .collection('order_payments')
        .getFullList<OrderPayment>({ filter: `created >= "${ps} 00:00:00"`, sort: 'created' }),
      pb.collection('customers').getFullList({ filter: `created >= "${ps} 00:00:00"` }),
      pb.collection('vehicles').getFullList<Record<string, any>>(),
      pb.collection('products').getFullList<Product>({ sort: 'stock_quantity' }),
      pb
        .collection('service_order_items')
        .getFullList<ServiceOrderItem>({ expand: 'service_id,operator_id' }),
      pb.collection('accounts_payable').getFullList<AccountsPayable>({
        filter: `status = "Pendente" && due_date <= "${future}"`,
        expand: 'supplier_id',
        sort: 'due_date',
      }),
      pb.collection('accounts_receivable').getFullList<AccountsReceivable>({
        filter: `status = "Pendente" && due_date < "${today}"`,
        expand: 'customer_id',
        sort: 'due_date',
      }),
    ])

  const todayRevenue = payments
    .filter((p) => isToday(p.created))
    .reduce((s, p) => s + (p.amount || 0), 0)
  const todayOSCount = orders.filter((o) => isToday(o.entry_at || o.created)).length
  const averageTicket = todayOSCount > 0 ? todayRevenue / todayOSCount : 0

  const volDays = period === '30days' ? 30 : 7
  const osVolume = Array.from({ length: volDays }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (volDays - 1 - i))
    const ds = dateStr(d)
    const count = orders.filter((o) => getDatePart(o.entry_at || o.created) === ds).length
    return {
      label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      count,
    }
  })

  const methodMap = new Map<string, { count: number; amount: number }>()
  for (const p of payments) {
    const m = p.method || '—'
    const e = methodMap.get(m) || { count: 0, amount: 0 }
    e.count++
    e.amount += p.amount || 0
    methodMap.set(m, e)
  }
  const totalP = payments.length || 1
  const paymentMethodDist = Array.from(methodMap.entries())
    .map(([method, v]) => ({
      method,
      count: v.count,
      amount: v.amount,
      percentage: (v.count / totalP) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  const statusMap = new Map<string, number>()
  for (const o of orders) {
    const s = o.status || 'Em Andamento'
    statusMap.set(s, (statusMap.get(s) || 0) + 1)
  }
  const osStatusDist = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  const orderIds = new Set(orders.map((o) => o.id))
  const periodItems = items.filter((i) => orderIds.has(i.order_id))
  const svcMap = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const i of periodItems) {
    if (!i.service_id) continue
    const name = i.expand?.service_id?.name || 'Removido'
    const e = svcMap.get(i.service_id) || { name, quantity: 0, revenue: 0 }
    e.quantity += i.quantity || 0
    e.revenue += i.total_price || 0
    svcMap.set(i.service_id, e)
  }
  const topServices = Array.from(svcMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const typeMap = new Map<string, number>()
  const usoMap = new Map<string, number>()
  for (const v of vehicles) {
    const t = v.type || 'Outros'
    typeMap.set(t, (typeMap.get(t) || 0) + 1)
    const u = v.uso || 'Passeio'
    usoMap.set(u, (usoMap.get(u) || 0) + 1)
  }
  const vehiclesByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }))
  const vehiclesByUse = Array.from(usoMap.entries()).map(([uso, count]) => ({ uso, count }))

  const opMap = new Map<string, { name: string; itemCount: number; revenue: number }>()
  for (const i of periodItems) {
    if (!i.operator_id) continue
    const name = i.expand?.operator_id?.name || 'Removido'
    const e = opMap.get(i.operator_id) || { name, itemCount: 0, revenue: 0 }
    e.itemCount++
    e.revenue += i.total_price || 0
    opMap.set(i.operator_id, e)
  }
  const operatorPerformance = Array.from(opMap.values()).sort((a, b) => b.revenue - a.revenue)

  const lowStockProducts = products
    .filter((p) => (p.stock_quantity || 0) <= LOW_STOCK)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock_quantity || 0 }))
  const upcomingPayables = payables.map((p) => ({
    id: p.id,
    supplier: p.expand?.supplier_id?.name || '—',
    description: p.description || '—',
    dueDate: p.due_date || '',
    amount: p.amount || 0,
  }))
  const overdueReceivables = receivables.map((r) => ({
    id: r.id,
    customer: r.expand?.customer_id?.name || '—',
    description: r.description || '—',
    dueDate: r.due_date || '',
    amount: r.amount || 0,
  }))

  return {
    todayRevenue,
    todayOSCount,
    averageTicket,
    newCustomersCount: customers.length,
    osVolume,
    paymentMethodDist,
    osStatusDist,
    topServices,
    vehiclesByType,
    vehiclesByUse,
    operatorPerformance,
    lowStockProducts,
    upcomingPayables,
    overdueReceivables,
  }
}
