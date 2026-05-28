import { useState, useEffect } from 'react'

export type ServiceItem = {
  id: string
  title: string
  subtitle?: string
  price?: number
  pricePrefix?: string
  isInfo?: boolean
}

const defaultServices: ServiceItem[] = [
  { id: '1', title: 'Lavagem simples', pricePrefix: 'a partir de', price: 35 },
  {
    id: '2',
    title: 'Ducha',
    subtitle: '(com pretinho e secagem)',
    pricePrefix: 'a partir de',
    price: 20,
  },
  { id: '3', title: 'Lavagem completa', pricePrefix: 'a partir de', price: 45 },
  { id: '4', title: 'Aplicação de cera', price: 15 },
  { id: '5', title: 'Polimento', pricePrefix: 'a partir de', price: 350 },
  { id: '6', title: 'Lavagem de motor', subtitle: '(parte superior)', price: 80 },
  { id: '7', title: 'Lavagem inferior', price: 80 },
  { id: '8', title: 'Higienização', pricePrefix: 'a partir de', price: 250 },
  { id: '9', title: 'Avaliação de serviços no local', isInfo: true },
  { id: '10', title: 'Leva e trás (até 1 km)', price: 10, isInfo: true },
  { id: '11', title: 'Atendemos com hora marcada e residencial.', isInfo: true },
]

const STORAGE_KEY = 'xua_services_v1'

export function useServices() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = () => {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
          setServices(JSON.parse(data))
        } else {
          setServices(defaultServices)
        }
      } catch (e) {
        setServices(defaultServices)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    window.addEventListener('services-updated', load)
    return () => window.removeEventListener('services-updated', load)
  }, [])

  const saveServices = (newServices: ServiceItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newServices))
    setServices(newServices)
    window.dispatchEvent(new Event('services-updated'))
  }

  return { services, saveServices, isLoading }
}
