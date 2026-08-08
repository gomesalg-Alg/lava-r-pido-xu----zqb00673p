import pb from '@/lib/pocketbase/client'

export interface BankMapAccount {
  id: string
  name: string
  tradingName: string
}

export interface BankMapReceita {
  id: string
  description: string
  customerName: string
  amount: number
  dueDate: string
  receivedAt: string
  paymentMethod: string
  status: string
  bankAccountId: string
  bankAccountName: string
}

export interface BankMapDespesa {
  id: string
  description: string
  supplierName: string
  amount: number
  dueDate: string
  paidAt: string
  paymentMethod: string
  status: string
  bankAccountId: string
  bankAccountName: string
}

export interface BankMapAccountBreakdown {
  accountId: string
  accountName: string
  tradingName: string
  totalReceitas: number
  totalDespesas: number
  saldo: number
  receitasCount: number
  despesasCount: number
}

export interface BankMapSummary {
  totalReceitas: number
  totalDespesas: number
  saldo: number
}

export interface BankMapData {
  month: string
  bankAccountId: string
  statusFilter: string
  bankAccounts: BankMapAccount[]
  summary: BankMapSummary
  accountBreakdown: BankMapAccountBreakdown[]
  receitas: BankMapReceita[]
  despesas: BankMapDespesa[]
}

export async function fetchBankMapData(params: {
  month: string
  bankAccountId?: string
  status?: string
}): Promise<BankMapData> {
  const searchParams = new URLSearchParams()
  searchParams.set('month', params.month)
  if (params.bankAccountId) searchParams.set('bankAccountId', params.bankAccountId)
  if (params.status) searchParams.set('status', params.status)
  return pb.send(`/backend/v1/bank-map?${searchParams.toString()}`, { method: 'GET' })
}
