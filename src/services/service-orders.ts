import pb from '@/lib/pocketbase/client'
import type { Customer } from './customers'
import type { Vehicle } from './vehicles'
import type { Company } from './company'

export type ServiceOrderStatus = 'Em Andamento' | 'Finalizado' | 'Orçamento' | 'Pago' | 'Cancelado'
export type PaymentMethod =
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'Pix'
  | 'Cortesia'
  | 'Outros'

export type ServiceOrder = {
  id: string
  ticket_number: number
  prisma_number: string
  customer_id: string
  vehicle_id: string
  emission_date: string
  entry_at: string
  exit_at: string
  photo: string
  status: ServiceOrderStatus | ''
  observation: string
  placa: string
  created: string
  updated: string
  created_by: string
  updated_by: string
  total_discount: number
  total_surcharge: number
  amount_paid: number
  expand?: {
    customer_id?: Customer
    vehicle_id?: Vehicle
    created_by?: { id: string; name: string }
    updated_by?: { id: string; name: string }
  }
}

export type ServiceOrderItem = {
  id: string
  order_id: string
  service_id: string
  operator_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  discount_reason: string
  surcharge_amount: number
  surcharge_reason: string
  total_price: number
  product_id: string
  expand?: {
    service_id?: { id: string; name: string; price: number }
    product_id?: { id: string; name: string; price: number }
    operator_id?: { id: string; name: string; email: string }
  }
}

export type CustomerVehicleSearchResult = {
  customer: Customer
  vehicle: Vehicle
}

export const getServiceOrders = () =>
  pb.collection('service_orders').getFullList<ServiceOrder>({
    sort: '-created',
    expand: 'customer_id,vehicle_id',
  })

export const getServiceOrder = (id: string) =>
  pb.collection('service_orders').getOne<ServiceOrder>(id, {
    expand: 'customer_id,vehicle_id,created_by,updated_by',
  })

export const getNextTicketNumber = async () => {
  const result = await pb.collection('service_orders').getList<ServiceOrder>(1, 1, {
    sort: '-ticket_number',
  })
  return result.items.length > 0 ? (result.items[0].ticket_number || 0) + 1 : 1
}

export const createServiceOrder = (data: Record<string, unknown>) =>
  pb.collection('service_orders').create<ServiceOrder>(data)

export const updateServiceOrder = (id: string, data: Record<string, unknown>) =>
  pb.collection('service_orders').update<ServiceOrder>(id, data)

export const deleteServiceOrder = (id: string) => pb.collection('service_orders').delete(id)

export const getServiceOrderItems = (orderId: string) =>
  pb.collection('service_order_items').getFullList<ServiceOrderItem>({
    filter: `order_id = "${orderId}"`,
    expand: 'service_id,product_id,operator_id',
  })

export const createServiceOrderItem = (data: Record<string, unknown>) =>
  pb.collection('service_order_items').create<ServiceOrderItem>(data)

export const updateServiceOrderItem = (id: string, data: Record<string, unknown>) =>
  pb.collection('service_order_items').update<ServiceOrderItem>(id, data)

export const deleteServiceOrderItem = (id: string) =>
  pb.collection('service_order_items').delete(id)

export type PublicServiceOrderData = {
  order: ServiceOrder
  items: ServiceOrderItem[]
  company: Company | null
}

export const getPublicServiceOrder = (id: string) =>
  pb.send(`/backend/v1/public/os/${id}`, { method: 'GET' }) as Promise<PublicServiceOrderData>

export const searchByPlacaOrCpf = async (query: string): Promise<CustomerVehicleSearchResult[]> => {
  const q = query.trim()
  if (!q) return []
  const digits = q.replace(/\D/g, '')
  const results: CustomerVehicleSearchResult[] = []
  const seen = new Set<string>()

  try {
    const parts = [`placa ~ "${q}"`]
    if (digits && digits !== q) parts.push(`placa ~ "${digits}"`)
    const vehicles = await pb.collection('vehicles').getFullList<Vehicle>({
      filter: parts.join(' || '),
      expand: 'customer_id',
    })
    for (const v of vehicles) {
      if (!seen.has(v.id) && v.expand?.customer_id) {
        seen.add(v.id)
        results.push({ customer: v.expand.customer_id as Customer, vehicle: v })
      }
    }
  } catch {
    /* ignore */
  }

  if (digits) {
    try {
      const parts = [`cpf ~ "${q}"`]
      if (digits !== q) parts.push(`cpf ~ "${digits}"`)
      const customers = await pb.collection('customers').getFullList<Customer>({
        filter: parts.join(' || '),
      })
      for (const c of customers) {
        const vehicles = await pb.collection('vehicles').getFullList<Vehicle>({
          filter: `customer_id = "${c.id}"`,
        })
        for (const v of vehicles) {
          if (!seen.has(v.id)) {
            seen.add(v.id)
            results.push({ customer: c, vehicle: v })
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return results
}

export const searchServiceOrdersByPlacaOrTicket = async (
  query: string,
): Promise<ServiceOrder[]> => {
  const q = query.trim()
  if (!q) return []
  const results: ServiceOrder[] = []
  const seen = new Set<string>()

  const digits = q.replace(/\D/g, '')
  if (digits) {
    try {
      const ticketNum = parseInt(digits, 10)
      const ticketResults = await pb.collection('service_orders').getFullList<ServiceOrder>({
        filter: `ticket_number = ${ticketNum} && status != 'Finalizado' && status != 'Pago' && status != 'Cancelado'`,
        expand: 'customer_id,vehicle_id',
        sort: '-created',
      })
      for (const o of ticketResults) {
        if (!seen.has(o.id)) {
          seen.add(o.id)
          results.push(o)
        }
      }
    } catch {
      /* ignore */
    }
  }

  try {
    const upperQ = q.toUpperCase()
    const parts = [`placa ~ "${upperQ}"`]
    const digitsOnly = q.replace(/\D/g, '')
    if (digitsOnly && digitsOnly !== upperQ) {
      parts.push(`placa ~ "${digitsOnly}"`)
    }
    const plateResults = await pb.collection('service_orders').getFullList<ServiceOrder>({
      filter: `(${parts.join(' || ')}) && status != 'Finalizado' && status != 'Pago' && status != 'Cancelado'`,
      expand: 'customer_id,vehicle_id',
      sort: '-created',
    })
    for (const o of plateResults) {
      if (!seen.has(o.id)) {
        seen.add(o.id)
        results.push(o)
      }
    }
  } catch {
    /* ignore */
  }

  return results
}
