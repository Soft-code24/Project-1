import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './Header.jsx'
import { BottomNav } from './BottomNav.jsx'
import { Footer } from './Footer.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function CustomerLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
