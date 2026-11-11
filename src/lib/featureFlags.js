export const FEATURES = {
  // Customer coupon validation via POST /api/v1/coupons/validate
  // Disabled by default — legacy SAVOR20 promo remains active until
  // atomicOrderRpc backend flag is enabled.
  //
  // COUPON FLAG CONSISTENCY:
  // This flag must match BUSINESS_RULES.atomicOrderRpc on the backend.
  // Customers must not be able to apply a database coupon in the UI unless
  // the backend can honor that coupon during order creation via the atomic
  // RPC. Both flags are disabled by default; enable them together.
  couponValidation: import.meta.env.VITE_COUPON_VALIDATION === 'true',
}
