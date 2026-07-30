import pb from '@/lib/pocketbase/client'
import type { ServiceOrder, ServiceOrderItem } from './service-orders'

export type PeriodFilter = 'daily' | 'weekly' | 'monthly'

export type RevenueDataPoint = {
  label: string
  revenue: number
}

export type BestServiceData = {
  name: string
  quantity: number
  revenue: number
}

export type CustomerFlowDataPoint = {
  label: string
  count: number
}

export type DashboardData = {
  revenue: RevenueDataPoint[]
  bestServices: BestServiceData[]
  customerFlow: CustomerFlowDataPoint[]
  totalRevenue: number
  totalOrders: number
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getPeriodKey(date: Date, period: PeriodFilter): { key: string; label: string } {
  const d = new Date(date)
  switch (period) {
    case 'daily':
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      }
    case 'weekly': {
      const week = getISOWeek(d)
      return { key: `${d.getFullYear()}-W${week}`, label: `Sem ${week}` }
    }
    case 'monthly':
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      }
  }
}

function getStartDate(period: PeriodFilter): Date {
  const now = new Date()
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    case 'weekly':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
    case 'monthly':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  }
}

export async function fetchDashboardData(period: PeriodFilter): Promise<DashboardData> {
  const startDate = getStartDate(period)
  const now = new Date()

  const orders = await pb.collection('service_orders').getFullList<ServiceOrder>({
    sort: 'created',
  })

  const items = await pb.collection('service_order_items').getFullList<ServiceOrderItem>({
    expand: 'service_id',
  })

  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.created)
    return d >= startDate && d <= now
  })

  const revenueOrders = filteredOrders.filter(
    (o) => o.status === 'Pago' || o.status === 'Finalizado',
  )

  const revenueMap = new Map<string, { label: string; revenue: number; sortKey: string }>()
  let totalRevenue = 0

  for (const order of revenueOrders) {
    const { key, label } = getPeriodKey(new Date(order.created), period)
    const existing = revenueMap.get(key) || { label, revenue: 0, sortKey: key }
    const rev = order.amount_paid || 0
    existing.revenue += rev
    totalRevenue += rev
    revenueMap.set(key, existing)
  }

  const revenue = Array.from(revenueMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  const orderIds = new Set(filteredOrders.map((o) => o.id))
  const serviceMap = new Map<string, BestServiceData>()

  for (const item of items) {
    if (!orderIds.has(item.order_id) || !item.service_id) continue
    const name = item.expand?.service_id?.name || 'Serviço Removido'
    const id = item.service_id
    const existing = serviceMap.get(id) || { name, quantity: 0, revenue: 0 }
    existing.quantity += item.quantity || 0
    existing.revenue += item.total_price || 0
    serviceMap.set(id, existing)
  }

  const bestServices = Array.from(serviceMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  const flowMap = new Map<string, { label: string; count: number; sortKey: string }>()
  for (const order of filteredOrders) {
    const { key, label } = getPeriodKey(new Date(order.created), period)
    const existing = flowMap.get(key) || { label, count: 0, sortKey: key }
    existing.count += 1
    flowMap.set(key, existing)
  }

  const customerFlow = Array.from(flowMap.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey),
  )

  return { revenue, bestServices, customerFlow, totalRevenue, totalOrders: filteredOrders.length }
}
