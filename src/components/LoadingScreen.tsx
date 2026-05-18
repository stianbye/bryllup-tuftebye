import { Heart } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Heart className="h-10 w-10 text-primary animate-pulse fill-current" />
      <p className="mt-4 text-sm text-muted-foreground">Laster bryllup …</p>
    </div>
  )
}
