// Automated regression test: registration-to-profile name flow
// Tests that full_name flows from registration -> Auth metadata -> public.profiles -> account page
// Uses existing demo customer (new registration rate-limited by Supabase)
// Run against STAGING only: kipgcxalqvmkwlcnfxwt

import http from 'node:http';
import https from 'node:https';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcGdjeGFscXZta3dsY25meHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDAwOTIsImV4cCI6MjEwOTk3NjA5Mn0.SIMuvXD8uRjx9X7nhpZcUFAYfr7e7woAqB-VO3sObmY';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcGdjeGFscXZta3dsY25meHd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDQwMDA5MiwiZXhwIjoyMTA5OTc2MDkyfQ.9Q0X_62oDfMewjX8n3lS9k2U3NBq2n9d5LcNS_WJm8s';

let passed = 0;
let failed = 0;
function t(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  PASS: ${name}`); }
  else { failed++; console.log(`  FAIL: ${name} ${extra}`); }
}

function req(mod, host, port, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const r = mod.request({ hostname: host, port, path, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    const bodyToWrite = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    if (bodyToWrite) r.write(bodyToWrite);
    r.end();
  });
}

(async () => {
  console.log('\n=== REGRESSION TEST: Registration-to-Profile Name Flow (staging) ===\n');
  console.log('Using demo customer to avoid Supabase email rate limits\n');

  // ---- Test 1: Login with existing demo customer ----
  console.log('--- Login ---');
  const loginBody = JSON.stringify({ email: 'demo@savorbite.ng', password: 'Demo@1234' });
  const login = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/auth/v1/token?grant_type=password', 'POST',
    { apikey: ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
    loginBody);
  t('Login returns 200', login.status === 200, `got ${login.status}`);

  let accessToken = null;
  let userId = null;
  if (login.status === 200) {
    const data = JSON.parse(login.body);
    accessToken = data.access_token;
    userId = data.user.id;
    t('Access token obtained', !!accessToken);
    t('User id obtained', !!userId);
  }

  // ---- Test 2: Profile name persists in database ----
  console.log('\n--- Profile persistence ---');
  if (userId) {
    const profileResp = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
      `/rest/v1/profiles?select=full_name,email,role&id=eq.${userId}`, 'GET',
      { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY });
    const profiles = JSON.parse(profileResp.body);
    t('Profile row exists', profiles.length === 1, `got ${profiles.length}`);
    if (profiles.length > 0) {
      t('Profile has full_name (not null/empty)', profiles[0].full_name && profiles[0].full_name.trim().length > 0, `got "${profiles[0].full_name}"`);
      t('Profile email matches', profiles[0].email === 'demo@savorbite.ng', `got ${profiles[0].email}`);
      t('Profile role is customer', profiles[0].role === 'customer', `got ${profiles[0].role}`);
    }
  }

  // ---- Test 3: Authenticated API requests work (bearer token) ----
  console.log('\n--- Authenticated API requests ---');
  if (accessToken) {
    const ordersResp = await req(http, 'localhost', 5000, '/api/v1/orders', 'GET',
      { 'Authorization': 'Bearer ' + accessToken });
    t('GET /api/v1/orders returns 200', ordersResp.status === 200, `got ${ordersResp.status}`);

    const ordersResp2 = await req(http, 'localhost', 5000, '/api/v1/orders', 'GET',
      { 'Authorization': 'Bearer ' + accessToken });
    t('Session persists on repeat request', ordersResp2.status === 200, `got ${ordersResp2.status}`);
  }

  // ---- Test 4: Edit Profile endpoint works ----
  console.log('\n--- Edit Profile endpoint ---');
  if (accessToken) {
    const updateResp = await req(http, 'localhost', 5000, '/api/v1/customer/profile', 'PATCH',
      { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      { full_name: 'Regression Test Customer' });
    t('PATCH /api/v1/customer/profile returns 200', updateResp.status === 200, `got ${updateResp.status}`);

    if (updateResp.status === 200) {
      const updateData = JSON.parse(updateResp.body);
      t('Updated fullName returned', updateData.profile.fullName === 'Regression Test Customer', `got ${updateData.profile.fullName}`);
      const dbResp = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
        `/rest/v1/profiles?select=full_name&id=eq.${userId}`, 'GET',
        { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY });
      const dbProfiles = JSON.parse(dbResp.body);
      t('DB updated with new name', dbProfiles[0]?.full_name === 'Regression Test Customer', `got "${dbProfiles[0]?.full_name}"`);
    }
  }

  // ---- Test 5: Edge cases ----
  console.log('\n--- Edge cases ---');
  if (accessToken) {
    const emptyResp = await req(http, 'localhost', 5000, '/api/v1/customer/profile', 'PATCH',
      { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      { full_name: '' });
    t('Empty name rejected with 400', emptyResp.status === 400 || emptyResp.status === 422, `got ${emptyResp.status}`);

    const longResp = await req(http, 'localhost', 5000, '/api/v1/customer/profile', 'PATCH',
      { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      { full_name: 'A'.repeat(101) });
    t('Too-long name rejected with 400', longResp.status === 400 || longResp.status === 422, `got ${longResp.status}`);

    const noTokenResp = await req(http, 'localhost', 5000, '/api/v1/customer/profile', 'PATCH',
      {}, { full_name: 'No Token' });
    t('No token rejected with 401/403', noTokenResp.status === 401 || noTokenResp.status === 403, `got ${noTokenResp.status}`);
  }

  // Restore demo profile
  console.log('\n--- Restore demo profile ---');
  if (userId) {
    await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
      `/rest/v1/profiles?id=eq.${userId}`, 'PATCH',
      { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
      { full_name: 'Demo Customer', phone: null });
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
