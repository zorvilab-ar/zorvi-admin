import { loadStock } from "@/lib/views/client";
import {
  updateSupplyStock,
  createFilamentRoll,
  updateFilamentRoll,
  deleteFilamentRoll,
} from "@/lib/actions";
import { fmtArs, fmtNum, fmtDate } from "@/lib/format";
import { FILAMENT_COLORS } from "@/lib/filament-colors";
import { PageHeader, Kpi, SectionTitle, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { NumberField, TextField, DateField, SelectField } from "@/components/fields";
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

const COLOR_OPTIONS = FILAMENT_COLORS.map((c) => ({
  value: c.name,
  label: c.name,
}));

type Roll = {
  id: number;
  supplyId: number;
  color: string | null;
  colorHex: string;
  brand: string | null;
  initialGrams: number;
  remainingGrams: number;
  costArs: number;
  openedAt: string | null;
  notes: string | null;
};

function RollFields({
  roll,
  filamentOptions,
  today,
}: {
  roll?: Roll;
  filamentOptions: { value: number; label: string }[];
  today: string;
}) {
  return (
    <>
      {roll && <input type="hidden" name="id" value={roll.id} />}
      <SelectField
        name="supplyId"
        label="Insumo de filamento"
        defaultValue={roll?.supplyId}
        options={filamentOptions}
        placeholder="Elegir filamento…"
        required
      />
      <SelectField
        name="color"
        label="Color"
        defaultValue={roll?.color ?? "Negro"}
        options={COLOR_OPTIONS}
        required
      />
      <TextField name="brand" label="Marca" defaultValue={roll?.brand} placeholder="eSun, Grilon3…" />
      <NumberField
        name="initialGrams"
        label="Peso del rollo"
        defaultValue={roll?.initialGrams ?? 1000}
        suffix="g"
        required
      />
      <NumberField
        name="remainingGrams"
        label="Peso disponible"
        defaultValue={roll?.remainingGrams ?? 1000}
        suffix="g"
        hint="Lo que queda en el carrete. Al producir se descuenta solo."
      />
      <NumberField
        name="costArs"
        label="Costo del rollo"
        defaultValue={roll?.costArs ?? 0}
        suffix="ARS"
      />
      <DateField
        name="openedAt"
        label="Fecha de apertura"
        defaultValue={roll?.openedAt ?? today}
      />
      <TextField name="notes" label="Notas" defaultValue={roll?.notes} span2 />
    </>
  );
}

export default async function StockPage() {
  // Todo calculado en el backend: productos, insumos y rollos ya vienen con
  // sus totales y su valorización.
  const { productos: pStocks, insumos: sStocks, rollos, filamentos: filaments } =
    await loadStock();
  const today = new Date().toISOString().slice(0, 10);
  const filamentOptions = filaments.map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name}`,
  }));

  const pValue = pStocks.reduce((a, s) => a + s.stockValue, 0);
  const sValue = sStocks.reduce((a, s) => a + s.stockValue, 0);
  const rollValue = rollos.reduce(
    (a, r) => a + r.valor,
    0,
  );
  const alerts = sStocks.filter((s) => s.alert);

  const addRoll = (
    <FormSheet
      title="Agregar rollo"
      description="Un carrete físico. Al registrar producción se descuenta de los más viejos primero."
      action={createFilamentRoll}
      triggerLabel="Agregar rollo"
      successMessage="Rollo cargado"
      wide
    >
      <RollFields filamentOptions={filamentOptions} today={today} />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Se calcula solo con lo que cargás en Producción, Ventas y Compras. Los rollos de filamento son el inventario físico: al producir se descuentan solos."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Valor en lámparas terminadas" value={fmtArs(pValue)} />
        <Kpi label="Valor en insumos" value={fmtArs(sValue)} />
        <Kpi
          label="Valor en rollos"
          value={fmtArs(rollValue)}
          hint={`${rollos.length} rollo${rollos.length === 1 ? "" : "s"}`}
        />
        <Kpi
          label="Alertas de reposición"
          value={String(alerts.length)}
          tone={alerts.length > 0 ? "negative" : "positive"}
          hint={alerts.length > 0 ? `Hay que comprar: ${alerts.map((a) => a.code).join(", ")}` : "Todo por encima del mínimo ✔"}
        />
      </div>

      <div className="mb-3 mt-1 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide">Rollos de filamento</h2>
        {rollos.length > 0 ? addRoll : null}
      </div>

      {rollos.length === 0 ? (
        <div className="mb-8">
          <EmptyState
            title="Todavía no hay rollos cargados"
            helper="Cargá cada carrete con color, marca y gramos que quedan. Cuando registres producción, se descuenta de acá (el más viejo primero)."
            action={filamentOptions.length > 0 ? addRoll : undefined}
          />
          {filamentOptions.length === 0 && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Primero creá un insumo con categoría Filamento en Insumos.
            </p>
          )}
        </div>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rollos.map((roll) => {
            const pct =
              roll.initialGrams > 0
                ? Math.max(0, Math.min(1, roll.remainingGrams / roll.initialGrams))
                : 0;
            const low = pct <= 0.2;
            const value = roll.valor;
            return (
              <Card key={roll.id} className={low ? "ring-2 ring-primary" : ""}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border-2 border-border shadow-[2px_2px_0_var(--border)]"
                        style={{ backgroundColor: roll.colorHex }}
                      />
                      <div>
                        <div className="font-display text-base leading-tight">
                          {roll.color ?? "Sin color"}
                          {roll.brand ? ` · ${roll.brand}` : ""}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {roll.supplyCode ? `${roll.supplyCode} — ${roll.supplyName}` : "Insumo"}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <FormSheet
                        mode="edit"
                        title="Editar rollo"
                        action={updateFilamentRoll}
                        successMessage="Rollo actualizado"
                        wide
                      >
                        <RollFields
                          roll={roll}
                          filamentOptions={filamentOptions}
                          today={today}
                        />
                      </FormSheet>
                      <ConfirmDelete
                        action={deleteFilamentRoll}
                        id={roll.id}
                        what={`el rollo ${roll.color ?? ""} ${roll.brand ?? ""}`.trim()}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-extrabold">
                      <span>
                        {fmtNum(roll.remainingGrams)} g / {fmtNum(roll.initialGrams)} g
                      </span>
                      <span className="tabular-nums">{fmtArs(value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border-2 border-border bg-muted">
                      <div
                        className={`h-full ${low ? "bg-primary" : "bg-[#7AA37A]"}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>
                      {roll.openedAt
                        ? `Abierto ${fmtDate(roll.openedAt)}`
                        : "Sin fecha"}
                    </span>
                    {low && (
                      <Badge className="bg-primary text-[10px] text-primary-foreground">
                        Queda poco
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle>Lámparas terminadas</SectionTitle>
      <Card className="mb-8">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">+ Producidas</TableHead>
                <TableHead className="text-right">− Vendidas</TableHead>
                <TableHead className="text-right">Stock actual</TableHead>
                <TableHead className="text-right">Costo unitario</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pStocks.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-bold">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.initial)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.produced)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.sold)}</TableCell>
                  <TableCell className={`text-right font-display tabular-nums ${s.current < 0 ? "text-destructive" : ""}`}>
                    {fmtNum(s.current)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(s.unitCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(s.stockValue)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/60">
                <TableCell colSpan={7} className="font-display">
                  VALOR TOTAL EN TERMINADOS
                </TableCell>
                <TableCell className="text-right font-display tabular-nums">{fmtArs(pValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SectionTitle>Insumos</SectionTitle>
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">+ Comprado</TableHead>
                <TableHead className="text-right">− Consumido</TableHead>
                <TableHead className="text-right">± Ajuste</TableHead>
                <TableHead className="text-right">Stock actual</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sStocks.map((s) => (
                <TableRow key={s.id} className={s.alert ? "bg-destructive/10" : ""}>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-bold">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.initial)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.purchased)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.consumed)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.manualAdjust)}</TableCell>
                  <TableCell className={`text-right font-display tabular-nums ${s.current < 0 ? "text-destructive" : ""}`}>
                    {fmtNum(s.current)} {s.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(s.stockValue)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.reorderPoint)}</TableCell>
                  <TableCell>
                    {s.alert ? (
                      <Badge className="bg-primary text-[11px] text-primary-foreground">¡Comprar!</Badge>
                    ) : (
                      <span className="text-xs font-bold text-[#7AA37A]">OK</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <FormSheet
                      mode="edit"
                      title={`Ajustar stock: ${s.code}`}
                      description="Lo único manual del stock: lo que contás en el cajón y el mínimo antes de recomprar."
                      action={updateSupplyStock}
                      successMessage="Stock ajustado"
                    >
                      <input type="hidden" name="id" value={s.id} />
                      <NumberField name="initialStock" label="Stock inicial" defaultValue={s.initial} suffix={s.unit} hint="Lo que había antes de empezar a registrar." />
                      <NumberField name="manualAdjust" label="Ajuste manual (±)" defaultValue={s.manualAdjust} suffix={s.unit} hint="Diferencia contra lo que contaste en el cajón. Puede ser negativo." />
                      <NumberField name="reorderPoint" label="Punto de reposición" defaultValue={s.reorderPoint} suffix={s.unit} hint="Cuando el stock baja de acá, aparece la alerta ¡Comprar!" />
                    </FormSheet>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/60">
                <TableCell colSpan={7} className="font-display">
                  VALOR TOTAL EN INSUMOS
                </TableCell>
                <TableCell className="text-right font-display tabular-nums">{fmtArs(sValue)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 max-w-4xl text-xs font-semibold text-muted-foreground">
        El consumo de insumos se descuenta solo: el filamento por los gramos
        reales de cada tanda de Producción (primero de los rollos más viejos,
        si hay), y los componentes y packaging por las unidades OK producidas ×
        lo que dice la receta.
      </p>
    </div>
  );
}
