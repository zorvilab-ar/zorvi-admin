import { loadPresupuestos } from "@/lib/views/client";
import { createQuote, deleteQuote } from "@/lib/actions";
import { fmtArs, fmtDate } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, DateField } from "@/components/fields";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  Borrador: "bg-muted text-muted-foreground",
  Enviado: "bg-[#F2B550]",
  Aceptado: "bg-[#7AA37A] text-white",
  Rechazado: "bg-primary text-primary-foreground",
};

export default async function PresupuestosPage() {
  // Cada presupuesto ya viene con su total costeado.
  const { presupuestos } = await loadPresupuestos();
  const today = new Date().toISOString().slice(0, 10);

  const addSheet = (
    <FormSheet
      title="Nuevo presupuesto"
      description="Poné para quién es. Después cargás las piezas en la ficha."
      action={createQuote}
      triggerLabel="Nuevo presupuesto"
      successMessage="Presupuesto creado"
    >
      <DateField name="date" label="Fecha" defaultValue={today} required />
      <TextField
        name="clientName"
        label="Cliente"
        required
        placeholder="Nombre o @instagram"
      />
      <TextField name="notes" label="Notas" span2 />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Cotizaciones a medida para un cliente. Cada pieza usa la misma fórmula que la Calculadora 3D, con el filamento y los parámetros del taller."
        actions={addSheet}
      />

      {presupuestos.length === 0 ? (
        <EmptyState
          title="Todavía no hay presupuestos"
          helper="Creá uno con el nombre del cliente y cargale las piezas: gramos, horas y filamento."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Piezas</TableHead>
                  <TableHead className="text-right">A cobrar</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestos
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                  .map((q) => {
                    const total = q.total;
                    return (
                      <TableRow key={q.id}>
                        <TableCell className="text-xs">{fmtDate(q.date)}</TableCell>
                        <TableCell>
                          <a
                            href={`/presupuestos/${q.id}`}
                            className="font-bold hover:underline"
                          >
                            {q.clientName}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[11px] ${STATUS_STYLE[q.status] ?? ""}`}
                          >
                            {q.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {q.items}
                        </TableCell>
                        <TableCell className="text-right font-display tabular-nums">
                          {fmtArs(total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ConfirmDelete
                            action={deleteQuote}
                            id={q.id}
                            what={`el presupuesto de ${q.clientName}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
