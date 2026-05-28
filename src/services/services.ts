import pb from '@/lib/pocketbase/client'

export type Service = {
  id: string
  name: string
  description: string
  price: number
  is_starting_price: boolean
  sort_order: number
}

export const getServices = () =>
  pb.collection('services').getFullList<Service>({ sort: 'sort_order' })

export const createService = (data: Partial<Service>) =>
  pb.collection('services').create<Service>(data)

export const updateService = (id: string, data: Partial<Service>) =>
  pb.collection('services').update<Service>(id, data)

export const deleteService = (id: string) => pb.collection('services').delete(id)
