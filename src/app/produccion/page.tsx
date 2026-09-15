import { loadAll, printerAssets } from "@/lib/calc";
import {
  createProductionRun,
  updateProductionRun,
  deleteProductionRun,
} from "@/lib/actions";
import { fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, DateField } from "@/components/fields";
import { ProductionFields } from "@/components/production-fields";
import { SlicerImport } from "@/components/slicer-import";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default async function ProduccionPage() {
  const data = await loadAll();
  const productsById = new Map(data.products.map((p) => [p.id, p]));
  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const assetsById = new Map(data.assets.map((a) => [a.id, a]));
  const runs = [...data.productionRuns].sort((a, b) => b.date.localeCompare(a.date));

  const totalOk = runs.reduce((a, r) => a + r.unitsOk, 0);
  const totalFail = runs.reduce((a, r) => a + r.unitsFailed, 0);
  const totalHours = runs.reduce((a, r) => a + r.hoursReal, 0);
  const totalGrams = runs.reduce((a, r) => a + r.gramsReal, 0);
  const today = new Date().toISOString().slice(0, 10);

  const printers = printerAssets(data.assets);
  const filaments = data.supplies.filter((s) => s.category === "Filamento");

  // Lo que la receta dice que sale por unidad: gramos de filamento (con su
  // desperdicio) y el rollo que corresponde. Si el producto no tiene receta
  // de filamento, cae en los gramos del slicer cargados en la ficha.
  const estimates = data.products.map((p) => {
    const filamentLines = data.recipeItems.filter((ri) => {
      const s = data.supplies.find((x) => x.id === ri.supplyId);
      return ri.productId === p.id && s?.category === "Filamento";
    });
    const recipeGrams = filamentLines.reduce(
      (a, ri) => a + ri.qty * (1 + ri.wastePct),
      0,
    );
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      printHours: p.printHours,
      grams: recipeGrams > 0 ? recipeGrams : p.grams,
      filamentSupplyId: filamentLines[0]?.supplyId ?? null,
    };
  });

  const fields = (run?: (typeof runs)[number]) => (
    <>
      {run && <input type="hidden" name="id" value={run.id} />}
      <DateField name="date" label="Fecha" defaultValue={run?.date ?? today} required />
      <SlicerImport printHoursField="hoursReal" gramsField="gramsReal" />
      <ProductionFields
        products={estimates}
        filaments={filaments.map((s) => ({ id: s.id, label: `${s.code} — ${s.name}` }))}
        printers={printers.map((a) => ({ id: a.id, label: `${a.code} — ${a.name}` }))}
        run={run}
      />
      <TextField name="notes" label="Notas" defaultValue={run?.notes} />
    </>
  );

  const addSheet = (
    <FormSheet
      title="Registrar tanda de impresión"
      description="Una tanda = lo que salió de la impresora de una vez. Suma al stock y descuenta filamento automáticamente."
      action={createProductionRun}
      triggerLabel="Nueva tanda"
      successMessage="Tanda registrada. El stock ya se actualizó."
      wide
    >
      {fields()}
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Producción"
        description="Cada tanda impresa. Alimenta el stock, las horas de la máquina y muestra el desvío contra lo estimado."
        actions={addSheet}
      />

      {printers.length === 0 && data.assets.length > 0 && (
        <Alert className="mb-5">
          <AlertDescription>
            Ningún activo está marcado como <strong>Impresora</strong>, así que el
            selector de equipo va a salir vacío. Marcá el tipo en{" "}
            <a href="/activos" className="underline">Activos</a>.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Unidades OK" value={fmtNum(totalOk)} />
        <Kpi
          label="Falladas"
          value={fmtNum(totalFail)}
          hint={totalOk + totalFail > 0 ? `Tasa real ${fmtPct(totalFail / (totalOk + totalFail))}` : undefined}
          tone={totalOk + totalFail > 0 && totalFail / (totalOk + totalFail) > data.settings.failureRate ? "negative" : "neutral"}
        />
        <Kpi label="Horas de impresión" value={`${fmtNum(totalHours)} h`} />
        <Kpi label="Filamento consumido" value={`${fmtNum(totalGrams)} g`} />
      </div>

      {runs.length === 0 ? (
        <EmptyState
          title="Todavía no hay producción registrada"
          helper="Cada vez que la impresora termina una tanda, registrala acá: el stock y las horas de máquina se actualizan solos."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">OK</TableHead>
                  <TableHead className="text-right">Falladas</TableHead>
                  <TableHead className="text-right">% falla</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Desvío</TableHead>
                  <TableHead className="text-right">Gramos</TableHead>
                  <TableHead>Filamento</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => {
                  const p = productsById.get(r.productId);
                  const est = p ? (r.unitsOk + r.unitsFailed) * p.printHours : 0;
                  const dev = r.hoursReal - est;
                  const failPct = r.unitsOk + r.unitsFailed > 0 ? r.unitsFailed / (r.unitsOk + r.unitsFailed) : 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{fmtDate(r.date)}</TableCell>
                      <TableCell className="font-bold">{p ? `${p.code} — ${p.name}` : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(r.unitsOk)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(r.unitsFailed)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${failPct > data.settings.failureRate ? "text-destructive" : ""}`}>
                        {fmtPct(failPct)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(r.hoursReal)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${dev > 0 ? "text-destructive" : dev < 0 ? "text-[#7AA37A]" : ""}`}>
                        {est > 0 ? fmtNum(dev) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(r.gramsReal)}</TableCell>
                      <TableCell className="text-xs">{r.filamentSupplyId ? suppliesById.get(r.filamentSupplyId)?.code : "—"}</TableCell>
                      <TableCell className="text-xs">{r.assetId ? assetsById.get(r.assetId)?.code : "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <FormSheet
                          mode="edit"
                          title={`Editar la tanda del ${fmtDate(r.date)}`}
                          description="Corregir los gramos acomoda el stock de rollos: se devuelve lo anterior y se descuenta lo nuevo."
                          action={updateProductionRun}
                          successMessage="Tanda actualizada"
                          wide
                        >
                          {fields(r)}
                        </FormSheet>
                        <ConfirmDelete action={deleteProductionRun} id={r.id} what={`la tanda del ${fmtDate(r.date)}`} />
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
