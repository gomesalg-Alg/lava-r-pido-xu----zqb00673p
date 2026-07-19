import pb from '@/lib/pocketbase/client'

export type Vehicle = {
  id: string
  customer_id: string
  type: string
  brand: string
  model: string
  year?: number | null
  fuel?: string
  placa?: string
}

export const getVehiclesByCustomer = (customerId: string) =>
  pb.collection('vehicles').getFullList<Vehicle>({
    filter: `customer_id = "${customerId}"`,
  })

export const getAllVehicles = () =>
  pb.collection('vehicles').getFullList({
    sort: '-created',
    expand: 'customer_id',
  })

export const getVehicle = (id: string) =>
  pb.collection('vehicles').getOne<Vehicle>(id, { expand: 'customer_id' })

export const createVehicle = (data: Partial<Vehicle>) =>
  pb.collection('vehicles').create<Vehicle>(data)

export const updateVehicle = (id: string, data: Partial<Vehicle>) =>
  pb.collection('vehicles').update<Vehicle>(id, data)

export const deleteVehicle = (id: string) => pb.collection('vehicles').delete(id)
