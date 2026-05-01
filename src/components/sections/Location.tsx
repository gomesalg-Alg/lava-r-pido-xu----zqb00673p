import { useState, useEffect } from 'react'
import { MapPin, Navigation, Map as MapIcon, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/Reveal'
import { trackEvent } from '@/lib/analytics'
import { calculateDistance } from '@/lib/utils'

const SHOP_COORDS = { lat: -23.7225, lng: -46.6866 }

export function Location() {
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success' | 'error' | 'denied'
  >('idle')
  const [distance, setDistance] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }

    setLocationStatus('loading')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          SHOP_COORDS.lat,
          SHOP_COORDS.lng,
        )
        setDistance(dist)
        setLocationStatus('success')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied')
        } else {
          setLocationStatus('error')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [])

  return (
    <section id="localizacao" className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-primary mb-4">Como Chegar</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
              <MapPin className="text-secondary shrink-0" />
              <span>Av. João Goulart, 387 - Jd. Mália I - São Paulo - SP</span>
            </p>

            <div className="flex justify-center min-h-[48px]">
              {locationStatus === 'loading' && (
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-5 py-2.5 rounded-full border border-slate-200">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm sm:text-base font-medium">
                    Calculando distância até você...
                  </span>
                </div>
              )}
              {locationStatus === 'success' && distance !== null && (
                <div className="flex items-center gap-2.5 text-emerald-700 bg-emerald-50 px-6 py-3 rounded-full border-2 border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-500">
                  <MapIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="font-semibold text-base sm:text-lg">
                    Você está a {distance.toFixed(1)} km de distância
                  </span>
                </div>
              )}
              {locationStatus === 'denied' && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-5 py-2.5 rounded-full border border-amber-200 text-sm sm:text-base">
                  <AlertCircle className="h-5 w-5" />
                  <span>Permissão negada. Ative a localização para ver a distância.</span>
                </div>
              )}
              {locationStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-5 py-2.5 rounded-full border border-red-200 text-sm sm:text-base">
                  <AlertCircle className="h-5 w-5" />
                  <span>Não foi possível obter sua localização automaticamente.</span>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="max-w-5xl mx-auto bg-slate-50 p-2 md:p-4 rounded-3xl shadow-xl border border-slate-100">
            <div className="aspect-[4/3] md:aspect-[21/9] w-full rounded-2xl overflow-hidden relative group bg-slate-200">
              <iframe
                src="https://maps.google.com/maps?q=Av.%20Jo%C3%A3o%20Goulart,%20387%20-%20Jd.%20Malia%20I,%20S%C3%A3o%20Paulo%20-%20SP&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
                title="Localização do XUÁ Lava Rápido"
              />
              <div className="absolute inset-0 pointer-events-none group-hover:bg-black/5 transition-colors duration-300" />
            </div>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-4 px-4 pb-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg font-bold shadow-lg w-full sm:w-auto"
              >
                <a
                  href="https://maps.google.com/?q=Av.+João+Goulart,+387+-+Jd.+Mália+I+-+São+Paulo+-+SP"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('click', { button: 'open_google_maps' })}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Abrir no Google Maps
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-lg font-bold shadow-sm w-full sm:w-auto border-2 border-slate-200 hover:bg-slate-100 text-slate-700"
              >
                <a
                  href="https://waze.com/ul?q=Av.+João+Goulart,+387+-+Jd.+Mália+I+-+São+Paulo+-+SP"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackEvent('click', { button: 'open_waze' })}
                >
                  <Navigation className="mr-2 h-5 w-5" />
                  Abrir no Waze
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
