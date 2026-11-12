import { supabase, isSupabaseConfigured, getCurrentAccessToken } from './supabase.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiRequest(path, options = {}) {
  let headers = {
    ...(options.headers || {}),
  }

  // Only set default JSON content type if not explicitly provided
  if (!options.headers || !Object.prototype.hasOwnProperty.call(options.headers, 'Content-Type')) {
    headers['Content-Type'] = 'application/json'
  }

  // Attach the current Supabase access token as a Bearer token. The token is
  // kept in sync with Supabase auth state via onAuthStateChange in supabase.js,
  // avoiding async getSession() calls on every request.
  const token = getCurrentAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  } else if (isSupabaseConfigured) {
    // Fallback: try reading the session directly (covers edge cases where the
    // auth state listener has not fired yet).
    try {
      const { data } = await supabase.auth.getSession()
      const sessionToken = data?.session?.access_token
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`
      }
    } catch {
      // Session unavailable — fall through without an Authorization header.
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || data.message || `API request failed (${res.status})`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  listProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/api/v1/products${qs ? '?' + qs : ''}`)
  },
  createProduct: (body) => apiRequest('/api/v1/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => apiRequest(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => apiRequest(`/api/v1/products/${id}`, { method: 'DELETE' }),
  updateStock: (id, stock) => apiRequest(`/api/v1/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  listCategories: () => apiRequest('/api/v1/categories'),
  createCategory: (body) => apiRequest('/api/v1/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    apiRequest(`/api/v1/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id, body) =>
    apiRequest(`/api/v1/categories/${id}`, { method: 'DELETE', body: JSON.stringify(body || {}) }),
  getSettings: () => apiRequest('/api/v1/settings'),
  updateSettings: (body) => apiRequest('/api/v1/settings', { method: 'PATCH', body: JSON.stringify(body) }),
  uploadSettingsLogo: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest('/api/v1/settings/logo', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': undefined },
    })
  },
  uploadProductImage: (productId, file) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiRequest(`/api/v1/products/${productId}/image`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': undefined },
    })
  },
  updateProduct: (id, body) => apiRequest(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => apiRequest(`/api/v1/products/${id}`, { method: 'DELETE' }),
  updateStock: (id, stock) => apiRequest(`/api/v1/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),
  listCategories: () => apiRequest('/api/v1/categories'),
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
  getAdminOrders: () => apiRequest('/api/v1/admin/orders'),
  updateAdminOrderStatus: (orderId, status) =>
    apiRequest(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAdminStats: () => apiRequest('/api/v1/admin/stats'),
  getBlogPost: (slug) => apiRequest(`/api/v1/blog/${slug}`),
  getCustomers: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    const qs = new URLSearchParams(clean).toString()
    return apiRequest(`/api/v1/admin/customers${qs ? '?' + qs : ''}`)
  },
  getCustomerStats: () => apiRequest('/api/v1/admin/customers/stats'),
  getCustomer: (id) => apiRequest(`/api/v1/admin/customers/${id}`),
  getCustomerOrders: (id, params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    const qs = new URLSearchParams(clean).toString()
    return apiRequest(`/api/v1/admin/customers/${id}/orders${qs ? '?' + qs : ''}`)
  },
  getCustomerNotes: (id) => apiRequest(`/api/v1/admin/customers/${id}/notes`),
  createCustomerNote: (id, content) =>
    apiRequest(`/api/v1/admin/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateCustomerNote: (id, noteId, content) =>
    apiRequest(`/api/v1/admin/customers/${id}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  deleteCustomerNote: (id, noteId) =>
    apiRequest(`/api/v1/admin/customers/${id}/notes/${noteId}`, {
      method: 'DELETE',
    }),
  suspendCustomerAccount: (id) =>
    apiRequest(`/api/v1/admin/customers/${id}/suspend`, {
      method: 'PATCH',
    }),
  reactivateCustomerAccount: (id) =>
    apiRequest(`/api/v1/admin/customers/${id}/reactivate`, {
      method: 'PATCH',
    }),
  deleteCustomerAccount: (id) =>
    apiRequest(`/api/v1/admin/customers/${id}`, {
      method: 'DELETE',
    }),
  getCoupons: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    const qs = new URLSearchParams(clean).toString()
    return apiRequest(`/api/v1/admin/coupons${qs ? '?' + qs : ''}`)
  },
  createCoupon: (body) =>
    apiRequest(`/api/v1/admin/coupons`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateCoupon: (id, body) =>
    apiRequest(`/api/v1/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  toggleCouponActive: (id, isActive) =>
    apiRequest(`/api/v1/admin/coupons/${id}/activate`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),
  deleteCoupon: (id) =>
    apiRequest(`/api/v1/admin/coupons/${id}`, {
      method: 'DELETE',
    }),
  getCouponStats: () => apiRequest(`/api/v1/admin/coupons/stats`),
  validateCoupon: (code, items = []) =>
    apiRequest(`/api/v1/coupons/validate`, {
      method: 'POST',
      body: JSON.stringify({ code, items }),
    }),
}

export default api
