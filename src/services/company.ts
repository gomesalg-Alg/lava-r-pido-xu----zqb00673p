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

export const getCompany = async () => {
  const list = await pb.collection('company').getFullList<Company>({ sort: '-created' })
  return list[0] || null
}

export const saveCompany = (id: string | null, data: Partial<Company>) => {
  if (id) return pb.collection('company').update<Company>(id, data)
  return pb.collection('company').create<Company>(data)
}
