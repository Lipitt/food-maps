import { Popup } from 'react-map-gl/mapbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Restaurant } from '@/types/restaurant'

const PRICE = { 1: '$', 2: '$$', 3: '$$$' }

interface Props {
  restaurant: Restaurant
  longitude: number
  latitude: number
  onClose: () => void
  canDelete: boolean
  onDelete: (id: string) => void
}

export default function RestaurantPopup({ restaurant, longitude, latitude, onClose, canDelete, onDelete }: Props) {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      offset={40}
      onClose={onClose}
      closeButton={true}
      className="min-w-[200px]"
    >
      <div className="p-1">
        <h3 className="font-semibold text-sm">{restaurant.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs capitalize">
            {restaurant.cuisine}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {PRICE[restaurant.price_range]}
          </span>
          <span className="text-xs">{'⭐'.repeat(restaurant.rating)}</span>
        </div>
        {restaurant.notes && (
          <p className="text-xs text-muted-foreground mt-1">{restaurant.notes}</p>
        )}
        {restaurant.address && (
          <p className="text-xs text-muted-foreground mt-1">📍 {restaurant.address}</p>
        )}

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger className="w-full mt-3">
              <Button variant="destructive" size="sm" className="w-full h-7 text-xs">
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {restaurant.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(restaurant.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Popup>
  )
}
