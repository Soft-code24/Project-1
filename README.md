# SavorBite — E-commerce Food Ordering Platform

SavorBite is a full-stack food ordering website: a React + Vite + Tailwind storefront and a Node.js + Express API backed by Supabase (PostgreSQL, Auth, Storage) with Paystack payments and Brevo transactional email.

## Tech Stack

### Frontend (`/`)
- React 18, Vite 5, React Router DOM
- Tailwind CSS (custom Warm Culinary Modern theme)
- Lucide React icons
- Supabase Client (browser)
- LocalStorage cart persistence

### Backend (`/backend`)
- Node.js 18+, Express 4 (ESM)
- Supabase JS (server, service-role key)
- Paystack API (payments)
- Multer (image uploads to Supabase Storage)
- Express Rate Limiter, express-validator, Helmet, CORS, Morgan

### Database
- Supabase PostgreSQL with Row Level Security (RLS)
- Migrations in `/supabase/migrations/`

## Project Structure

```
/ (frontend)
├── src/
│   ├── app.jsx                 # Routes + layouts
│   ├── main.jsx                # Entry point
│   ├── index.css               # Tailwind + theme tokens
│   ├── lib/                    # currency, cartTotals, api, supabase client
│   ├── data/                   # products, categories, collections, site info
│   ├── components/             # Header, Footer, Logo, BottomNav, MiniCart, SEO
│   ├── components/ui/          # Button, Field, EmptyState, Modal, Badges, QuantityStepper
│   ├── context/                # AuthContext, CartContext, OrderContext, ProductContext, ToastContext
│   ├── pages/                  # Home, Shop, Collections, ProductDetail, Cart, Checkout, OrderConfirmation, Auth, ForgotPassword, ResetPassword, Orders, About, Contact, Support, Blog, BlogPost, Privacy, Terms, Refunds, Delivery, NotFound, Account
│   └── admin/                  # AdminLayout, AdminLogin, AdminOverview, AdminProducts, AdminOrders
├── public/                     # sitemap.xml, robots.txt, favicon.svg, images/
├── .env.example                # Frontend env vars (VITE_*)
├── package.json
├── tailwind.config.js
├── vite.config.js
├── postcss.config.js
├── GAP_ANALYSIS.md             # Gap analysis from Step 0
└── vercel.json                 # Vercel deployment config

/backend
├── src/
│   ├── app.js                  # Express app + middleware
│   ├── server.js               # Entry point
│   ├── config/                 # env.js (env validation + business rules)
│   ├── middleware/             # auth, errorHandler, notFound, rateLimit, validate
│   ├── routes/                 # index, auth, categories, products, collections, blog, support, orders, payments, admin
│   ├── controllers/            # auth, category, product, collection, blog, support, order, payment, admin
│   ├── services/               # supabase, paystack, email (Brevo)
│   ├── utils/                  # ApiError, asyncHandler
│   └── validators/             # auth, product, order
├── .env.example                # Backend env vars
├── package.json
└── render.yaml                 # Render deployment config

/supabase/migrations/           # Database migrations (numbered, run in order)
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Project\ 1
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Environment variables

Copy `.env.example` to `.env` in both the root and `backend/` directories and fill in your values.

**Root `.env.example` (frontend):**
```
VITE_API_URL=http://localhost:5000
```

**Backend `.env.example` (`backend/.env.example`):**
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_CALLBACK_URL=http://localhost:5173/checkout

BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=hello@savorbite.ng
BREVO_SENDER_NAME=SavorBite
BREVO_OWNER_EMAIL=hello@savorbite.ng
```

> **Security:** Never commit `.env` files. The `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` must never be exposed in frontend code. No `VITE_*` variable should contain a secret.

### 5. Run the database migrations

**Do not run `supabase db push` or `supabase db reset`.** Apply the migration files manually in the Supabase SQL Editor, in timestamp order:

1. `supabase/migrations/20261014100001_extensions.sql`
2. `supabase/migrations/20261014100002_helpers.sql`
3. `supabase/migrations/20261014100003_profiles.sql`
4. `supabase/migrations/20261014100004_categories.sql`
5. `supabase/migrations/20261014100005_products.sql`
6. `supabase/migrations/20261014100006_orders.sql`
7. `supabase/migrations/20261106120000_collections.sql`
8. `supabase/migrations/20261014140000_add_blog_support_tables.sql`

All migrations are idempotent (`IF NOT EXISTS`) and safe to re-run.

After migrating, promote an admin user:

```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

### 6. Run the development servers

**Frontend:**
```bash
npm run dev    # http://localhost:5173
```

**Backend:**
```bash
cd backend
npm run dev    # http://localhost:5000
```

## Key Features

### Customer Storefront
- Home page with hero banner, trust pillars, categories, featured dishes, testimonials
- Shop with search, category/diet filters, sorting, price range filter
- Collection (menu category) pages with filtering
- Product detail pages with gallery, ingredients, quantity selector, add to cart
- Shopping cart with persistent localStorage, slide-out mini-cart from header
- Checkout with server-side order creation, Paystack payment initiation, order confirmation
- Auth (login/register) via Supabase Auth, forgot/reset password
- Order history with status tracking and reorder
- Account page with profile and delivery preferences
- Contact/support page with FAQ accordion
- Blog with list and detail pages, SEO meta tags
- Legal pages: Privacy, Terms, Refund & Cancellation, Delivery Policy

### Admin Dashboard (`/admin/login`)
- Overview with revenue, orders, average order value, weekly sales chart, status breakdown, low-stock alerts
- Products CRUD (add/edit/delete, stock management, featured toggle, image upload)
- Categories CRUD
- Orders list with status updates (pending → paid → preparing → out-for-delivery → delivered/cancelled)
- Orders statistics dashboard
- Support tickets list with status management
- Blog posts CRUD

### Backend API (`/api/v1`)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET /categories`, `POST/PATCH/DELETE /categories` (admin)
- `GET /products`, `GET /products/:id`, `POST/PUT/DELETE /products` (admin), `PATCH /products/:id/stock` (admin), `POST /products/:id/image` (admin)
- `GET /collections`, `GET /collections/:slug`, `POST/PATCH/DELETE /collections` (admin), `POST/DELETE /collections/:id/products` (admin)
- `GET /blog`, `GET /blog/:slug`, `POST/PATCH/DELETE /blog` (admin)
- `POST /support` (public), `GET/PATCH/DELETE /support` (admin)
- `POST /orders` (authenticated), `GET /orders` (authenticated), `GET /orders/:id` (authenticated)
- `POST /payments/paystack/initialize`, `GET /payments/paystack/verify/:reference`, `POST /payments/paystack/webhook`
- `GET /admin/orders`, `GET /admin/stats`, `PATCH /admin/orders/:id/status` (admin)

### Payments (Paystack)
- Orders are created server-side with prices recalculated from the database (client prices are never trusted)
- Paystack transaction initialized server-side; customer redirected to Paystack to complete payment
- Paystack webhook verifies signature and transaction amount before marking an order paid (idempotent)
- Cash on delivery option available

### Email (Brevo)
- Order confirmation email to customer
- New order alert to store owner
- Support ticket alert to store owner
- All email sending is server-side only

## Migrations (run in order)

| File | Purpose |
|------|---------|
| `20261014100001_extensions.sql` | pgcrypto, pg_trgm extensions + helper functions |
| `20261014100002_helpers.sql` | is_admin(), current_app_role(), set_updated_at(), order number sequence |
| `20261014100003_profiles.sql` | profiles table (role, signup trigger, role-change guard) |
| `20261014100004_categories.sql` | categories table |
| `20261014100005_products.sql` | products table (slug, search_vector, tags, full-text search) |
| `20261014100006_orders.sql` | orders, order_items, order_status_history tables + triggers |
| `20261106120000_collections.sql` | collections, collection_products, product_images tables |
| `20261014140000_add_blog_support_tables.sql` | blog_posts, support_tickets tables + orders.paystack_reference column + RLS |

## Production Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set root directory to project root
3. Add `VITE_API_URL` environment variable (your Render backend URL)
4. Deploy

### Backend (Render)
1. Connect your GitHub repo to Render
2. Create a Web Service, root directory: `backend`
3. Render auto-detects `render.yaml` (build: `npm install && npm run build`, start: `npm start`)
4. Add environment variables from `backend/.env.example`
5. Set `NODE_ENV=production`

## Testing Checklist

- [ ] Home page loads with hero banner and featured dishes
- [ ] Shop page search, category/diet filters, sorting work
- [ ] Collection pages show correct products
- [ ] Product detail page shows gallery, price, stock status, add to cart
- [ ] Add to cart from home/shop/product pages updates mini-cart
- [ ] Cart page quantity update, remove, subtotal, delivery fee work
- [ ] Checkout form validation, server-side order creation, Paystack initialization (test keys)
- [ ] Paystack webhook marks order paid (test with webhook simulator)
- [ ] Order confirmation page shows order details
- [ ] Auth: register, login, logout, forgot password, reset password
- [ ] Protected account page requires login
- [ ] Orders list shows customer's orders only (not others')
- [ ] Admin login with admin role, products CRUD, orders status update
- [ ] Support ticket submission and admin status management
- [ ] Blog list and detail pages
- [ ] Legal pages load with draft disclaimer
- [ ] Mobile responsiveness at 360px, 768px, 1024px, 1440px
- [ ] Keyboard navigation works throughout
- [ ] No console errors on any page

## Draft Content Notice

Legal pages (`/privacy`, `/terms`, `/refunds`, `/delivery`) contain draft text marked "Draft: have a professional review before launch." These are not legal advice and should be reviewed by a qualified professional before production use.

## Security

- All secrets (Paystack secret key, Supabase service-role key, Brevo API key) live in server environment variables only
- No `VITE_*` variable contains a secret
- Orders are created server-side; prices are recalculated from the database
- Paystack webhook signature is verified before marking orders paid
- Row Level Security restricts customers to their own data; admins have full access
- No card data is stored; Paystack handles payment details