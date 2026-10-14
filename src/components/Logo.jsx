export function SavorBiteLogo({ className = 'h-8 w-8', showWordmark = false, wordmarkClassName = '' }) {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className={className} role="img" aria-label="SavorBite logo">
        <defs>
          <linearGradient id="sb-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F28C28" />
            <stop offset="100%" stopColor="#3FA34D" />
          </linearGradient>
        </defs>
        {/* ring with a bite taken out of the top-right */}
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          stroke="url(#sb-ring)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="150.8"
          strokeDashoffset="118"
          transform="rotate(-72 32 32)"
        />
        {/* fork */}
        <g fill="#EA6A0A">
          <rect x="19" y="15" width="2.6" height="9" rx="1.3" />
          <rect x="24.2" y="15" width="2.6" height="9" rx="1.3" />
          <rect x="29.4" y="15" width="2.6" height="9" rx="1.3" />
          <path d="M19 24h13c0 4.6-1.4 7.8-3.9 11h-5.2C20.4 31.8 19 28.6 19 24z" />
          <path d="M26.4 34.8c-1.1 4.4-2.9 8-5.2 11l3.8 2.4c2.8-3.7 4.5-8 5.3-12.6l-3.9-.8z" />
        </g>
        {/* leaf */}
        <path
          d="M39.5 26.5c5.2-2.2 10.4 1.3 11.4 7.3 1 6.1-3.1 10.6-8.4 9.6-4.9-.9-7.6-6.3-6.7-10.4.4-1.9 1.8-4.3 3.7-6.5z"
          fill="#3FA34D"
        />
        <path
          d="M37.8 43.5c.6-4.6 2.6-8.6 5.6-12.2"
          stroke="#1F7A38"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className={`font-display text-headline-md text-text-primary tracking-tight ${wordmarkClassName}`}>
          Savor<span className="text-basil">Bite</span>
        </span>
      )}
    </span>
  )
}
