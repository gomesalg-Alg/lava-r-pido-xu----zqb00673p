import pb from '@/lib/pocketbase/client'

export type User = {
  id: string
  name: string
  email: string
  avatar: string
  created: string
  updated: string
}

export const getUsers = () => pb.collection('users').getFullList<User>({ sort: '-created' })

export const getUser = (id: string) => pb.collection('users').getOne<User>(id)

export const createUser = (data: FormData) => pb.collection('users').create<User>(data as any)

export const updateUser = (id: string, data: Partial<{ name: string; email: string }> | FormData) =>
  pb.collection('users').update<User>(id, data as any)

export const deleteUser = (id: string) => pb.collection('users').delete(id)
