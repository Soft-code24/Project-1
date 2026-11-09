-- ============================================================================
-- Seed — initial catalogue so the backend is testable immediately.
-- Categories + 12 dishes + the homepage promo banner.
-- Idempotent (ON CONFLICT DO NOTHING) so it can be re-run safely.
-- Images point at the storefront's bundled photography; replace them with
-- Supabase Storage URLs via POST /products/:id/image in the admin dashboard.
-- ============================================================================

insert into public.categories (id, name, slug, description, sort_order, is_active) values
  ('11111111-1111-4111-8111-000000000001', 'Gourmet Bowls',    'gourmet-bowls',   'Smoky jollof, curries and hearty rice bowls', 1, true),
  ('11111111-1111-4111-8111-000000000002', 'Salads & Greens',  'salads-greens',   'Fresh, light and plant-forward bowls',       2, true),
  ('11111111-1111-4111-8111-000000000003', 'Grills & Suya',    'grills-suya',     'Charcoal grills, suya and peppered meats',   3, true),
  ('11111111-1111-4111-8111-000000000004', 'Burgers & Mains',  'burgers-mains',   'Stacked burgers, wings and filling mains',   4, true),
  ('11111111-1111-4111-8111-000000000005', 'Fresh Drinks',     'fresh-drinks',    'Cold-pressed juices and coolers',            5, true),
  ('11111111-1111-4111-8111-000000000006', 'Pastries & Sides', 'pastries-sides',  'Sweet bites and shareable sides',            6, true)
on conflict (id) do nothing;

insert into public.products
  (id, name, slug, category_id, price, compare_at_price, stock, short_description, description, image_url, serving, prep_time, tags, rating, reviews_count, is_featured, is_active)
values
  ('22222222-2222-4222-8222-000000000001', 'Smokey Party Jollof', 'smokey-party-jollof',
   '11111111-1111-4111-8111-000000000001', 3500, null, 24,
   'Wood-fired rice & dodo',
   'Our signature party jollof, slow-smoked over firewood for that unmistakable smoky finish, served with golden fried plantain and charred tatase pepper.',
   '/images/smokey-party-jollof.jpg', 'Serves 1', '15–20 min',
   array['popular', 'spicy'], 4.8, 118, false, true),

  ('22222222-2222-4222-8222-000000000002', 'Firewood Jollof & Herb Chicken', 'firewood-jollof-herb-chicken',
   '11111111-1111-4111-8111-000000000001', 5900, null, 18,
   'Smoky jollof, grilled herb chicken',
   'A hearty plate pairing firewood jollof rice with a juicy herb-marinated grilled chicken breast, fresh avocado slices and lime wedges.',
   '/images/hero-jollof-chicken.jpg', 'Serves 1', '20–25 min',
   array['popular', 'high-protein'], 4.9, 212, false, true),

  ('22222222-2222-4222-8222-000000000003', 'Artisanal Jollof Bowl & Herb Chicken', 'artisanal-jollof-bowl-herb-chicken',
   '11111111-1111-4111-8111-000000000001', 4500, null, 16,
   'Smoky jollof, herb chicken leg',
   'A steaming bowl of smoky jollof rice crowned with a grilled herb chicken leg, crisp plantain slices and colourful fresh bell peppers.',
   '/images/jollof-bowl-chicken.jpg', 'Serves 1', '20–25 min',
   array['popular'], 4.9, 128, true, true),

  ('22222222-2222-4222-8222-000000000004', 'Charcoal Grilled Suya Steak', 'charcoal-grilled-suya-steak',
   '11111111-1111-4111-8111-000000000003', 6000, null, 12,
   'Spiced beef with yaji dust',
   'Tender beef skewers charred over open charcoal, dusted with our house-ground yaji spice and roasted peanuts, served with red onion and lime.',
   '/images/charcoal-suya-steak.jpg', 'Serves 1', '15–20 min',
   array['high-protein', 'spicy'], 4.9, 96, false, true),

  ('22222222-2222-4222-8222-000000000005', 'Spicy Peppered Beef & Dodo Skewer', 'spicy-peppered-beef-dodo-skewer',
   '11111111-1111-4111-8111-000000000003', 3800, null, 20,
   'Peppered beef, caramelized dodo',
   'Succulent beef tenderloin chunks tossed in our scotch bonnet pepper sauce, skewered and grilled with caramelized plantain wheels.',
   '/images/peppered-beef-dodo.jpg', 'Serves 1', '15–20 min',
   array['spicy', 'high-protein'], 4.8, 95, true, true),

  ('22222222-2222-4222-8222-000000000006', 'Smoked Prawns & Dodo Medley', 'smoked-prawns-dodo-medley',
   '11111111-1111-4111-8111-000000000003', 5950, 7200, 6,
   'Tiger prawns in spicy butter glaze',
   'Plump tiger prawns glazed in a rich scotch bonnet butter, charred to perfection and served with golden plantain rounds. Today''s chef special.',
   '/images/chef-prawns.jpg', 'Serves 1', '20–25 min',
   array['high-protein'], 4.9, 74, false, true),

  ('22222222-2222-4222-8222-000000000007', 'Crispy Herb Chicken Wings', 'crispy-herb-chicken-wings',
   '11111111-1111-4111-8111-000000000004', 4200, null, 4,
   '6 pcs, garlic chili glaze',
   'Six golden-fried herb chicken wings tossed in a sticky garlic-chili-honey glaze, finished with scallions and toasted sesame seeds.',
   '/images/crispy-herb-wings.jpg', '6 pieces', '15–20 min',
   array['popular'], 4.7, 62, false, true),

  ('22222222-2222-4222-8222-000000000008', 'Smoked Suya Burger Deluxe', 'smoked-suya-burger-deluxe',
   '11111111-1111-4111-8111-000000000004', 5200, null, 0,
   'Suya patty, cheddar, brioche bun',
   'A stacked double-decker burger with a spiced suya beef patty, melted cheddar, crisp butter lettuce and red onion on a toasted brioche bun.',
   '/images/suya-burger.jpg', 'Serves 1', '18–22 min',
   array[]::text[], 4.9, 140, true, true),

  ('22222222-2222-4222-8222-000000000009', 'Avocado Crunch & Quinoa Salad', 'avocado-crunch-quinoa-salad',
   '11111111-1111-4111-8111-000000000002', 4200, null, 3,
   'Quinoa, avocado, tahini drizzle',
   'A bright superfood bowl of tricolor quinoa, baby spinach, roasted spiced chickpeas, pomegranate seeds and creamy avocado with lemon-tahini dressing.',
   '/images/avocado-quinoa-salad.jpg', 'Serves 1', '10–15 min',
   array['vegetarian'], 4.7, 62, true, true),

  ('22222222-2222-4222-8222-000000000010', 'Creamy Coconut Curry Bowl', 'creamy-coconut-curry-bowl',
   '11111111-1111-4111-8111-000000000001', 4800, null, 15,
   'Slow-simmered chick peas',
   'A rich, slow-simmered coconut curry with roasted sweet potatoes and chickpeas, fresh coriander and a squeeze of lime over fragrant jasmine rice.',
   '/images/coconut-curry-bowl.jpg', 'Serves 1', '15–20 min',
   array['vegetarian'], 4.8, 88, false, true),

  ('22222222-2222-4222-8222-000000000011', 'Fresh Zesty Citrus Cooler (500ml)', 'fresh-zesty-citrus-cooler',
   '11111111-1111-4111-8111-000000000005', 1800, null, 30,
   'Cold-pressed mint & lime',
   'A cold-pressed blend of citrus, mint and lime served over crushed ice. The perfect refreshment alongside any SavorBite main.',
   '/images/citrus-cooler.jpg', '500 ml', 'Ready',
   array['popular'], 4.8, 57, false, true),

  ('22222222-2222-4222-8222-000000000012', 'Gourmet Plantain Waffles', 'gourmet-plantain-waffles',
   '11111111-1111-4111-8111-000000000006', 3200, null, 0,
   'Spiced honey & berries',
   'Caramelized sweet plantain waffles topped with spiced honey butter and seasonal berries. A breakfast favourite, available while stock lasts.',
   '/images/plantain-waffles.jpg', 'Serves 1', '12–15 min',
   array[]::text[], 4.8, 57, false, true)
on conflict (id) do nothing;

insert into public.banners
  (id, title, subtitle, image_url, badge_text, cta_label, cta_link, promo_code, placement, is_active, sort_order)
values
  ('33333333-3333-4333-8333-000000000001',
   'Craving authentic taste?',
   'Get 20% off your first order today. Prepared fresh on demand.',
   '/images/hero-jollof-chicken.jpg',
   'CODE: SAVOR20',
   'Order Now',
   '/shop',
   'SAVOR20',
   'home-hero',
   true,
   1)
on conflict (id) do nothing;
