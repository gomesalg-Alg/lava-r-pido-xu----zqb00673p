import pb from '@/lib/pocketbase/client'

export type AdminUser = {
  id: string
  name: string
  email: string
  created: string
  updated: string
}

export const getUsers = () => pb.collection('users').getFullList<AdminUser>({ sort: '-created' })

export const createUser = (data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
}) => pb.collection('users').create<AdminUser>(data)

export const deleteUser = (id: string) => pb.collection('users').delete(id)
