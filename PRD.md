Product Requirements Document (PRD)

Food Selling & Marketing Website

Project Type: Small-scale food e-commerce website
Technology Stack: MEVN + Supabase
Version: 1.0

---

1. Project Overview

The project is a simple, responsive website for marketing and selling food products online. Customers can browse available food items, view product details, add items to a cart, and place orders. Administrators can manage products and monitor orders.

2. Project Objectives

- Showcase food products with images, descriptions, and prices.
- Make it easy for customers to order food online.
- Provide secure online payment options.
- Enable administrators to manage products and orders.
- Deliver a fast, mobile-friendly user experience.

3. Target Users

Customers

- Browse food products.
- View product details and prices.
- Add products to a cart and place orders.
- Make payments and track order history.

Administrators

- Manage products and inventory.
- Manage food categories and prices.
- Monitor and process customer orders.

4. Core Features

4.1 Customer Features

- Homepage with promotional banners and featured food items.
- Food catalogue with categories and search functionality.
- Product details, images, prices, and availability.
- Shopping cart with quantity management.
- Customer registration and login.
- Checkout with delivery details.
- Online payments through Paystack or Flutterwave.
- Order confirmation and order history.
- Contact page with business information.

4.2 Admin Features

- Secure admin login.
- Add, edit, and delete food products.
- Upload and manage product images.
- Manage food categories and prices.
- Update product availability and stock.
- View and manage customer orders.
- Update order statuses.

5. Technology Stack

Component| Technology
Programming Language| JavaScript
Frontend| Vue.js
Styling| Tailwind CSS
Backend| Node.js + Express.js
Database| Supabase PostgreSQL
Authentication| Supabase Auth
Image Storage| Supabase Storage
Data Access| Supabase JavaScript SDK
Payments| Paystack / Flutterwave
Frontend Hosting| Vercel
Backend Hosting| Render
Version Control| Git + GitHub

6. Main Pages

1. Home
2. Shop / Food Catalogue
3. Product Details
4. Shopping Cart
5. Checkout
6. Login / Register
7. My Orders
8. About Us
9. Contact Us
10. Admin Dashboard

7. Basic User Flow

1. Customer visits the website.
2. Customer browses or searches for food.
3. Customer adds products to the cart.
4. Customer proceeds to checkout.
5. Customer enters contact and delivery details.
6. Customer completes payment or selects an enabled alternative payment method.
7. The system records the order and confirms it.
8. The administrator receives and processes the order.

8. Design Requirements

- Clean, modern, food-focused design.
- Light background with appetizing food imagery.
- Simple navigation and clear calls to action.
- Responsive layout for mobile, tablet, and desktop.
- Readable typography and consistent colours.
- Fast-loading pages and optimized images.

9. Security Requirements

- Secure authentication and role-based access.
- Supabase Row Level Security (RLS) for database access.
- Validate orders, prices, and payment status on the server.
- Keep secret API keys and payment credentials out of frontend code.
- Restrict product management to authorized administrators.

10. Minimum Viable Product (MVP) Scope

The first version will include:

- Homepage and food catalogue.
- Product details and shopping cart.
- Customer authentication.
- Checkout and order management.
- Payment integration.
- Admin dashboard.
- Supabase database, authentication, and image storage.

Features such as loyalty points, customer reviews, delivery tracking, and advanced analytics can be added later.

11. Success Criteria

- Customers can browse products and place orders successfully.
- Payments are verified before orders are marked as paid.
- Administrators can manage products and orders.
- The website works across mobile and desktop devices.
- Customer and order data are protected.

12. Project Deliverable

A functional, responsive food-selling website with a customer storefront, an administrative dashboard, and Supabase-powered database, authentication, and image storage.