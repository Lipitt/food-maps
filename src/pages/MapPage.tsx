import { toast } from 'sonner'
import FoodMap from '@/components/map/FoodMap'
import Navbar from '@/components/layout/Navbar'
import FilterPanel from '@/components/map/FilterPanel'
import { useRestaurants, useAddRestaurant, useDeleteRestaurant } from '@/hooks/useRestaurants'
import { useAuth } from '@/context/AuthContext'
import { useFilters } from '@/hooks/useFilters'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { RestaurantFormData, RestaurantInsert } from '@/types/restaurant'
import type { Feature, Polygon } from 'geojson'

export default function MapPage() {
  const { user } = useAuth()
  const { data: restaurants = [], isLoading } = useRestaurants()
  const { mutate: addRestaurant, isPending: isAdding } = useAddRestaurant()
  const { mutate: deleteRestaurant } = useDeleteRestaurant()
  const { filters, setFilters, filtered } = useFilters(restaurants)
  const userCoords = useGeolocation()

  const handleAdd = (data: RestaurantFormData) => {
    const insert: RestaurantInsert = { ...data, created_by: user?.id ?? null }
    addRestaurant(insert, {
      onSuccess: () => toast.success('Restaurant added!'),
      onError: (err) => toast.error(`Failed to add restaurant: ${err.message}`),
    })
  }

  const handleDrawPolygon = (polygon: Feature<Polygon> | null) => {
    setFilters((f) => ({ ...f, polygon }))
  }

  const handleDelete = (id: string) => {
    deleteRestaurant(id, {
      onSuccess: () => toast.success('Restaurant deleted.'),
      onError: (err) => toast.error(`Failed to delete: ${err.message}`),
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full">
      <Navbar />
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        totalCount={restaurants.length}
        filteredCount={filtered.length}
      />
      <FoodMap
        restaurants={filtered}
        onAdd={handleAdd}
        onDelete={handleDelete}
        currentUserId={user?.id ?? null}
        isAuthenticated={!!user}
        isSubmitting={isAdding}
        userCoords={userCoords}
        onDrawPolygon={handleDrawPolygon}
      />
    </div>
  )
}
