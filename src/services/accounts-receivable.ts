import pb from '@/lib/pocketbase/client'
import type { Customer } from './customers'
import type { ServiceOrder } from './service-orders'
import type { VendaAvulsa } from './vendas-avulsas'
import type { BankAccount } from './bank-accounts'

export type AccountsReceivableStatus = 'Pendente' | 'Recebido' | 'Cancelado'

export interface AccountsReceivable {
  id: string
  customer_id: string
  order_id: string | null
  venda_avulsa_id: string | null
  description: string
  amount: number
  due_date: string
  status: AccountsReceivableStatus | ''
  payment_method: string
  received_at: string
  bank_account_id: string | null
  discount_amount: number | null
  surcharge_amount: number | null
  created: string
  updated: string
  expand?: {
    customer_id?: Customer
    order_id?: ServiceOrder
    venda_avulsa_id?: VendaAvulsa
    bank_account_id?: BankAccount
  }
}

export const getAccountsReceivable = () =>
  pb.collection('accounts_receivable').getFullList<AccountsReceivable>({
    sort: '-created',
    expand: 'customer_id,order_id,venda_avulsa_id,bank_account_id',
  })

export const createAccountsReceivable = (data: Record<string, unknown>) =>
  pb.collection('accounts_receivable').create<AccountsReceivable>(data)

export const updateAccountsReceivable = (id: string, data: Record<string, unknown>) =>
  pb.collection('accounts_receivable').update<AccountsReceivable>(id, data)

export const deleteAccountsReceivable = (id: string) =>
  pb.collection('accounts_receivable').delete(id)

export const getAccountsReceivableByOrder = async (orderId: string) => {
  const list = await pb.collection('accounts_receivable').getFullList<AccountsReceivable>({
    filter: `order_id = "${orderId}"`,
  })
  return list[0] || null
}

export const getAccountsReceivableByVendaAvulsa = async (vendaAvulsaId: string) => {
  const list = await pb.collection('accounts_receivable').getFullList<AccountsReceivable>({
    filter: `venda_avulsa_id = "${vendaAvulsaId}"`,
  })
  return list[0] || null
}
