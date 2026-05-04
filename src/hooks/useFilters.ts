import { useState, useMemo } from 'react'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Restaurant } from '@/types/restaurant'
import { type Filters, DEFAULT_FILTERS } from '@/types/filters'

export function useFilters(restaurants: Restaurant[]) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (filters.cuisines.length > 0 && !filters.cuisines.includes(r.cuisine)) return false
      if (r.rating < filters.minRating) return false
      if (filters.priceRanges.length > 0 && !filters.priceRanges.includes(r.price_range)) return false
      if (filters.polygon) {
        const pt = point([r.longitude, r.latitude])
        if (!booleanPointInPolygon(pt, filters.polygon)) return false
      }
      return true
    })
  }, [restaurants, filters])

  return { filters, setFilters, filtered }
}
