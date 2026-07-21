import pb from '@/lib/pocketbase/client'

export type AccountType = 'Receita' | 'Despesa'
export type AccountNature = 'Sintética' | 'Analítica'

export interface AccountCategory {
  id: string
  name: string
  code: string
  type: AccountType
  nature: AccountNature
  parent_id: string | null
  expand?: { parent_id?: AccountCategory | null }
}

export interface AccountCategoryFormData {
  name: string
  code: string
  type: AccountType
  nature: AccountNature
  parent_id: string | null
}

export const getAccountCategories = () =>
  pb.collection('account_categories').getFullList<AccountCategory>({
    sort: 'code',
    expand: 'parent_id',
  })

export const getAccountCategory = (id: string) =>
  pb.collection('account_categories').getOne<AccountCategory>(id, { expand: 'parent_id' })

export const createAccountCategory = (data: AccountCategoryFormData) =>
  pb.collection('account_categories').create<AccountCategory>(data)

export const updateAccountCategory = (id: string, data: AccountCategoryFormData) =>
  pb.collection('account_categories').update<AccountCategory>(id, data)

export const deleteAccountCategory = (id: string) => pb.collection('account_categories').delete(id)

export const getSyntheticParents = (type?: AccountType) => {
  let filter = "nature = 'Sintética'"
  if (type) {
    filter += ` && type = '${type}'`
  }
  return pb.collection('account_categories').getFullList<AccountCategory>({
    sort: 'code',
    filter,
  })
}
