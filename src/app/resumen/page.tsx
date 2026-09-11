import { loadAll, monthlySummary } from "@/lib/calc";
import { fmtArs, fmtNum, fmtPct, fmtMonth } from "@/lib/format";
import { PageHeader, Kpi, SectionTitle } from "@/components/shared";
import { DownloadCsv } from "@/components/download-csv";
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

function monthNameLong(key: string) {
  const [y, m] = key.split("-");
  const names = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${names[Number(m) - 1] ?? m} ${y}`;
}

export default async function ResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const data = await loadAll();
  const rows = monthlySummary(data);
  const today = new Date().toISOString().slice(0, 7);
  const selected =
    mes && rows.some((r) => r.month === mes)
      ? mes
      : rows.find((r) => r.month === today)?.month ??
        rows[rows.length - 1]?.month ??
        today;

  const idx = rows.findIndex((r) => r.month === selected);
  const current = rows[idx];
  const previous = idx > 0 ? rows[idx - 1] : undefined;
  const last6 = rows.slice(Math.max(0, rows.length - 6));
  const maxBar = Math.max(
    1,
    ...last6.map((r) => Math.max(r.netSales, r.variableCost + r.fixedReal)),
  );

  const ingresos = current?.netSales ?? 0;
  const gastos = (current?.variableCost ?? 0) + (current?.fixedReal ?? 0);
  const ganancia = current?.result ?? 0;
  const prevGanancia = previous?.result ?? 0;
  const delta =
    previous && Math.abs(prevGanancia) > 0.5
      ? (ganancia - prevGanancia) / Math.abs(prevGanancia)
      : null;

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

  const csvRows = rows.map((r) => ({
    mes: r.month,
    unidades: r.units,
    ventas_netas: Math.round(r.netSales),
    comisiones: Math.round(r.commissions),
    impuestos: Math.round(r.taxes),
    ingreso_neto: Math.round(r.netIncome),
    costo_variable: Math.round(r.variableCost),
    contribucion: Math.round(r.contribution),
    fijos_reales: Math.round(r.fixedReal),
    resultado: Math.round(r.result),
    cobros: Math.round(r.cashIn),
    pagos: Math.round(r.cashOut),
    flujo: Math.round(r.cashFlow),
    saldo_caja: Math.round(r.cashBalance),
  }));

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        description="Ingresos, gastos y resultado mes a mes. El cuadro de abajo es el estado de resultados completo; el de arriba es el resumen para mirar de un vistazo."
        actions={
          <DownloadCsv filename="zorvi-estadisticas.csv" rows={csvRows} />
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3">
        <label className="space-y-1.5">
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Mes
          </span>
          <select
            name="mes"
            defaultValue={selected}
            className="h-9 rounded-[10px] border-2 border-border bg-[#FFF7EA] px-3 text-sm font-semibold"
          >
            {rows.map((r) => (
              <option key={r.month} value={r.month}>
                {fmtMonth(r.month)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-9 rounded-lg border-2 border-border bg-secondary px-3 text-sm font-extrabold shadow-[2px_2px_0_var(--border)]"
        >
          Ver mes
        </button>
      </form>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label={`Ganancia de ${current ? monthNameLong(current.month) : "—"}`}
          value={fmtArs(ganancia)}
          tone={ganancia > 0 ? "positive" : ganancia < 0 ? "negative" : "neutral"}
          hint={
            delta === null
              ? previous
                ? `Mes anterior ${fmtArs(prevGanancia)}`
                : "Sin mes anterior para comparar"
              : `${delta >= 0 ? "+" : ""}${fmtPct(delta)} vs. mes anterior`
          }
        />
        <Kpi
          label="Ingresos"
          value={fmtArs(ingresos)}
          hint={`${fmtNum(current?.units ?? 0)} unidades`}
        />
        <Kpi
          label="Gastos"
          value={fmtArs(gastos)}
          hint="Costo variable + fijos reales"
        />
      </div>

      <SectionTitle>Últimos 6 meses</SectionTitle>
      <Card className="mb-8">
        <CardContent className="pt-2">
          <div className="mb-3 flex gap-4 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#7AA37A]" />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
              Gastos
            </span>
          </div>
          <div className="flex h-44 items-end gap-3">
            {last6.map((r) => {
              const g = r.variableCost + r.fixedReal;
              return (
                <div key={r.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="flex h-36 w-full items-end justify-center gap-1">
                    <div
                      className="w-[42%] rounded-t-md border-2 border-border bg-[#7AA37A]"
                      style={{ height: `${Math.max(4, (r.netSales / maxBar) * 100)}%` }}
                      title={`Ingresos ${fmtArs(r.netSales)}`}
                    />
                    <div
                      className="w-[42%] rounded-t-md border-2 border-border bg-primary"
                      style={{ height: `${Math.max(4, (g / maxBar) * 100)}%` }}
                      title={`Gastos ${fmtArs(g)}`}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    {fmtMonth(r.month).slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {last6.map((r) => {
                  const g = r.variableCost + r.fixedReal;
                  return (
                    <TableRow
                      key={r.month}
                      className={r.month === selected ? "bg-secondary/60" : ""}
                    >
                      <TableCell className="font-medium">{fmtMonth(r.month)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(r.netSales)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(g)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          r.result > 0 ? "text-[#7AA37A]" : r.result < 0 ? "text-destructive" : ""
                        }`}
                      >
                        {fmtArs(r.result)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SectionTitle>Estado de resultados</SectionTitle>
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
                <TableRow
                  key={r.month}
                  className={r.month === selected ? "bg-secondary/50" : ""}
                >
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
