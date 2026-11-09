const controlBase =
  'w-full rounded-lg border bg-surface px-3.5 py-2 text-body-md text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-1'

export const controlClass = (invalid) =>
  `${controlBase} ${invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border-strong focus:border-primary focus:ring-primary'}`

export function Field({ label, htmlFor, error, hint, required, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-label-md text-text-primary">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-body-sm text-text-tertiary">{hint}</p>}
      {error && (
        <p className="text-body-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-surface px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20 text-primary dark:text-text-primary">
          <Icon size={26} aria-hidden="true" />
        </div>
      )}
      <h3 className="font-display text-headline-md text-text-primary">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-body-md text-text-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
