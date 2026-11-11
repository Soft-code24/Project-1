export function applyBrandColors(primary, accent) {
  const root = document.documentElement
  if (primary) root.style.setProperty('--sb-primary', primary)
  if (accent) root.style.setProperty('--sb-accent', accent)
}

export function getBrandColors() {
  const root = document.documentElement
  return {
    primary: getComputedStyle(root).getPropertyValue('--sb-primary').trim() || '#F28C28',
    accent: getComputedStyle(root).getPropertyValue('--sb-accent').trim() || '#3FA34D',
  }
}
