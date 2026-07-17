import pb from '@/lib/pocketbase/client'

export type Customer = {
  id: string
  name: string
  social_name: string
  birth_date: string | null
  cpf: string
  phone: string
  has_whatsapp: boolean
  email: string
  cep: string
  address: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export const getCustomers = () =>
  pb.collection('customers').getFullList<Customer>({ sort: '-created' })

export const getCustomer = (id: string) => pb.collection('customers').getOne<Customer>(id)

export const createCustomer = (data: Partial<Customer>) =>
  pb.collection('customers').create<Customer>(data)

export const updateCustomer = (id: string, data: Partial<Customer>) =>
  pb.collection('customers').update<Customer>(id, data)

export const deleteCustomer = (id: string) => pb.collection('customers').delete(id)
