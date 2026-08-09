export function TooManyRequests() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">Trop de requêtes.</p>
        <p className="mt-1 text-xs text-muted-foreground">Réessayez dans quelques minutes.</p>
      </div>
    </main>
  )
}
