import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RestaurantFormData } from '@/types/restaurant'

const CUISINES = ['italian', 'japanese', 'mexican', 'american', 'chinese', 'indian', 'thai', 'mediterranean', 'other'] as const

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  cuisine: z.enum(CUISINES),
  rating: z.number().min(1).max(5),
  price_range: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  notes: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  coordinates: { latitude: number; longitude: number }
  onSubmit: (data: RestaurantFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function RestaurantForm({ coordinates, onSubmit, onCancel, isSubmitting = false }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      rating: 3,
      price_range: 2,
      cuisine: 'other',
      notes: '',
      address: '',
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Restaurant name" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Cuisine</Label>
        <Select defaultValue="other" onValueChange={(v) => setValue('cuisine', v as FormValues['cuisine'])}>
          <SelectTrigger>
            <SelectValue placeholder="Select cuisine" />
          </SelectTrigger>
          <SelectContent>
            {CUISINES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Rating</Label>
          <Select defaultValue="3" onValueChange={(v) => setValue('rating', Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Price</Label>
          <Select defaultValue="2" onValueChange={(v) => setValue('price_range', Number(v) as 1 | 2 | 3)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">$ — Cheap</SelectItem>
              <SelectItem value="2">$$ — Moderate</SelectItem>
              <SelectItem value="3">$$$ — Expensive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="Optional" {...register('address')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="What did you love about it?" {...register('notes')} />
      </div>

      <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
      <input type="hidden" {...register('longitude', { valueAsNumber: true })} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add Restaurant'}
        </Button>
      </div>
    </form>
  )
}
