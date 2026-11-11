export const CATEGORIES = [
  { id: 'gourmet-bowls', name: 'Gourmet Bowls' },
  { id: 'salads-greens', name: 'Salads & Greens' },
  { id: 'grills-suya', name: 'Grills & Suya' },
  { id: 'burgers-mains', name: 'Burgers & Mains' },
  { id: 'fresh-drinks', name: 'Fresh Drinks' },
  { id: 'pastries-sides', name: 'Pastries & Sides' },
]

export const DIET_TAGS = [
  { id: 'popular', name: 'Popular' },
  { id: 'spicy', name: 'Spicy' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'high-protein', name: 'High Protein' },
]

export const LOW_STOCK_THRESHOLD = 5

export function getCategoryName(slug) {
  return CATEGORIES.find((c) => c.id === slug)?.name || 'All Dishes'
}
