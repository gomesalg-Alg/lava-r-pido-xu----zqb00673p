import type { ServiceOrderItem } from '@/services/service-orders'

export type OrderTotals = {
  subtotal: number
  totalDiscount: number
  totalSurcharge: number
  grandTotal: number
}

export function calculateOrderTotals(items: ServiceOrderItem[]): OrderTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0),
    0,
  )
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount_amount || 0), 0)
  const totalSurcharge = items.reduce((sum, item) => sum + (item.surcharge_amount || 0), 0)
  const grandTotal = subtotal - totalDiscount + totalSurcharge
  return { subtotal, totalDiscount, totalSurcharge, grandTotal }
}
