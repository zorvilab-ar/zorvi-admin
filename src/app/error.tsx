"use client";

import { DbUnavailableCard } from "@/components/db-status";
import { esErrorDeConexion } from "@/lib/errors";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const dbIssue = esErrorDeConexion(error);

  return (
    <DbUnavailableCard
      title={
        dbIssue
          ? "No hay conexión con la base de datos"
          : "Algo salió mal"
      }
      hint={
        dbIssue
          ? "El aviso de arriba tiene el detalle. En local suele ser Docker apagado o falta DATABASE_URL."
          : "Reintentá. Si sigue fallando, mirá la consola o los logs de Vercel."
      }
      onRetry={retry}
    />
  );
}
