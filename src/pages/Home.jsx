import { Link } from 'react-router-dom'
import { ArrowRight, Bike, Flame, Leaf, Lock, Quote, Timer, Zap } from 'lucide-react'
import { CATEGORIES, CHEF_SPECIAL_ID } from '../data/products.js'
import { HERO_IMAGE, PROMO } from '../data/site.js'
import { useProducts } from '../context/ProductContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatNaira } from '../lib/currency.js'
import { Button } from '../components/ui/Button.jsx'
import { CategoryIcon, PromoTag } from '../components/ui/Badges.jsx'
import { CountdownTimer } from '../components/CountdownTimer.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { SEO } from '../components/SEO.jsx'

const pillars = [
  { icon: Zap, tone: 'orange', title: '30-min Delivery', sub: 'Hot to your doorstep' },
  { icon: Leaf, tone: 'emerald', title: 'Fresh & Organic', sub: 'Farm-sourced quality' },
  { icon: Lock, tone: 'sky', title: 'Secure Checkout', sub: 'Paystack & Flutterwave' },
]

const toneClasses = {
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400',
}

const testimonials = [
  {
    quote:
      'The smokey party jollof tastes exactly like home. It arrived hot in under 30 minutes — my new Friday ritual.',
    name: 'Chiaka N.',
    role: 'Lekki regular',
  },
  {
    quote:
      'Ordering for the office has never been easier. Everyone picks what they want and checkout takes seconds.',
    name: 'Tunde A.',
    role: 'Team lead, VI',
  },
  {
    quote:
      'The prawn special is worth every naira. You can taste the quality of the ingredients with every bite.',
    name: 'Amaka E.',
    role: 'Food lover',
  },
]

export default function Home() {
  const { products, getProduct } = useProducts()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const featured = products.filter((p) => p.featured && p.stock > 0).slice(0, 4)
  const special = getProduct(CHEF_SPECIAL_ID)

  const handleAddSpecial = () => {
    if (!special || special.stock <= 0) return
    addItem(special.id)
    showToast(`${special.name} added to cart`, 'success')
  }

  return (
    <>
    <SEO
      title="SavorBite — Fresh Nigerian Meals Delivered in Lagos"
      description="Freshly crafted Nigerian meals — firewood jollof, suya, grilled steaks and more — delivered to your door in Lagos in under 30 minutes."
      image={HERO_IMAGE}
      path="/"
    />
    <div className="flex flex-col gap-2 pb-6">
      {/* Promotional hero banner */}
      <section className="container-page pt-4">
        <div className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-primary p-5 shadow-card md:min-h-[360px] md:p-10">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10 flex max-w-xl flex-col gap-2">
            <PromoTag icon={Flame}>Code: {PROMO.code}</PromoTag>
            <h1 className="font-display text-hero-mobile text-white md:text-hero">Craving authentic taste?</h1>
            <p className="text-body-sm text-white/90 md:text-body-lg">{PROMO.description}</p>
            <div className="pt-1">
              <Button to="/shop" size="lg" className="group">
                Order Now
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value & trust pillars */}
      <section className="container-page">
        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl bg-surface p-3 shadow-card no-scrollbar md:grid md:grid-cols-3 md:gap-4 md:overflow-visible">
          {pillars.map((pillar, i) => (
            <div key={pillar.title} className="flex min-w-max items-center gap-2 px-2 md:px-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneClasses[pillar.tone]}`}>
                <pillar.icon size={17} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-label-sm font-semibold text-text-primary">{pillar.title}</span>
                <span className="text-body-sm text-text-tertiary">{pillar.sub}</span>
              </div>
              {i < pillars.length - 1 && <span className="ml-2 hidden h-7 w-px bg-surface-container-high md:block" />}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-3">
        <div className="container-page mb-2 flex items-center justify-between">
          <h2 className="font-display text-headline-md text-text-primary md:text-headline-lg">Categories</h2>
          <Link to="/shop" className="text-label-md font-medium text-primary hover:text-primary-hover">
            See all
          </Link>
        </div>
        <div className="container-page flex gap-2 overflow-x-auto pb-1 no-scrollbar md:grid md:grid-cols-6 md:overflow-visible">
          <Link
            to="/shop"
            className="flex min-w-max shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
          >
            All Dishes
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.id}`}
              className="flex min-w-max shrink-0 items-center gap-1.5 rounded-full border border-border-default bg-surface px-4 py-2 text-label-sm font-medium text-text-secondary shadow-sm transition-colors hover:text-text-primary active:scale-95"
            >
              <CategoryIcon category={category.id} size={14} className="text-primary" />
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Chef's daily special */}
      {special && (
        <section className="container-page">
          <div className="relative overflow-hidden rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                <span className="text-label-sm font-bold uppercase tracking-wider text-primary">
                  Chef&apos;s Daily Special
                </span>
              </div>
              <span className="flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-badge-xs text-orange-800 dark:text-orange-400">
                <Timer size={12} aria-hidden="true" />
                <CountdownTimer className="font-semibold" />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link to={`/product/${special.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                <img src={special.image} alt={special.alt} className="h-full w-full object-cover" />
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-badge-xs text-white">
                  Special
                </span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-headline-sm text-text-primary">{special.name}</h3>
                  <p className="mt-0.5 truncate text-body-sm text-text-secondary">{special.short}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex flex-col">
                    {special.compareAt && (
                      <span className="tnum text-body-sm text-text-tertiary line-through">
                        {formatNaira(special.compareAt)}
                      </span>
                    )}
                    <span className="font-display text-price-md font-bold tnum text-text-primary">
                      {formatNaira(special.price)}
                    </span>
                  </div>
                  <Button size="sm" onClick={handleAddSpecial} disabled={special.stock <= 0}>
                    <Flame size={15} aria-hidden="true" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured dishes */}
      <section className="container-page py-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-headline-md text-text-primary md:text-headline-lg">Featured Dishes</h2>
            <p className="text-body-sm text-text-secondary">Signature culinary favorites prepared fresh</p>
          </div>
          <span className="rounded-full bg-surface-container px-2 py-1 text-badge-xs text-text-secondary">
            {featured.length} Items
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} layout="home" />
          ))}
        </div>
      </section>

      {/* Instant kitchen dispatch */}
      <section className="container-page">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
              <Bike size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-headline-sm text-text-primary">Instant Kitchen Dispatch</h3>
              <p className="text-body-sm text-text-secondary">Orders dispatched in under 12 minutes</p>
            </div>
          </div>
          <Link
            to="/orders"
            className="flex shrink-0 items-center gap-0.5 text-label-md font-semibold text-primary"
          >
            Track
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-page py-4">
        <h2 className="mb-3 font-display text-headline-md text-text-primary md:text-headline-lg">
          Loved by Lagos foodies
        </h2>
        <div className="grid gap-3 md:grid-cols-3 md:gap-5">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
              <Quote size={20} className="text-primary" aria-hidden="true" />
              <blockquote className="text-body-md text-text-secondary">“{t.quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-label-md font-semibold text-primary dark:text-text-primary">
                  {t.name.charAt(0)}
                </span>
                <span className="flex flex-col">
                  <span className="text-label-md font-semibold text-text-primary">{t.name}</span>
                  <span className="text-body-sm text-text-tertiary">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
    </>
  )
}
