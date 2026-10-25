import { Navbar } from '../components/Navbar'

export function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Showroom inventory</h1>
      </main>
    </div>
  )
}
