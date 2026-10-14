import { Link } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, Heart, Leaf, PackageCheck, Users } from 'lucide-react'
import { SavorBiteLogo } from '../components/Logo.jsx'
import { Button } from '../components/ui/Button.jsx'
import { HERO_IMAGE } from '../data/site.js'

const stats = [
  { value: '12k+', label: 'Meals delivered', icon: PackageCheck },
  { value: '28 min', label: 'Average delivery', icon: Clock },
  { value: '4.8/5', label: 'Customer rating', icon: Heart },
  { value: '35+', label: 'Local suppliers', icon: Leaf },
]

const values = [
  {
    icon: ChefHat,
    title: 'Cooked to order',
    text: 'Every meal is prepared fresh after you order — never sitting under a heat lamp.',
  },
  {
    icon: Leaf,
    title: 'Farm-sourced',
    text: 'We buy produce and proteins from trusted Nigerian farms and markets daily.',
  },
  {
    icon: Users,
    title: 'Community first',
    text: 'We hire local riders and chefs, and reinvest in Lagos food communities.',
  },
]

export default function About() {
  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="container-page pt-5">
        <div className="relative overflow-hidden rounded-2xl bg-charcoal shadow-card">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-charcoal/30" />
          <div className="relative flex flex-col gap-3 p-6 md:p-12">
            <SavorBiteLogo className="h-10 w-10" />
            <h1 className="max-w-lg font-display text-hero-mobile text-white md:text-hero">
              Real food, made by real chefs, delivered while it’s still hot.
            </h1>
            <p className="max-w-md text-body-md text-gray-300 md:text-body-lg">
              SavorBite started in a small Lekki kitchen with one goal: make authentic Nigerian flavors
              available to everyone, in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white p-5 text-center shadow-card">
              <stat.icon size={20} className="mx-auto text-primary" aria-hidden="true" />
              <p className="mt-2 font-display text-price-lg font-bold tnum text-text-primary">{stat.value}</p>
              <p className="text-body-sm text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="container-page">
        <div className="grid gap-6 rounded-2xl border border-border-subtle bg-white p-6 shadow-card md:grid-cols-2 md:p-10">
          <div>
            <h2 className="font-display text-headline-lg text-text-primary">Our story</h2>
            <p className="mt-3 text-body-lg text-text-secondary">
              In 2021, our founder Ada was tired of choosing between fast food and good food. She began
              cooking firewood jollof and suya for her street — and the queue grew overnight.
            </p>
            <p className="mt-3 text-body-lg text-text-secondary">
              Today, SavorBite is a full cloud kitchen with a team of chefs and riders who share the same
              obsession: food that tastes like someone made it with care, because they did.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {values.map((value) => (
              <div key={value.title} className="flex gap-3.5 rounded-xl bg-page-bg p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-primary">
                  <value.icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-label-md font-semibold text-text-primary">{value.title}</h3>
                  <p className="text-body-md text-text-secondary">{value.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-10 text-center shadow-card">
          <h2 className="font-display text-hero-mobile text-white">Hungry already?</h2>
          <p className="max-w-md text-body-md text-white/85">
            Explore today’s menu and have dinner sorted in under 30 minutes.
          </p>
          <Button to="/shop" size="lg" variant="secondary" className="group">
            Browse the menu
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  )
}
