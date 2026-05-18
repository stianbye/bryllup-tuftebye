import { Heart } from 'lucide-react'

export default function Login() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <Heart className="h-12 w-12 text-primary fill-current mb-4" />
      <h1 className="font-serif text-2xl mb-2">Logg inn for å fortsette</h1>
      <p className="text-body text-sm max-w-md mb-6">
        Bryllups-appen er beskyttet av Cloudflare Access. Logg inn med e-postadressen din
        (Google-konto) — bare byestianbye@gmail.com og laila@tuftebyeai.com har tilgang.
      </p>
      <a
        href="/"
        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
      >
        Til pålogging
      </a>
    </main>
  )
}
