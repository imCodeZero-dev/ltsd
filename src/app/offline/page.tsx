export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="text-5xl mb-4">📡</div>
      <h1 className="text-heading mb-2">You&apos;re offline</h1>
      <p className="text-body text-muted-foreground max-w-xs">
        Check your connection and try again. Your saved deals are still available.
      </p>
    </div>
  );
}
