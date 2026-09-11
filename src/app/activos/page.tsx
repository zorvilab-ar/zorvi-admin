import { loadAll, assetAmortPerHour, assetHoursUsed, totalAmortPerHour } from "@/lib/calc";
import { createAsset, updateAsset, deleteAsset } from "@/lib/actions";
import { fmtArs, fmtArsDec, fmtNum, fmtUsd, fmtDate } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, DateField } from "@/components/fields";
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

function AssetFields({
  a,
}: {
  a?: {
    id: number;
    code: string;
    name: string;
    purchaseDate: string | null;
    costArs: number;
    usefulLifeHours: number;
    residualArs: number;
    notes: string | null;
  };
}) {
  return (
    <>
      {a && <input type="hidden" name="id" value={a.id} />}
      <TextField name="code" label="Código" defaultValue={a?.code} required placeholder="IMP-002" hint="IMP-001, IMP-002… para impresoras; HERR-001 para herramientas." />
      <TextField name="name" label="Nombre del activo" defaultValue={a?.name} required placeholder="Bambu Lab A1" />
      <DateField name="purchaseDate" label="Fecha de compra" defaultValue={a?.purchaseDate} />
      <NumberField name="costArs" label="Costo" defaultValue={a?.costArs} suffix="ARS" required />
      <NumberField name="usefulLifeHours" label="Vida útil" defaultValue={a?.usefulLifeHours ?? 5000} suffix="horas" hint="Para una Bambu A1: entre 4.000 y 8.000 horas." />
      <NumberField name="residualArs" label="Valor residual" defaultValue={a?.residualArs ?? 0} suffix="ARS" hint="Lo que valdría al final de su vida útil. 0 si no sabés." />
      <TextField name="notes" label="Notas" defaultValue={a?.notes} />
    </>
  );
}

export default async function ActivosPage() {
  const data = await loadAll();

  const totalInvest = data.assets.reduce((a, x) => a + x.costArs, 0);
  const bookValue = data.assets.reduce(
    (a, x) => a + (x.costArs - assetAmortPerHour(x) * assetHoursUsed(x, data.productionRuns)),
    0,
  );

  const addSheet = (
    <FormSheet
      title="Agregar activo"
      description="Impresoras, AMS y herramientas. La vida útil en horas convierte la inversión en costo por lámpara."
      action={createAsset}
      triggerLabel="Nuevo activo"
      successMessage="Activo agregado"
    >
      <AssetFields />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Activos e inversión"
        description="La impresora, el AMS y las herramientas. Las horas usadas se llenan solas desde Producción."
        actions={addSheet}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi label="Inversión total" value={fmtArs(totalInvest)} hint={fmtUsd(data.settings.fxRate > 0 ? totalInvest / data.settings.fxRate : 0)} />
        <Kpi label="Valor libro actual" value={fmtArs(bookValue)} hint="Lo que valen hoy, ya descontado el uso" />
        <Kpi
          label="Amortización por hora"
          value={fmtArsDec(totalAmortPerHour(data.assets))}
          hint="Se suma sola al costo de cada lámpara"
        />
      </div>

      {data.assets.length === 0 ? (
        <EmptyState
          title="Todavía no hay activos"
          helper="Cargá la impresora y las herramientas para que su desgaste entre en el costo de cada lámpara."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Compra</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Vida útil</TableHead>
                  <TableHead className="text-right">Amort./hora</TableHead>
                  <TableHead className="text-right">Horas usadas</TableHead>
                  <TableHead className="text-right">Valor libro</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.assets.map((a) => {
                  const amort = assetAmortPerHour(a);
                  const used = assetHoursUsed(a, data.productionRuns);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.code}</TableCell>
                      <TableCell className="font-bold">{a.name}</TableCell>
                      <TableCell className="text-xs">{fmtDate(a.purchaseDate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(a.costArs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(a.usefulLifeHours)} h</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArsDec(amort)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(used)} h</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(a.costArs - amort * used)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <FormSheet
                          mode="edit"
                          title={`Editar ${a.code}`}
                          action={updateAsset}
                          successMessage="Activo actualizado"
                        >
                          <AssetFields a={a} />
                        </FormSheet>
                        <ConfirmDelete action={deleteAsset} id={a.id} what={`el activo ${a.code} (${a.name})`} />
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
