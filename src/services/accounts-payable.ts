import pb from '@/lib/pocketbase/client'
import type { Supplier } from './suppliers'
import type { BankAccount } from './bank-accounts'

export type AccountsPayableStatus = 'Pendente' | 'Pago' | 'Cancelado'

export interface AccountsPayable {
  id: string
  supplier_id: string | null
  description: string
  amount: number
  due_date: string
  status: AccountsPayableStatus | ''
  payment_method: string
  paid_at: string
  bank_account_id: string | null
  discount_amount: number | null
  surcharge_amount: number | null
  created: string
  updated: string
  expand?: {
    supplier_id?: Supplier
    bank_account_id?: BankAccount
  }
}

export const getAccountsPayable = () =>
  pb.collection('accounts_payable').getFullList<AccountsPayable>({
    sort: '-created',
    expand: 'supplier_id,bank_account_id',
  })

export const createAccountsPayable = (data: Record<string, unknown>) =>
  pb.collection('accounts_payable').create<AccountsPayable>(data)

export const updateAccountsPayable = (id: string, data: Record<string, unknown>) =>
  pb.collection('accounts_payable').update<AccountsPayable>(id, data)

export const deleteAccountsPayable = (id: string) => pb.collection('accounts_payable').delete(id)
