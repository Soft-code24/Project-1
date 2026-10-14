import { useEffect, useState } from 'react'

function msUntilMidnight() {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  return end - now
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(total / 3600)).padStart(2, '0')
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function CountdownTimer({ className = '' }) {
  const [remaining, setRemaining] = useState(msUntilMidnight)

  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className={`tnum ${className}`} aria-label="Time left for today's special">
      {formatRemaining(remaining)} left
    </span>
  )
}
