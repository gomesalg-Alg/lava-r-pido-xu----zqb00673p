import pb from '@/lib/pocketbase/client'
import type { Customer } from './customers'

export type VendaAvulsaItem = {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export type VendaAvulsa = {
  id: string
  customer_id: string
  items: VendaAvulsaItem[] | string
  total_amount: number
  payment_method: string
  change_amount: number
  created: string
  updated: string
  expand?: {
    customer_id?: Customer
  }
}

export const createVendaAvulsa = (data: Record<string, unknown>) =>
  pb.collection('vendas_avulsas').create<VendaAvulsa>(data)

export const getVendaAvulsa = (id: string) =>
  pb.collection('vendas_avulsas').getOne<VendaAvulsa>(id)

export const deleteVendaAvulsa = (id: string) => pb.collection('vendas_avulsas').delete(id)
