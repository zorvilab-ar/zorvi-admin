import { loadAll, monthlySummary } from "@/lib/calc";
import { fmtArs, fmtNum, fmtPct, fmtMonth } from "@/lib/format";
import { PageHeader } from "@/components/shared";
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

export default async function ResumenPage() {
  const data = await loadAll();
  const rows = monthlySummary(data);

  const tot = {
    units: rows.reduce((a, r) => a + r.units, 0),
    netSales: rows.reduce((a, r) => a + r.netSales, 0),
    commissions: rows.reduce((a, r) => a + r.commissions, 0),
    taxes: rows.reduce((a, r) => a + r.taxes, 0),
    netIncome: rows.reduce((a, r) => a + r.netIncome, 0),
    variableCost: rows.reduce((a, r) => a + r.variableCost, 0),
    contribution: rows.reduce((a, r) => a + r.contribution, 0),
    fixedReal: rows.reduce((a, r) => a + r.fixedReal, 0),
    result: rows.reduce((a, r) => a + r.result, 0),
    cashIn: rows.reduce((a, r) => a + r.cashIn, 0),
    cashOut: rows.reduce((a, r) => a + r.cashOut, 0),
  };

  return (
    <div>
      <PageHeader
        title="Resumen mensual"
        description="Estado de resultados y caja, mes a mes. RESULTADO = contribución marginal − costos fijos reales. El flujo de caja usa fechas de cobro y de pago reales: ganar plata y quedarte sin caja al mismo tiempo es lo más común al arrancar."
      />

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Mes</TableHead>
                <TableHead className="text-right">Unid.</TableHead>
                <TableHead className="text-right">Ventas netas</TableHead>
                <TableHead className="text-right">Comisiones</TableHead>
                <TableHead className="text-right">Impuestos</TableHead>
                <TableHead className="text-right">Ingreso neto</TableHead>
                <TableHead className="text-right">Costo variable</TableHead>
                <TableHead className="text-right">Contribución</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-right">Fijos reales</TableHead>
                <TableHead className="text-right">Fijos presup.</TableHead>
                <TableHead className="text-right">RESULTADO</TableHead>
                <TableHead className="border-l text-right">Cobros</TableHead>
                <TableHead className="text-right">Pagos</TableHead>
                <TableHead className="text-right">Flujo</TableHead>
                <TableHead className="text-right">Saldo de caja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="sticky left-0 whitespace-nowrap bg-card font-medium">
                    {fmtMonth(r.month)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNum(r.units)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.netSales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.commissions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.taxes)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.netIncome)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.variableCost)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.contribution)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.netSales > 0 ? fmtPct(r.contributionPct) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.fixedReal)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{fmtArs(r.fixedBudget)}</TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      r.result > 0 ? "text-emerald-600" : r.result < 0 ? "text-red-600" : ""
                    }`}
                  >
                    {fmtArs(r.result)}
                  </TableCell>
                  <TableCell className="border-l text-right tabular-nums">{fmtArs(r.cashIn)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(r.cashOut)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${r.cashFlow < 0 ? "text-red-600" : ""}`}>
                    {fmtArs(r.cashFlow)}
                  </TableCell>
                  <TableCell className={`text-right font-semibold tabular-nums ${r.cashBalance < 0 ? "text-red-600" : ""}`}>
                    {fmtArs(r.cashBalance)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="sticky left-0 bg-muted font-semibold">TOTALES</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtNum(tot.units)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.netSales)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.commissions)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.taxes)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.netIncome)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.variableCost)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.contribution)}</TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.fixedReal)}</TableCell>
                <TableCell />
                <TableCell className={`text-right font-semibold tabular-nums ${tot.result < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {fmtArs(tot.result)}
                </TableCell>
                <TableCell className="border-l text-right font-semibold tabular-nums">{fmtArs(tot.cashIn)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{fmtArs(tot.cashOut)}</TableCell>
                <TableCell colSpan={2} className="text-right font-semibold tabular-nums">
                  {fmtArs(rows.length ? rows[rows.length - 1].cashBalance : 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
