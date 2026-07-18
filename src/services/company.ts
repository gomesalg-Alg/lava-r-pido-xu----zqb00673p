import pb from '@/lib/pocketbase/client'

export type Company = {
  id: string
  name: string
  trading_name: string
  cnpj: string
  phone: string
  email: string
  cep: string
  address: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export const getCompany = async (): Promise<Company | null> => {
  const list = await pb.collection('company').getFullList<Company>({ limit: 1 })
  return list[0] || null
}

export const createCompany = (data: Partial<Company>) =>
  pb.collection('company').create<Company>(data)

export const updateCompany = (id: string, data: Partial<Company>) =>
  pb.collection('company').update<Company>(id, data)
