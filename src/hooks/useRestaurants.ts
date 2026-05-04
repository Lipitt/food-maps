import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Restaurant, RestaurantInsert } from '@/types/restaurant'

const QUERY_KEY = ['restaurants']

export function useRestaurants() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Restaurant[]
    },
  })
}

export function useAddRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (restaurant: RestaurantInsert) => {
      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurant)
        .select()
        .single()

      if (error) throw error
      return data as Restaurant
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
