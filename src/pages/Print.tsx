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

  const {