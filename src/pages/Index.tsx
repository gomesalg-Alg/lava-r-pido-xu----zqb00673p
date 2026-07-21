import { useEffect, useState } from 'react'
import { Hero } from '@/components/sections/Hero'
import { SocialProof } from '@/components/sections/SocialProof'
import { Services } from '@/components/sections/Services'
import { Delivery } from '@/components/sections/Delivery'
import { Pricing } from '@/components/sections/Pricing'
import { SpecialOffers } from '@/components/sections/SpecialOffers'
import { Promotions } from '@/components/sections/Promotions'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { BusinessHours } from '@/components/sections/BusinessHours'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { PromoModal } from '@/components/PromoModal'
import { trackPageView } from '@/lib/analytics'
import { logPageView } from '@/services/analytics'
import { MetaTags } from '@/components/MetaTags'
import { getCompany, type Company } from '@/services/company'

const Index = () => {
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    getCompany().then(setCompany).catch(console.error)

    trackPageView('/')
    logPageView('/', window.navigator.userAgent)

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
        #skip-badge, a[href*="skip.build"], a[href*="goskip.app"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
      <MetaTags
        title={
          company?.trading_name
            ? `${company.trading_name} - Seu veículo em boas mãos`
            : 'Lava Rápido XUÁ - Seu veículo em boas mãos'
        }
        description={
          company?.name
            ? `Lavagens simples, completas, polimento, cristalização e muito mais na ${company.trading_name || company.name}.`
            : 'Lavagens simples, completas, polimento, cristalização e muito mais. Buscamos e entregamos seu veículo em um raio de 2km.'
        }
        image={
          company?.logo
            ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/company/${company.id}/${company.logo}`
            : 'https://img.usecurling.com/p/800/418?q=car%20wash&color=blue'
        }
        url={window.location.href}
      />
      <Hero />
      <SocialProof />
      <Services />
      <Delivery />
      <Pricing />
      <SpecialOffers />
      <Promotions />
      <HowItWorks />
      <BusinessHours />
      <Location />
      <FAQ />
      <PromoModal />
    </div>
  )
}

export default Index
