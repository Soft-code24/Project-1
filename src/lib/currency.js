export const CURRENCY = '₦'

export function formatNaira(amount) {
  return `${CURRENCY}${Number(amount || 0).toLocaleString('en-NG')}`
}

export function formatDate(dateInput) {
  const d = new Date(dateInput)
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateInput) {
  const d = new Date(dateInput)
  return d.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function orderNumber() {
  const n = Math.floor(10000 + Math.random() * 89999)
  return `SB-${n}`
}
