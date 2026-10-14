import { UtensilsCrossed } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-primary">
        <UtensilsCrossed size={30} aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-price-lg font-bold tnum text-primary">404</p>
      <h1 className="mt-1 font-display text-headline-lg text-text-primary">This page is off the menu</h1>
      <p className="mt-2 max-w-sm text-body-md text-text-secondary">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back to the food.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button to="/" size="lg">
          Back to home
        </Button>
        <Button to="/shop" variant="secondary" size="lg">
          Browse the menu
        </Button>
      </div>
    </div>
  )
}
