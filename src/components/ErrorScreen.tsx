import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  error: string
  onRetry: () => void
}

export default function ErrorScreen({ error, onRetry }: Props) {
  // Sjekk for 401 — da må man logge inn via CF Access
  const is401 = error.includes('401') || error.toLowerCase().includes('unauthorized')

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h1 className="font-serif text-2xl mt-4">
        {is401 ? 'Ikke logget inn' : 'Noe gikk galt'}
      </h1>
      <p className="text-body mt-2 text-sm">
        {is401
          ? 'Du må logge inn via Cloudflare Access for å bruke appen. Bare e-postene byestianbye@gmail.com og laila@tuftebyeai.com har tilgang.'
          : error}
      </p>
      <Button className="mt-6" onClick={onRetry}>
        Prøv igjen
      </Button>
    </div>
  )
}
