import { redirect } from "next/navigation";
import { getBackendStatus } from "@/lib/backend-status";
import { DbUnavailableCard } from "@/components/db-status";
import { LinkButton } from "@/components/shared";

export const dynamic = "force-dynamic";

export default async function ConexionPage() {
  const status = await getBackendStatus();
  if (status.ok) redirect("/");

  return (
    <div>
      <DbUnavailableCard title={status.title} hint={status.hint} />
      <div className="mt-4 flex justify-center">
        <LinkButton href="/" variant="secondary">
          Volver al tablero
        </LinkButton>
      </div>
    </div>
  );
}
