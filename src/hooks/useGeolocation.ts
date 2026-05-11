import { useState, useEffect } from 'react'

export interface GeoCoords {
  latitude: number
  longitude: number
}

const DEFAULT_COORDS: GeoCoords = { latitude: -34.6037, longitude: -58.3816 }

export function useGeolocation() {
  const [coords, setCoords] = useState<GeoCoords>(DEFAULT_COORDS)

  useEffect(() => {
    // Level 1: IP geolocation — no prompt, city-level accuracy
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        if (data.latitude && data.longitude) {
          setCoords({ latitude: data.latitude, longitude: data.longitude })
        }
      })
      .catch(() => {})

    // Level 2: browser geolocation — asks for permission, precise location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          })
        },
        () => {}, // user denied or error — stay on IP result
        { timeout: 10000 }
      )
    }
  }, [])

  return coords
}
