import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Filters } from '@/types/filters'
import type { Cuisine, PriceRange } from '@/types/restaurant'
import { DEFAULT_FILTERS } from '@/types/filters'

const CUISINES: Cuisine[] = ['italian', 'japanese', 'mexican', 'american', 'chinese', 'indian', 'thai', 'mediterranean', 'other']
const CUISINE_EMOJI: Record<Cuisine, string> = {
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
const PRICES: { value: PriceRange; label: string }[] = [
  { value: 1, label: '$' },
  { value: 2, label: '$$' },
  { value: 3, label: '$$$' },
]

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  totalCount: number
  filteredCount: number
}

export default function FilterPanel({ filters, onChange, totalCount, filteredCount }: Props) {
  const isFiltered = filters.cuisines.length > 0 || filters.minRating > 1 || filters.priceRanges.length > 0

  const toggleCuisine = (cuisine: Cuisine) => {
    const next = filters.cuisines.includes(cuisine)
      ? filters.cuisines.filter((c) => c !== cuisine)
      : [...filters.cuisines, cuisine]
    onChange({ ...filters, cuisines: next })
  }

  const togglePrice = (price: PriceRange) => {
    const next = filters.priceRanges.includes(price)
      ? filters.priceRanges.filter((p) => p !== price)
      : [...filters.priceRanges, price]
    onChange({ ...filters, priceRanges: next })
  }

  const setMinRating = (rating: number) => {
    onChange({ ...filters, minRating: filters.minRating === rating ? 1 : rating })
  }

  return (
    <div className="absolute top-[52px] left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b px-4 py-2 flex items-center gap-4 overflow-x-auto">
      {/* Cuisine toggles */}
      <div className="flex items-center gap-1 shrink-0">
        {CUISINES.map((c) => (
          <button
            key={c}
            onClick={() => toggleCuisine(c)}
            title={c}
            className={`text-lg px-1.5 py-0.5 rounded transition-all ${
              filters.cuisines.includes(c)
                ? 'bg-primary text-primary-foreground scale-110'
                : 'hover:bg-muted opacity-60 hover:opacity-100'
            }`}
          >
            {CUISINE_EMOJI[c]}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Min rating */}
      <div className="flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setMinRating(n)}
            className={`text-sm transition-all ${n <= filters.minRating ? 'opacity-100' : 'opacity-30'} hover:opacity-100`}
          >
            ⭐
          </button>
        ))}
        {filters.minRating > 1 && (
          <span className="text-xs text-muted-foreground ml-1">+</span>
        )}
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Price range */}
      <div className="flex items-center gap-1 shrink-0">
        {PRICES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => togglePrice(value)}
            className={`text-xs font-medium px-2 py-0.5 rounded border transition-all ${
              filters.priceRanges.includes(value)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results count + clear */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        {isFiltered && (
          <>
            <Badge variant="secondary" className="text-xs">
              {filteredCount} / {totalCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onChange(DEFAULT_FILTERS)}
            >
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
