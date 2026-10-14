import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, PROMO } from '../data/site.js'

export function computeTotals(subtotal, promoApplied = false) {
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const discount = promoApplied ? Math.round((subtotal * PROMO.discountPercent) / 100) : 0
  return { subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount }
}

export function isValidPromo(code) {
  return (code || '').trim().toUpperCase() === PROMO.code
}
