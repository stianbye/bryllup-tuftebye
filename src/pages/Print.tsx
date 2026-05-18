import { useEffect } from 'react'
import { useWeddingStore } from '@/store/wedding'

export default function Print() {
  const { state, fetch, loading } = useWeddingStore()

  useEffect(() => {
    if (!state) fetch()
  }, [state, fetch])

  if (loading || !state) {
    return (
      <main className="min-h-screen p-8 bg-white text-black">
        <p>Laster …</p>
      </main>
    )
  }

  const { wedding, tables, guests, assignments } = state

  return (
    <main className="min-h-screen bg-white text-black p-8 print:p-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 print:mb-8">
          <h1 className="text-3xl font-serif">{wedding.name}</h1>
          <p className="text-sm mt-2 text-gray-600">22. august 2026</p>
        </header>

        <div className="space-y-12 print:space-y-0">
          {tables.map((table) => {
            const tableGuests = assignments
              .filter((a) => a.table_id === table.id)
              .map((a) => guests.find((g) => g.id === a.guest_id))
              .filter((g): g is NonNullable<typeof g> => !!g)
              .sort((a, b) => a.name.localeCompare(b.name, 'no'))

            return (
              <section key={table.id} className="print:break-after-page">
                <h2 className="text-2xl font-serif mb-1 border-b border-gray-300 pb-2">
                  {table.name}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {tableGuests.length}/{table.capacity} plasser
                </p>
                <ol className="space-y-2 text-base">
                  {tableGuests.map((g, i) => (
                    <li key={g.id} className="flex items-baseline gap-3">
                      <span className="text-xs text-gray-400 font-mono w-6">{i + 1}.</span>
                      <span>{g.name}</span>
                      {g.role && (
                        <span className="text-xs text-gray-500 italic">({g.role})</span>
                      )}
                      {g.dietary && (
                        <span className="text-xs text-gray-500">— {g.dietary}</span>
                      )}
                    </li>
                  ))}
                  {tableGuests.length === 0 && (
                    <li className="text-gray-400 italic">Ingen gjester</li>
                  )}
                </ol>
              </section>
            )
          })}
        </div>

        <footer className="mt-16 print:mt-8 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
          <p>Bryllup Laila &amp; Stian · 22. august 2026</p>
        </footer>

        <div className="mt-8 print:hidden text-center">
          <button
            onClick={() => window.print()}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Skriv ut
          </button>
        </div>
      </div>
    </main>
  )
}
