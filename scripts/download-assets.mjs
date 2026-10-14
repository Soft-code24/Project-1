// One-off asset downloader: pulls food photography and logo from the Stitch design files.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'images')
mkdirSync(outDir, { recursive: true })

const sources = [
  'stitch_food_e_commerce_brand_design/savorbite_home/code.html',
  'stitch_food_e_commerce_brand_design/savorbite_shop_catalogue/code.html',
]

// Ordered mapping of URL substring -> file name, derived from the design mockups.
const wanted = [
  ['AB6AXuCtWNcwKIm7Vf4e0flkLeUp346L', 'hero-jollof-chicken'],
  ['AB6AXuAMUICz-zi8YzJ5u3_96XYto99W', 'chef-prawns'],
  ['AB6AXuDv_PIR2fO2q7n51QegQ8f37', 'jollof-bowl-chicken'],
  ['AB6AXuBFh8R36_iYduymCBewk_QhJUH', 'peppered-beef-dodo'],
  ['AB6AXuDECcNyOQzGGzoh1HTLQmkk8mGr', 'avocado-quinoa-salad'],
  ['AB6AXuA0uvCVH35uEYOjNkYnOhNzgwuI', 'suya-burger'],
  ['AB6AXuB33dMVUkJgF2AGJjl3Qm5u6Wum', 'smokey-party-jollof'],
  ['AB6AXuDP3s5q2n2RHj31dBtAhHavL9Dw', 'charcoal-suya-steak'],
  ['AB6AXuBtrqYJdBu1SnHMqhY6wctc8NE2', 'citrus-cooler'],
  ['AB6AXuBWRL4hFucSJ3AFu438KCe8rwx8', 'crispy-herb-wings'],
  ['AB6AXuBMCHFJz7BqamswdOUfgfkSer1A', 'plantain-waffles'],
  ['AB6AXuBOoC3IV0gALlxLhY2-TGlUageQp', 'coconut-curry-bowl'],
  ['AEtjO1WVXNuXcDKoKcM_wJ9BQcFyqaqV', 'savorbite-logo'],
]

const urls = new Set()
for (const src of sources) {
  const html = readFileSync(join(root, src), 'utf8')
  const patterns = [/src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"/g, /url\('(https:\/\/lh3\.googleusercontent\.com[^']+)'\)/g]
  for (const re of patterns) {
    for (const m of html.matchAll(re)) urls.add(m[1])
  }
}

console.log(`Found ${urls.size} image urls`)
let ok = 0
for (const url of urls) {
  const hit = wanted.find(([frag]) => url.includes(frag))
  if (!hit) {
    console.log(`SKIP (unmapped): ${url.slice(0, 80)}...`)
    continue
  }
  const dest = join(outDir, `${hit[1]}.jpg`)
  if (existsSync(dest)) {
    console.log(`EXISTS ${hit[1]}`)
    ok++
    continue
  }
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(dest, buf)
    console.log(`OK ${hit[1]} (${(buf.length / 1024).toFixed(0)} KB)`)
    ok++
  } catch (err) {
    console.log(`FAIL ${hit[1]}: ${err.message}`)
  }
}
console.log(`Done: ${ok}/${wanted.length} assets`)
