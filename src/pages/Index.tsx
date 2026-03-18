import { useEffect } from 'react'
import { Hero } from '@/components/sections/Hero'
import { SocialProof } from '@/components/sections/SocialProof'
import { Services } from '@/components/sections/Services'
import { Delivery } from '@/components/sections/Delivery'
import { Pricing } from '@/components/sections/Pricing'
import { Promotions } from '@/components/sections/Promotions'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Location } from '@/components/sections/Location'
import { FAQ } from '@/components/sections/FAQ'
import { trackPageView } from '@/lib/analytics'

const Index = () => {
  useEffect(() => {
    trackPageView('/')
  }, [])

  return (
    <div className="w-full">
      <Hero />
      <SocialProof />
      <Services />
      <Delivery />
      <Pricing />
      <Promotions />
      <HowItWorks />
      <Location />
      <FAQ />
    </div>
  )
}

export default Index
