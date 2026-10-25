export function CarIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 15.5 5 11a2.5 2.5 0 0 1 2.4-1.8h9.2A2.5 2.5 0 0 1 19 11l1.5 4.5v3a1 1 0 0 1-1 1h-1.3a1 1 0 0 1-1-1v-1H6.8v1a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z"
      />
      <circle cx="7.5" cy="15" r="1" fill="currentColor" />
      <circle cx="16.5" cy="15" r="1" fill="currentColor" />
    </svg>
  )
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
        <CarIcon />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
        AutoVault
      </span>
    </span>
  )
}
