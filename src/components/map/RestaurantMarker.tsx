import { Marker } from 'react-map-gl/mapbox'
import type { Restaurant } from '@/types/restaurant'

const CUISINE_EMOJI: Record<string, string> = {
  italian: '🍕',
  japanese: '🍣',
  mexican: '🌮',
  american: '🍔',
  chinese: '🥢',
  indian: '🍛',
  thai: '🍜',
  mediterranean: '🥗',
  other: '🍽️',
}

interface Props {
  restaurant: Restaurant
  onClick: (restaurant: Restaurant) => void
}

export default function RestaurantMarker({ restaurant, onClick }: Props) {
  return (
    <Marker
      longitude={restaurant.longitude}
      latitude={restaurant.latitude}
      anchor="bottom"
    >
      <div
        className="cursor-pointer text-2xl hover:scale-125 transition-transform drop-shadow-md"
        onClick={(e) => {
          e.stopPropagation()
          onClick(restaurant)
        }}
      >
        {CUISINE_EMOJI[restaurant.cuisine] ?? '🍽️'}
      </div>
    </Marker>
  )
}
