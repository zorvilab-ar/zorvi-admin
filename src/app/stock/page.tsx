import { loadAll, productStocks, supplyStocks } from "@/lib/calc";
import { updateSupplyStock } from "@/lib/actions";
import { fmtArs, fmtNum } from "@/lib/format";
import { PageHeader, Kpi, SectionTitle } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { NumberField } from "@/components/fields";
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

export default async function StockPage() {
  const data = await loadAll();
  const pStocks = productStocks(data);
  const sStocks = supplyStocks(data);

  const pValue = pStocks.reduce((a, s) => a + s.stockValue, 0);
  const sValue = sStocks.reduce((a, s) => a + s.stockValue, 0);
  const alerts = sStocks.filter((s) => s.alert);

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Se calcula solo con lo que cargás en Producción, Ventas y Compras. Acá solo se ajusta lo que contás en el cajón y el punto de reposición."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi label="Valor en lámparas terminadas" value={fmtArs(pValue)} />
        <Kpi label="Valor en insumos" value={fmtArs(sValue)} />
        <Kpi
          label="Alertas de reposición"
          value={String(alerts.length)}
          tone={alerts.length > 0 ? "negative" : "positive"}
          hint={alerts.length > 0 ? `Hay que comprar: ${alerts.map((a) => a.supply.code).join(", ")}` : "Todo por encima del mínimo ✔"}
        />
      </div>

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
                <TableRow key={s.product.id}>
                  <TableCell className="font-mono text-xs">{s.product.code}</TableCell>
                  <TableCell className="font-bold">{s.product.name}</TableCell>
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
                <TableRow key={s.supply.id} className={s.alert ? "bg-destructive/10" : ""}>
                  <TableCell className="font-mono text-xs">{s.supply.code}</TableCell>
                  <TableCell className="font-bold">{s.supply.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.initial)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.purchased)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.consumed)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(s.manualAdjust)}</TableCell>
                  <TableCell className={`text-right font-display tabular-nums ${s.current < 0 ? "text-destructive" : ""}`}>
                    {fmtNum(s.current)} {s.supply.unit}
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
                      title={`Ajustar stock: ${s.supply.code}`}
                      description="Lo único manual del stock: lo que contás en el cajón y el mínimo antes de recomprar."
                      action={updateSupplyStock}
                      successMessage="Stock ajustado"
                    >
                      <input type="hidden" name="id" value={s.supply.id} />
                      <NumberField name="initialStock" label="Stock inicial" defaultValue={s.initial} suffix={s.supply.unit} hint="Lo que había antes de empezar a registrar." />
                      <NumberField name="manualAdjust" label="Ajuste manual (±)" defaultValue={s.manualAdjust} suffix={s.supply.unit} hint="Diferencia contra lo que contaste en el cajón. Puede ser negativo." />
                      <NumberField name="reorderPoint" label="Punto de reposición" defaultValue={s.reorderPoint} suffix={s.supply.unit} hint="Cuando el stock baja de acá, aparece la alerta ¡Comprar!" />
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
        El consumo se descuenta solo: el filamento por los gramos reales de cada
        tanda de Producción, y los componentes y packaging por las unidades OK
        producidas × lo que dice la receta.
      </p>
    </div>
  );
}
