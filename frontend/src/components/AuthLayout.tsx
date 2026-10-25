import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

/** Split-screen layout shared by the login and registration pages. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-brand-600/40 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 size-[24rem] rounded-full bg-cyan-500/20 blur-3xl"
          aria-hidden
        />
        <Logo light />
        <div className="relative">
          <p className="text-4xl leading-tight font-extrabold tracking-tight">
            Every car on the lot,
            <br />
            <span className="text-brand-100">one dashboard.</span>
          </p>
          <p className="mt-4 max-w-md text-slate-300">
            Browse live stock, search by make, model, category or budget, and keep inventory up to date in seconds.
          </p>
        </div>
        <p className="relative text-sm text-slate-400">Car Dealership Inventory System</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
