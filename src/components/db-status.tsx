import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DbUnavailableCard({
  title = "No se pudieron cargar los datos",
  hint = "El menú sigue disponible. Cuando la base esté conectada, reintentá.",
  onRetry,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-border bg-secondary shadow-[4px_4px_0_var(--border)]">
          <Database className="h-6 w-6" />
        </div>
        <div className="font-display text-xl">{title}</div>
        <p className="max-w-md text-sm font-semibold text-muted-foreground">
          {hint}
        </p>
        {onRetry && (
          <Button type="button" variant="secondary" className="mt-1" onClick={onRetry}>
            <RefreshCw />
            Reintentar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
