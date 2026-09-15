import { loadTablero } from "@/lib/views/client";
import { fmtArs, fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { PageHeader, Kpi, SectionTitle } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TableroPage() {
  // Los números ya vienen calculados del backend: esta página solo los pinta.
  const { kpis: d, settings, productos } = await loadTablero();

  const capAlert =
    d.capUse === null
      ? "Cargá el tope de la categoría en Parámetros"
      : d.capUse > 0.9
        ? "¡Cerca del tope! Hay que recategorizar o abrir otro monotributo."
        : d.capUse > 0.7
          ? "Atención: consumo del tope arriba del 70%."
          : "OK";

  return (
    <div>
      <PageHeader
        title="Tablero"
        description="Todo automático. Estos son los números que hay que mirar cada mes."
      />

      {d.assetsUnbooked > 0 && (
        <Alert className="mb-5 border-[#E0883A]">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>El saldo de caja está inflado en {fmtArs(d.assetsUnbooked)}</AlertTitle>
          <AlertDescription>
            Hay {fmtArs(d.assetInvestment)} en activos pero solo{" "}
            {fmtArs(d.assetPurchases)} cargados como compra, así que esa plata
            entró a la caja y nunca salió. Registrá la compra que falta en{" "}
            <a href="/compras" className="underline">Compras y gastos</a> (tipo
            Activo) y el saldo se acomoda.
          </AlertDescription>
        </Alert>
      )}

      <SectionTitle>1 · Inversión y capital</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Inversión en activos" value={fmtArs(d.assetInvestment)} hint={fmtUsd(d.assetInvestmentUsd)} />
        <Kpi label="Capital aportado" value={fmtArs(d.capital)} />
        <Kpi label="Retiros acumulados" value={fmtArs(d.withdrawals)} />
        <Kpi
          label="Saldo de caja"
          value={fmtArs(d.cashBalance)}
          tone={d.cashBalance < 0 ? "negative" : d.assetsUnbooked > 0 ? "negative" : "neutral"}
          hint={
            d.assetsUnbooked > 0
              ? `Ojo: ${fmtArs(d.assetsUnbooked)} de activos sin su compra`
              : "Cobrado menos pagado, acumulado"
          }
        />
      </div>

      <SectionTitle>2 · Resultados acumulados</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Unidades vendidas" value={fmtNum(d.unitsSold)} />
        <Kpi label="Ventas acumuladas" value={fmtArs(d.salesTotal)} hint={`Ticket promedio ${fmtArs(d.avgTicket)}`} />
        <Kpi
          label="Contribución marginal"
          value={fmtArs(d.contribution)}
          hint={`Margen promedio ${fmtPct(d.avgContribMargin)}`}
        />
        <Kpi
          label="Resultado acumulado"
          value={fmtArs(d.resultAccum)}
          tone={d.resultAccum > 0 ? "positive" : d.resultAccum < 0 ? "negative" : "neutral"}
          hint={`Costos fijos acumulados ${fmtArs(d.fixedAccum)}`}
        />
      </div>

      <SectionTitle>3 · Punto de equilibrio mensual</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Costos fijos mensuales" value={fmtArs(d.fixedBudget)} hint="Presupuesto" />
        <Kpi
          label="Equilibrio en ventas"
          value={d.breakEvenSales > 0 ? fmtArs(d.breakEvenSales) : "—"}
          hint="Facturación mínima por mes"
        />
        <Kpi
          label="Equilibrio en unidades"
          value={d.breakEvenUnits > 0 ? fmtNum(Math.ceil(d.breakEvenUnits)) : "—"}
          hint="Lámparas por mes. El número a tener en la cabeza."
        />
        <Kpi
          label="Uso de capacidad en equilibrio"
          value={d.capacityUse > 0 ? fmtPct(d.capacityUse) : "—"}
          tone={d.capacityUse > 1 ? "negative" : "neutral"}
          hint={d.capacityUse > 1 ? "No entra con una sola impresora" : "Sobre horas disponibles"}
        />
      </div>

      <SectionTitle>4 · Productividad</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Horas de impresión" value={fmtNum(d.hoursAccum)} hint={`Desvío vs. estimado: ${fmtNum(d.hoursDeviation)} h`} />
        <Kpi
          label="Producidas / falladas"
          value={`${fmtNum(d.unitsProduced)} / ${fmtNum(d.unitsFailed)}`}
          hint={`Tasa de falla real ${fmtPct(d.failRateReal)} (supuesto ${fmtPct(settings.failureRate)})`}
          tone={d.failRateReal > settings.failureRate ? "negative" : "neutral"}
        />
        <Kpi
          label="Contribución por hora"
          value={fmtArs(d.contribPerHour)}
          hint="El indicador clave: cuánto deja cada hora de máquina"
        />
        <Kpi label="Filamento consumido" value={`${fmtNum(d.gramsUsed)} g`} />
      </div>

      <SectionTitle>5 · Recupero de la inversión</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Meses con ventas" value={fmtNum(d.monthsWithSales)} />
        <Kpi label="Resultado promedio por mes" value={fmtArs(d.avgMonthlyResult)} />
        <Kpi
          label="Meses para recuperar"
          value={d.paybackMonths ? fmtNum(Math.ceil(d.paybackMonths)) : "—"}
          hint={d.paybackMonths ? "Al ritmo actual" : "Todavía no hay resultado positivo"}
        />
        <Kpi label="Valor del stock" value={fmtArs(d.stockValue)} hint="Productos + insumos" />
      </div>

      <SectionTitle>6 · Control de monotributo</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Facturado últimos 12 meses" value={fmtArs(d.invoiced12m)} />
        <Kpi
          label="Tope de la categoría"
          value={settings.monotributoCap > 0 ? fmtArs(settings.monotributoCap) : "—"}
        />
        <Kpi
          label="Consumo del tope"
          value={d.capUse !== null ? fmtPct(d.capUse) : "—"}
          tone={d.capUse !== null && d.capUse > 0.9 ? "negative" : "neutral"}
          hint={capAlert}
        />
      </div>

      <SectionTitle>Rentabilidad por producto</SectionTitle>
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Costo variable</TableHead>
                <TableHead className="text-right">Costo total</TableHead>
                <TableHead className="text-right">Precio de lista</TableHead>
                <TableHead className="text-right">Contribución</TableHead>
                <TableHead className="text-right">Contrib. por hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                  <TableRow key={p.code}>
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(p.variableCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(p.totalCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(p.listPrice)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${p.contribution < 0 ? "text-destructive" : ""}`}>
                      {p.listPrice > 0 ? `${fmtArs(p.contribution)} (${fmtPct(p.contributionPct)})` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.listPrice > 0 && p.printHours > 0 ? fmtArs(p.contributionPerHour) : "—"}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>El número que decide casi todo</AlertTitle>
        <AlertDescription>
          Con la contribución marginal por hora de impresión se decide qué modelo
          conviene imprimir, si el precio de un canal cierra y cuándo la segunda
          impresora se paga sola. Miralo antes que la facturación.
        </AlertDescription>
      </Alert>
    </div>
  );
}
