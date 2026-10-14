import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Utensils, X } from 'lucide-react'
import { CATEGORIES, DIET_TAGS } from '../data/products.js'
import { useProducts } from '../context/ProductContext.jsx'
import { formatNaira } from '../lib/currency.js'
import { EmptyState, controlClass } from '../components/ui/Form.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { dietIconFor } from '../components/ui/Badges.jsx'
import { ProductCard } from '../components/ProductCard.jsx'

const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'top-rated', label: 'Top Rated' },
]

const PRICE_MIN = 1500
const PRICE_MAX = 8000

export default function Shop() {
  const { products } = useProducts()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || 'all'
  const activeTag = searchParams.get('tag') || 'all'

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // pending filter drawer state
  const [pendingDietary, setPendingDietary] = useState([])
  const [pendingPrice, setPendingPrice] = useState(PRICE_MAX)
  // applied filters
  const [dietary, setDietary] = useState([])
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'all') next.delete('category')
    else next.set('category', id)
    setSearchParams(next, { replace: true })
  }

  const setTag = (id) => {
    const next = new URLSearchParams(searchParams)
    if (id === 'all') next.delete('tag')
    else next.set('tag', id)
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = products.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false
      if (activeTag !== 'all' && !(p.tags || []).includes(activeTag)) return false
      if (dietary.length && !dietary.some((d) => (p.tags || []).includes(d))) return false
      if (p.price > maxPrice) return false
      if (q) {
        const haystack = `${p.name} ${p.short} ${p.description} ${p.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    if (sort === 'price-low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'top-rated') list = [...list].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    return list
  }, [products, query, activeCategory, activeTag, dietary, maxPrice, sort])

  const activeFilterCount = dietary.length + (maxPrice < PRICE_MAX ? 1 : 0)
  const currentSort = SORTS.find((s) => s.id === sort) || SORTS[0]
  const categoryName = activeCategory === 'all' ? 'All Dishes' : CATEGORIES.find((c) => c.id === activeCategory)?.name

  const resetFilters = () => {
    setPendingDietary([])
    setPendingPrice(PRICE_MAX)
    setDietary([])
    setMaxPrice(PRICE_MAX)
  }

  return (
    <div className="container-page py-4 pb-6">
      {/* Sticky search & filter toolbar */}
      <section className="sticky top-16 z-30 -mx-4 mb-4 flex flex-col gap-2 border-b border-border-subtle bg-white/95 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center rounded-xl bg-surface-container-low px-3 py-2 shadow-sm">
            <Search size={18} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meals, ingredients, drinks..."
              aria-label="Search meals, ingredients, drinks"
              className="ml-2 w-full bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="p-0.5 text-text-tertiary transition-colors hover:text-text-primary"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setPendingDietary(dietary)
              setPendingPrice(maxPrice)
              setFiltersOpen(true)
            }}
            className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-orange-50 px-3.5 text-label-md text-primary shadow-sm transition-all active:scale-95"
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span className="hidden font-medium sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="tnum flex h-5 w-5 items-center justify-center rounded-full bg-primary text-badge-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar md:-mx-6 md:px-6">
          <button
            type="button"
            onClick={() => setTag('all')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-label-sm transition-all ${
              activeTag === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-text-secondary hover:text-text-primary'
            }`}
          >
            All
          </button>
          {DIET_TAGS.map((tag) => {
            const Icon = dietIconFor(tag.id)
            const active = activeTag === tag.id
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setTag(tag.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-sm transition-all ${
                  active ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                {tag.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Results header + sort */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-headline-sm text-text-primary md:text-headline-md">{categoryName}</h1>
          <span className="tnum text-body-sm text-text-tertiary">({filtered.length} items)</span>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg bg-surface-container-low px-2.5 py-1.5 text-label-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="hidden sm:inline">Sort:</span>
            {currentSort.label}
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} aria-hidden="true" />
              <div
                role="listbox"
                className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-white p-1.5 shadow-overlay"
                aria-label="Sort options"
              >
                {SORTS.map((option) => (
                  <button
                    key={option.id}
                    role="option"
                    aria-selected={sort === option.id}
                    type="button"
                    onClick={() => {
                      setSort(option.id)
                      setSortOpen(false)
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-body-sm transition-colors ${
                      sort === option.id
                        ? 'bg-orange-50 font-semibold text-primary'
                        : 'text-text-secondary hover:bg-surface-container-low'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category pills row */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:-mx-6 md:px-6">
        {[{ id: 'all', name: 'All Dishes' }, ...CATEGORIES].map((category) => {
          const active = activeCategory === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategory(category.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-label-sm font-medium shadow-sm transition-all active:scale-95 ${
                active
                  ? 'bg-primary text-white'
                  : 'border border-border-default bg-white text-text-secondary hover:text-text-primary'
              }`}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Utensils}
          title="No dishes match your search"
          description="Try a different keyword, widen your price range, or reset the filters to explore the full menu."
          action={
            <Button
              onClick={() => {
                resetFilters()
                setQuery('')
                setCategory('all')
                setTag('all')
              }}
            >
              Reset filters
            </Button>
          }
        />
      )}

      {/* Filter drawer */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter Catalog"
        description="Refine the SavorBite kitchen menu"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="subtle" className="flex-1" onClick={resetFilters}>
              Reset All
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setDietary(pendingDietary)
                setMaxPrice(pendingPrice)
                setFiltersOpen(false)
              }}
            >
              Show {filtered.length} Meals
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-semibold text-text-primary">Max Price</span>
              <span className="tnum font-display text-price-md text-primary">{formatNaira(pendingPrice)}</span>
            </div>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={500}
              value={pendingPrice}
              onChange={(e) => setPendingPrice(Number(e.target.value))}
              aria-label="Maximum price"
              className="h-2 w-full cursor-pointer accent-primary"
            />
            <div className="tnum flex justify-between text-body-sm text-text-tertiary">
              <span>{formatNaira(PRICE_MIN)}</span>
              <span>{formatNaira(PRICE_MAX)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-md font-semibold text-text-primary">Dietary &amp; Prep</span>
            <div className="flex flex-wrap gap-2">
              {DIET_TAGS.map((tag) => {
                const checked = pendingDietary.includes(tag.id)
                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-label-sm shadow-sm transition-colors ${
                      checked ? 'bg-orange-50 text-primary' : 'bg-surface-container-low text-text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-strong accent-primary"
                      checked={checked}
                      onChange={() =>
                        setPendingDietary((prev) =>
                          prev.includes(tag.id) ? prev.filter((t) => t !== tag.id) : [...prev, tag.id],
                        )
                      }
                    />
                    {tag.name}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-md font-semibold text-text-primary">Category</span>
            <div className="flex flex-wrap gap-2">
              {[{ id: 'all', name: 'All' }, ...CATEGORIES].map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategory(category.id)}
                  className={`rounded-full px-3.5 py-1.5 text-label-sm transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
