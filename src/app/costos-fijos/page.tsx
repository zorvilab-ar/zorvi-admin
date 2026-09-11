import { loadAll } from "@/lib/calc";
import { createFixedCost, updateFixedCost, deleteFixedCost } from "@/lib/actions";
import { fmtArs, fmtUsd } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, SelectField } from "@/components/fields";
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

const CATEGORIES = ["Estructura", "Impuestos", "Comercial", "Operación", "Otro"].map(
  (c) => ({ value: c, label: c }),
);

function FixedCostFields({
  f,
}: {
  f?: { id: number; concept: string; category: string; monthlyArs: number; notes: string | null };
}) {
  return (
    <>
      {f && <input type="hidden" name="id" value={f.id} />}
      <TextField name="concept" label="Concepto" defaultValue={f?.concept} required placeholder="Ej.: Publicidad de Instagram" />
      <SelectField name="category" label="Categoría" defaultValue={f?.category ?? "Operación"} options={CATEGORIES} />
      <NumberField name="monthlyArs" label="Monto mensual" defaultValue={f?.monthlyArs} suffix="ARS" required hint="Lo que se paga por mes, se venda o no." />
      <TextField name="notes" label="Notas" defaultValue={f?.notes} />
    </>
  );
}

export default async function CostosFijosPage() {
  const data = await loadAll();
  const total = data.fixedCosts.reduce((a, f) => a + f.monthlyArs, 0);
  const perHour = data.settings.hoursProductive > 0 ? total / data.settings.hoursProductive : 0;

  const addSheet = (
    <FormSheet
      title="Agregar costo fijo"
      description="Lo que se paga todos los meses aunque no se venda nada: alquiler, monotributo, suscripciones."
      action={createFixedCost}
      triggerLabel="Nuevo costo fijo"
      successMessage="Costo fijo agregado"
    >
      <FixedCostFields />
    </FormSheet>
  );

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Costos fijos mensuales"
        description="Lo que se paga todos los meses aunque no se venda nada. Define cuántas lámparas hay que vender para no perder plata."
        actions={addSheet}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi label="Total mensual" value={fmtArs(total)} hint={fmtUsd(data.settings.fxRate > 0 ? total / data.settings.fxRate : 0)} />
        <Kpi
          label="Costo fijo por hora productiva"
          value={fmtArs(perHour)}
          hint={`Sobre ${data.settings.hoursProductive} h productivas — se reparte solo en cada lámpara`}
        />
      </div>

      {data.fixedCosts.length === 0 ? (
        <EmptyState
          title="Todavía no hay costos fijos"
          helper="Cargá lo que pagan todos los meses (espacio, monotributo, software) para conocer el punto de equilibrio."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto mensual</TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.fixedCosts.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-bold">{f.concept}</TableCell>
                    <TableCell className="text-xs font-semibold">{f.category}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(f.monthlyArs)}</TableCell>
                    <TableCell className="hidden text-xs font-semibold text-muted-foreground lg:table-cell">{f.notes}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <FormSheet mode="edit" title={`Editar: ${f.concept}`} action={updateFixedCost} successMessage="Costo fijo actualizado">
                        <FixedCostFields f={f} />
                      </FormSheet>
                      <ConfirmDelete action={deleteFixedCost} id={f.id} what={`el costo fijo «${f.concept}»`} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/60">
                  <TableCell className="font-display">TOTAL</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-display tabular-nums">{fmtArs(total)}</TableCell>
                  <TableCell className="hidden lg:table-cell" />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
