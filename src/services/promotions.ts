import pb from '@/lib/pocketbase/client'

export type Promotion = {
  id: string
  name: string
  image: string
  is_active: boolean
  description: string
  created: string
  updated: string
}

export const getPromotions = () =>
  pb.collection('promotions').getFullList<Promotion>({ sort: '-created' })

export const getActivePromotion = async (): Promise<Promotion | null> => {
  try {
    return await pb.collection('promotions').getFirstListItem<Promotion>('is_active = true')
  } catch {
    return null
  }
}

export const createPromotion = (data: FormData) =>
  pb.collection('promotions').create<Promotion>(data)

export const updatePromotion = (id: string, data: FormData) =>
  pb.collection('promotions').update<Promotion>(id, data)

export const updatePromotionActive = (id: string, isActive: boolean) =>
  pb.collection('promotions').update<Promotion>(id, { is_active: isActive })

export const deletePromotion = (id: string) => pb.collection('promotions').delete(id)

export const setActivePromotion = async (id: string) => {
  const all = await getPromotions()
  for (const p of all) {
    if (p.id !== id && p.is_active) {
      await pb.collection('promotions').update(p.id, { is_active: false })
    }
  }
  await pb.collection('promotions').update(id, { is_active: true })
}

export const getPromotionImageUrl = (p: Promotion) =>
  p.image ? `${pb.baseUrl}/api/files/promotions/${p.id}/${p.image}` : null

export const getPopupEnabled = async (): Promise<boolean> => {
  try {
    const records = await pb.collection('company').getFullList()
    return records.length > 0 ? (records[0].popup_enabled ?? true) : true
  } catch {
    return false
  }
}

export const setPopupEnabled = async (enabled: boolean): Promise<void> => {
  const records = await pb.collection('company').getFullList()
  for (const r of records) {
    await pb.collection('company').update(r.id, { popup_enabled: enabled })
  }
}
