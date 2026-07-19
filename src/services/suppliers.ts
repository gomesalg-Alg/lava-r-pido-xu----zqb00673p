import pb from '@/lib/pocketbase/client'

export type Supplier = {
  id: string
  name: string
  cnpj: string
  phone: string
  email: string
  address: string
}

export const getSuppliers = () =>
  pb.collection('suppliers').getFullList<Supplier>({ sort: '-created' })

export const getSupplier = (id: string) => pb.collection('suppliers').getOne<Supplier>(id)

export const createSupplier = (data: Partial<Supplier>) =>
  pb.collection('suppliers').create<Supplier>(data)

export const updateSupplier = (id: string, data: Partial<Supplier>) =>
  pb.collection('suppliers').update<Supplier>(id, data)

export const deleteSupplier = (id: string) => pb.collection('suppliers').delete(id)
