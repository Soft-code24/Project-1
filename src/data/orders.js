export const ORDER_STATUSES = {
  pending: {
    label: 'Pending payment',
    className: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-600',
  },
  preparing: {
    label: 'Preparing',
    className: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  'out-for-delivery': {
    label: 'Out for delivery',
    className: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-600',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border-red-200/60',
    dot: 'bg-red-600',
  },
}

export const STATUS_ORDER = ['pending', 'paid', 'preparing', 'out-for-delivery', 'delivered', 'cancelled']

export const PAYMENT_METHODS = [
  {
    id: 'paystack-card',
    label: 'Card payment',
    detail: 'Verve, Mastercard & Visa — secured by Paystack',
  },
  {
    id: 'paystack-transfer',
    label: 'Bank transfer',
    detail: 'Pay from any bank app — powered by Paystack',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    detail: 'Card, USSD or bank transfer via Flutterwave',
  },
  {
    id: 'cod',
    label: 'Cash on delivery',
    detail: 'Pay the rider when your order arrives',
  },
]

export const MOCK_ORDERS = [
  {
    id: 'SB-10482',
    customerId: 'you',
    customerName: 'Adaeze Okafor',
    createdAt: '2026-10-08T18:42:00',
    status: 'delivered',
    paymentMethod: 'paystack-card',
    items: [
      { productId: 'p03', name: 'Artisanal Jollof Bowl & Herb Chicken', price: 4500, qty: 2, image: '/images/jollof-bowl-chicken.jpg' },
      { productId: 'p11', name: 'Fresh Zesty Citrus Cooler (500ml)', price: 1800, qty: 2, image: '/images/citrus-cooler.jpg' },
    ],
    subtotal: 12600,
    discount: 0,
    deliveryFee: 1500,
    total: 14100,
    contact: { name: 'Adaeze Okafor', email: 'adaeze@example.com', phone: '+234 802 555 0147' },
    delivery: {
      address: '15A Adeola Odeku Street, Victoria Island',
      city: 'Lagos',
      instructions: 'Leave with the security post if I am not in.',
    },
  },
  {
    id: 'SB-10517',
    customerId: 'you',
    customerName: 'Adaeze Okafor',
    createdAt: '2026-10-10T13:05:00',
    status: 'out-for-delivery',
    paymentMethod: 'flutterwave',
    items: [
      { productId: 'p04', name: 'Charcoal Grilled Suya Steak', price: 6000, qty: 1, image: '/images/charcoal-suya-steak.jpg' },
      { productId: 'p05', name: 'Spicy Peppered Beef & Dodo Skewer', price: 3800, qty: 1, image: '/images/peppered-beef-dodo.jpg' },
    ],
    subtotal: 9800,
    discount: 0,
    deliveryFee: 1500,
    total: 11300,
    contact: { name: 'Adaeze Okafor', email: 'adaeze@example.com', phone: '+234 802 555 0147' },
    delivery: {
      address: '15A Adeola Odeku Street, Victoria Island',
      city: 'Lagos',
      instructions: 'Ring the bell twice.',
    },
  },
]
