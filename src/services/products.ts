import pb from '@/lib/pocketbase/client'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  sku: string
  stock_quantity: number
  account_category_id: string | null
  expand?: {
    account_category_id?: {
      id: string
      name: string
      code: string
    } | null
  }
}

export const getProducts = () =>
  pb.collection('products').getFullList<Product>({
    sort: 'name',
    expand: 'account_category_id',
  })

export const getProduct = (id: string) => pb.collection('products').getOne<Product>(id)

export const createProduct = (data: Partial<Product>) =>
  pb.collection('products').create<Product>(data)

export const updateProduct = (id: string, data: Partial<Product>) =>
  pb.collection('products').update<Product>(id, data)

export const deleteProduct = (id: string) => pb.collection('products').delete(id)
