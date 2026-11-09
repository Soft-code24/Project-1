<!-- Render deployment guide for SavorBite API -->

1. Push this repository to GitHub.
2. In Render, create a new "Web Service" and connect the repo.
3. Render auto-detects `render.yaml` (rootDir: `backend`).
4. Add these environment variables in the Render dashboard:
   - NODE_ENV=production
   - PORT=10000
   - CLIENT_URL=https://your-storefront.vercel.app
   - SUPABASE_URL=https://<project>.supabase.co
   - SUPABASE_ANON_KEY=<anon key>
   - SUPABASE_SERVICE_ROLE_KEY=<service role key>
   - SUPABASE_JWT_SECRET=<jwt secret>
   - PAYSTACK_SECRET_KEY=sk_live_...
   - PAYSTACK_PUBLIC_KEY=pk_live_...
   - PAYSTACK_CALLBACK_URL=https://api.../checkout
5. Apply the migrations to your Supabase project:
   supabase db push --project-ref <ref>
   # or run the files in supabase/migrations/ in order in the SQL editor.
6. Create an admin user: sign up via /auth/register, then set
   update public.profiles set role = 'admin' where email = 'you@example.com';

Build command: npm install && npm run build
Start command: npm start
