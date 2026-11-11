import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, PROMO } from '../data/site.js'

export function computeTotals(subtotal, promoApplied = false, { deliveryFee = DELIVERY_FEE, freeDeliveryThreshold = FREE_DELIVERY_THRESHOLD } = {}) {
  const effectiveDeliveryFee =
    subtotal === 0 || subtotal >= freeDeliveryThreshold ? 0 : deliveryFee
  const discount = promoApplied ? Math.round((subtotal * PROMO.discountPercent) / 100) : 0
  return { subtotal, deliveryFee: effectiveDeliveryFee, discount, total: subtotal + effectiveDeliveryFee - discount }
}

export function isValidPromo(code) {
  return (code || '').trim().toUpperCase() === PROMO.code
}
