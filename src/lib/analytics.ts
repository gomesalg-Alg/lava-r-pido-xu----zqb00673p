declare global {
  interface Window {
    dataLayer: any[]
  }
}

export const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
  console.log(`[Analytics] Event: ${eventName}`, eventData)
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    })
  }
}

export const trackPageView = (page: string) => {
  console.log(`[Analytics] Page View: ${page}`)
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'page_view',
      page_path: page,
    })
  }
}
