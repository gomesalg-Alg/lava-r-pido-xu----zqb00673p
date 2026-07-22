import pb from '@/lib/pocketbase/client'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  sku: string
  stock_quantity: number
}

export const getProducts = () => pb.collection('products').getFullList<Product>({ sort: 'name' })

export const getProduct = (id: string) => pb.collection('products').getOne<Product>(id)

export const createProduct = (data: Partial<Product>) =>
  pb.collection('products').create<Product>(data)

export const updateProduct = (id: string, data: Partial<Product>) =>
  pb.collection('products').update<Product>(id, data)

export const deleteProduct = (id: string) => pb.collection('products').delete(id)
