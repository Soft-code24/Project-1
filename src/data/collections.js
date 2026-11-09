const img = (name) => `/images/${name}.jpg`

// Shopify-style collections that group products (localStorage mirror of the
// backend `collections` / `collection_products` tables).
export const COLLECTIONS = [
  {
    id: 'c01',
    name: 'Grill Masters',
    slug: 'grill-masters',
    description: "Our best grilled dishes — suya, grilled steaks, and peppered skewers, cooked over open charcoal.",
    image_url: img('charcoal-suya-steak'),
    product_ids: ['p04', 'p05', 'p06'],
    is_published: true,
    sort_order: 1,
  },
  {
    id: 'c02',
    name: 'Jollof & Rice Bowls',
    slug: 'jollof-rice-bowls',
    description: 'Smoky firewood jollof, herb chicken, and hearty rice bowls — SavorBite signatures.',
    image_url: img('hero-jollof-chicken'),
    product_ids: ['p01', 'p02', 'p03', 'p10'],
    is_published: true,
    sort_order: 2,
  },
  {
    id: 'c03',
    name: 'Drinks & Coolers',
    slug: 'drinks-coolers',
    description: 'Cold-pressed citrus, mint & lime, and refreshing coolers to go with any main.',
    image_url: img('citrus-cooler'),
    product_ids: ['p11'],
    is_published: true,
    sort_order: 3,
  },
  {
    id: 'c04',
    name: 'Pastries & Sides',
    slug: 'pastries-sides',
    description: 'Sweet bites and shareable sides — plantain waffles, suya burgers, and more.',
    image_url: img('plantain-waffles'),
    product_ids: ['p08', 'p12'],
    is_published: true,
    sort_order: 4,
  },
  {
    id: 'c05',
    name: 'Salads & Greens',
    slug: 'salads-greens',
    description: 'Fresh, light and plant-forward bowls — quinoa, avocado, and tahini.',
    image_url: img('avocado-quinoa-salad'),
    product_ids: ['p09'],
    is_published: true,
    sort_order: 5,
  },
]

export function getCollectionBySlug(slug) {
  return COLLECTIONS.find((c) => c.slug === slug)
}

export function getCollectionById(id) {
  return COLLECTIONS.find((c) => c.id === id)
}
