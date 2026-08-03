import pb from '@/lib/pocketbase/client'

export type AccountType = 'Corrente' | 'Poupança'

export interface BankAccount {
  id: string
  name: string
  trading_name?: string
  agency: string
  account_number: string
  account_type: AccountType
  is_active: boolean
  created: string
  updated: string
}

export const getBankAccounts = () =>
  pb.collection('bank_accounts').getFullList<BankAccount>({ sort: '-created' })

export const getActiveBankAccounts = () =>
  pb.collection('bank_accounts').getFullList<BankAccount>({
    sort: 'name',
    filter: 'is_active = true',
  })

export const getBankAccount = (id: string) => pb.collection('bank_accounts').getOne<BankAccount>(id)

export const createBankAccount = (data: Partial<BankAccount>) =>
  pb.collection('bank_accounts').create<BankAccount>(data)

export const updateBankAccount = (id: string, data: Partial<BankAccount>) =>
  pb.collection('bank_accounts').update<BankAccount>(id, data)

export const deleteBankAccount = (id: string) => pb.collection('bank_accounts').delete(id)
