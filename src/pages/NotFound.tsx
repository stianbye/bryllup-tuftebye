import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-xl text-foreground">Siden finnes ikke</p>
        <p className="text-muted-foreground">Sjekk URL-en eller gå tilbake til forsiden.</p>
        <Button asChild>
          <Link to="/">Gå til forsiden</Link>
        </Button>
      </div>
    </main>
  )
}
