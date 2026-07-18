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

export const updateUser = (id: string, data: Partial<{ name: string; email: string }>) =>
  pb.collection('users').update<User>(id, data)
