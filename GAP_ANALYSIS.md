# GAP_ANALYSIS.md

SavorBite e-commerce upgrade — gap analysis vs. required feature set.
Generated at Step 0 (inspect-first). Status reflects the code present before any upgrade work.

Legend:
- `exists and works` — feature present and functional (prototype or wired)
- `exists but incomplete` — present but missing a required capability (e.g. real Paystack, Supabase Auth, server-side validation)
- `missing` — not present at all

| # | Page / Feature | Route | Status | File paths | Notes |
|---|----------------|-------|--------|------------|-------|
| 1 | Landing page | `/` | exists but incomplete | `src/pages/Home.jsx`, `src/components/Footer.jsx` | Hero banner, featured dishes, contact info present. Missing: footer links to legal pages (`/privacy`, `/terms`, `/refunds`, `/delivery`) and legal pages themselves. |
| 2 | Collection (menu category) page | `/menu`, `/collections/:slug` | missing | `backend/src/routes/collection.routes.js` (backend only), `supabase/migrations/20261106120000_collections.sql` | Backend routes + DB exist. No frontend page/route for `/collections/:slug`. `/menu` not routed. |
| 3 | Product (dish) page | `/products/:slug` | exists but incomplete | `src/pages/ProductDetail.jsx` | Exists as `/product/:id` (by id, not slug). Missing: size/portion & extras selector, `slug`-based routing. DB has `slug`, `is_featured`, `image_url` already. |
| 4 | Cart | `/cart` | exists but incomplete | `src/pages/Cart.jsx`, `src/context/CartContext.jsx` | Works (localStorage). Missing: slide-out mini-cart from header; guest+logged-in persistence across sessions is localStorage only (no server sync). |
| 5 | Checkout | `/checkout` | exists but incomplete | `src/pages/Checkout.jsx` | Prototype: fake 1.4s "payment", order saved to localStorage only, no real Paystack, no server-side order creation/validation. Missing: server-side order creation, Paystack initialize+verify, webhook, emails. |
| 6 | Sign up / login | `/signup`, `/login` | exists but incomplete | `src/pages/Auth.jsx`, `src/context/AuthContext.jsx` | Exists as `/login`, `/register` (combined). Prototype auth = localStorage only, NOT Supabase Auth. Missing: `/signup` alias, Supabase Auth integration, profile auto-creation trigger (DB has it). |
| 7 | Forgot / reset password | `/forgot-password`, `/reset-password` | missing | — | Not present. Needs Supabase `resetPasswordForEmail` + `updateUser`. |
| 8 | Customer support | `/support` | exists but incomplete | `src/pages/Contact.jsx` | Contact page exists but is not `/support`, no `support_tickets` table, no FAQ accordion, no WhatsApp/phone buttons, no email alert to owner. |
| 9 | Blog | `/blog`, `/blog/:slug` | missing | — | Not present. Needs `blog_posts` table, list page, post page, SEO meta tags. |
| — | Order confirmation page | `/order/:id` | missing | — | Checkout shows inline success; no dedicated `/order/:id` route. |
| — | Order status display | `/orders` | exists and works | `src/pages/Orders.jsx` | Status badges, reorder, active/delivered tabs present. |
| — | Admin area | `/admin` | exists but incomplete | `src/admin/AdminLayout.jsx`, `AdminProducts.jsx`, `AdminOrders.jsx` | Exists for products + orders only. Missing: support tickets, blog posts management; role protection uses prototype auth (not Supabase role). |
| — | Legal pages | `/privacy`, `/terms`, `/refunds`, `/delivery` | missing | — | Not present. Draft text needed, marked "Draft: have a professional review before launch". |
| — | 404 page | `*` | exists and works | `src/pages/NotFound.jsx` | Present. |
| — | Loading skeletons | — | missing | — | Not present. |
| — | Empty states | various | exists but incomplete | `src/components/ui/Form.jsx` (`EmptyState`) | Present for cart/orders/search; not consistently applied to blog/support. |
| — | DB: blog_posts | — | missing | — | No `blog_posts` table. |
| — | DB: support_tickets | — | missing | — | No `support_tickets` table. |
| — | DB: products fields | `products` | exists and works | `supabase/migrations/20261014100005_products.sql` | `slug`, `is_featured`, `image_url`, `stock` all present. |
| — | DB: orders fields | `orders`, `order_items` | exists and works | `supabase/migrations/20261014100006_orders.sql` | `payment_status`, `paystack_reference` NOT yet present (needs adding); price snapshots present in `order_items`. |
| — | DB: profiles role | `profiles` | exists and works | `supabase/migrations/20261014100003_profiles.sql` | `role` column + `is_admin()` helper + signup trigger present. |
| — | Backend server | `backend/src/` | exists and works | Express + Supabase client + Paystack + multer + rate limiting | Auth, categories, products, collections, orders, payments, admin routes present. |
| — | Backend env | `backend/.env.example` | exists | `backend/.env.example` | Missing Brevo key var. |
| — | Frontend env | `.env.example` | missing | (root `.env.example` is empty) | No `VITE_*` vars defined; none should contain secrets. |
| — | SEO meta tags | — | missing | — | No per-page SEO titles/descriptions, Open Graph tags, or sitemap. |
| — | Accessibility | — | exists but incomplete | — | Semantic HTML + labels present in forms; no formal WCAG AA audit, no visible-focus review across all new pages. |

## Key observations

1. **Backend already exists** (`backend/`) — Express + Supabase + Paystack + multer. The frontend currently does NOT call it; it uses localStorage prototypes for auth, cart, and orders.
2. **Auth is a prototype** — `src/context/AuthContext.jsx` validates shape only and stores a fake user in localStorage. Must be replaced with Supabase Auth (`resetPasswordForEmail`, `updateUser`, profile trigger already in DB).
3. **Checkout is a prototype** — fake 1.4s timeout, order saved to localStorage. Must become server-side order creation with Paystack initialize + webhook verification.
4. **Database already has** `products` (with `slug`, `is_featured`, `image_url`), `orders`/`order_items` (price snapshots), `profiles` (with `role`), `collections`/`collection_products`/`product_images`, `payments`, `contact_messages`. Missing: `blog_posts`, `support_tickets`, `paystack_reference` column on orders.
5. **No `/signup` alias**, no `/forgot-password`, no `/reset-password`, no `/support`, no `/blog`, no legal pages, no `/order/:id`.
6. **Frontend `.env.example` is empty** — no `VITE_` variables defined. Secrets must never be in frontend.

## Plan

Proceed through Stages 2–10 as specified in the requirements prompt, reusing existing components (`Button`, `Field`, `EmptyState`, `Modal`, `Badges`, `QuantityStepper`, `ProductCard`, `Rating`) and the existing visual style (Tailwind tokens, `Plus Jakarta Sans` + `Inter`, orange primary, `bg-page-bg`/`surface-white`).
