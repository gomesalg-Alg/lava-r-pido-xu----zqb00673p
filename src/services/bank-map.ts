import pb from '@/lib/pocketbase/client'

export interface BankMapRow {
  accountId: string
  accountName: string
  accountCode: string
  values: Record<string, number>
  total: number
}

export interface BankMapData {
  months: string[]
  rows: BankMapRow[]
  columnTotals: Record<string, number>
  grandTotal: number
  received: Record<string, number>
  receivedTotal: number
}

export async function fetchBankMapData(
  startMonth?: string,
  endMonth?: string,
): Promise<BankMapData> {
  const params = new URLSearchParams()
  if (startMonth) params.set('startMonth', startMonth)
  if (endMonth) params.set('endMonth', endMonth)
  const qs = params.toString()
  const path = `/backend/v1/bank-map${qs ? '?' + qs : ''}`
  return pb.send(path, { method: 'GET' })
}
