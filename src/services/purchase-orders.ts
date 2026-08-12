import pb from '@/lib/pocketbase/client'
import type { Supplier } from './suppliers'
import type { Product } from './products'

export type PurchaseOrderStatus = 'Aberto' | 'Recebido' | 'Parcial' | 'Cancelado'

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  received_quantity: number
  unit_price: number
  total_price: number
  created: string
  updated: string
  expand?: {
    product_id?: Product
  }
}

export interface PurchaseOrder {
  id: string
  supplier_id: string
  order_number: string
  status: PurchaseOrderStatus | ''
  emission_date: string
  expected_date: string
  observation: string
  total_amount: number
  created_by: string
  created: string
  updated: string
  expand?: {
    supplier_id?: Supplier
    created_by?: { id: string; name: string }
  }
}

export const getPurchaseOrders = () =>
  pb.collection('purchase_orders').getFullList<PurchaseOrder>({
    sort: '-created',
    expand: 'supplier_id,created_by',
  })

export const getPurchaseOrder = (id: string) =>
  pb.collection('purchase_orders').getOne<PurchaseOrder>(id, {
    expand: 'supplier_id,created_by',
  })

export const createPurchaseOrder = (data: Record<string, unknown>) =>
  pb.collection('purchase_orders').create<PurchaseOrder>(data)

export const updatePurchaseOrder = (id: string, data: Record<string, unknown>) =>
  pb.collection('purchase_orders').update<PurchaseOrder>(id, data)

export const deletePurchaseOrder = (id: string) => pb.collection('purchase_orders').delete(id)

export const getPurchaseOrderItems = (orderId: string) =>
  pb.collection('purchase_order_items').getFullList<PurchaseOrderItem>({
    filter: `purchase_order_id = "${orderId}"`,
    expand: 'product_id',
  })

export const createPurchaseOrderItem = (data: Record<string, unknown>) =>
  pb.collection('purchase_order_items').create<PurchaseOrderItem>(data)

export const updatePurchaseOrderItem = (id: string, data: Record<string, unknown>) =>
  pb.collection('purchase_order_items').update<PurchaseOrderItem>(id, data)

export const deletePurchaseOrderItem = (id: string) =>
  pb.collection('purchase_order_items').delete(id)

export const receivePurchaseOrderItems = (
  orderId: string,
  items: { id: string; received_quantity: number }[],
  paymentMethodCode?: string,
) =>
  pb.send(`/backend/v1/purchase-orders/${orderId}/receive`, {
    method: 'POST',
    body: JSON.stringify({ items, payment_method_code: paymentMethodCode || '' }),
    headers: { 'Content-Type': 'application/json' },
  })
