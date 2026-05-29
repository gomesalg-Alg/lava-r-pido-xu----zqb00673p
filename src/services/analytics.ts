import pb from '@/lib/pocketbase/client'

export interface PageView {
  id: string
  path: string
  user_agent: string
  created: string
}

export const logPageView = async (path: string, userAgent: string) => {
  try {
    await pb.collection('page_views').create({ path, user_agent: userAgent })
  } catch (e) {
    console.error('Failed to log page view', e)
  }
}

export const getPageViewsStats = async () => {
  const path = '/'

  // Total visits
  const totalRes = await pb.collection('page_views').getList(1, 1, {
    filter: `path = "${path}"`,
  })

  // Visits in the last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const yesterdayStr = yesterday.toISOString().replace('T', ' ')

  const todayRes = await pb.collection('page_views').getList(1, 1, {
    filter: `path = "${path}" && created >= "${yesterdayStr}"`,
  })

  // Recent activity
  const recentRes = await pb.collection('page_views').getList<PageView>(1, 10, {
    filter: `path = "${path}"`,
    sort: '-created',
  })

  return {
    total: totalRes.totalItems,
    today: todayRes.totalItems,
    recent: recentRes.items,
  }
}
