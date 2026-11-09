const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || `API request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  createOrder: (body) => apiRequest('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) }),
  createTicket: (body) => apiRequest('/api/v1/support', { method: 'POST', body: JSON.stringify(body) }),
  initializePaystack: (orderId) =>
    apiRequest(`/api/v1/payments/paystack/initialize`, {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    }),
  verifyPaystack: (reference) => apiRequest(`/api/v1/payments/paystack/verify/${reference}`),
  getOrder: (id) => apiRequest(`/api/v1/orders/${id}`),
  getMyOrders: () => apiRequest('/api/v1/orders'),
  getBlogPost: (slug) => apiRequest(`/api/v1/blog/${slug}`),
}

export default api
