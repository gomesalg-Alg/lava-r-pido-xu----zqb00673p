import { useEffect } from 'react'
import { Hero } from '@/components/sections/Hero'
import { SocialProof } from '@/components/sections/SocialProof'
import { Services } from '@/components/sections/Services'
import { Delivery } from '@/components/sections/Delivery'
import { Pricing } from '@/components/sections/Pricing'
import { Promotions } from '@/components/sections/Promotions'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { BusinessHours } from '@/components/sections/BusinessHours'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { trackPageView } from '@/lib/analytics'

const Index = () => {
  useEffect(() => {
    trackPageView('/')

    const hideBadge = () => {
      const badge = document.getElementById('skip-badge')
      if (badge) {
        badge.style.display = 'none'
      }
      document.querySelectorAll('a').forEach((el) => {
        if (el.textContent?.includes('Criado por Skip')) {
          el.style.display = 'none'
        }
      })
    }

    hideBadge()

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          hideBadge()
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full">
      <style>{`
        #skip-badge {
          display: none !important;
        }
      `}</style>
      <Hero />
      <SocialProof />
      <Services />
      <Delivery />
      <Pricing />
      <Promotions />
      <HowItWorks />
      <BusinessHours />
      <Location />
      <FAQ />
    </div>
  )
}

export default Index
