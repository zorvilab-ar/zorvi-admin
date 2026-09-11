export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-xl rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="h-24 rounded-2xl border-2 border-border bg-muted/60" />
        <div className="h-24 rounded-2xl border-2 border-border bg-muted/60" />
        <div className="h-24 rounded-2xl border-2 border-border bg-muted/60" />
        <div className="h-24 rounded-2xl border-2 border-border bg-muted/60" />
      </div>
      <div className="h-64 rounded-2xl border-2 border-border bg-muted/40" />
    </div>
  );
}
