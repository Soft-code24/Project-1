import { useEffect } from 'react'

const DEFAULT_TITLE = 'SavorBite — Fresh Food, Delivered Fast'
const DEFAULT_DESCRIPTION =
  'Freshly crafted Nigerian meals delivered fast across Lagos. Firewood jollof, suya, grilled steaks and more, prepared to order.'
const DEFAULT_IMAGE = '/images/hero-jollof-chicken.jpg'
const SITE_URL = 'https://savorbite.ng'

export function SEO({ title, description, image, path, type = 'website' }) {
  const fullTitle = title ? `${title} | SavorBite` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESCRIPTION
  const img = image || DEFAULT_IMAGE
  const url = `${SITE_URL}${path || ''}`

  useEffect(() => {
    document.title = fullTitle
    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    const setProp = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', desc)
    setProp('og:title', fullTitle)
    setProp('og:description', desc)
    setProp('og:image', img)
    setProp('og:url', url)
    setProp('og:type', type)
    setProp('twitter:card', 'summary_large_image')
    setProp('twitter:title', fullTitle)
    setProp('twitter:description', desc)
    setProp('twitter:image', img)
  }, [title, description, image, path, type])

  return null
}
