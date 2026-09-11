import React from "react";
import { loadAll, allProductCosts, channelPrices } from "@/lib/calc";
import { fmtArs, fmtPct } from "@/lib/format";
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

export default async function PreciosPage() {
  const data = await loadAll();
  const costs = allProductCosts(data);

  return (
    <div>
      <PageHeader
        title="Precios por canal"
        description="Se calcula solo. El precio sugerido es el que necesitás en cada canal para llegar al margen objetivo, ya descontadas comisión, impuestos y costo fijo por venta. El margen neto es lo que queda de verdad vendiendo a precio de lista: si da negativo, en ese canal estás perdiendo plata."
      />

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Costo variable</TableHead>
                <TableHead className="text-right">Costo total</TableHead>
                <TableHead className="text-right">Precio de lista</TableHead>
                {data.channels.map((c) => (
                  <TableHead key={c.id} className="border-l text-center" colSpan={2}>
                    {c.name}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead className="sticky left-0 bg-card" />
                <TableHead />
                <TableHead />
                <TableHead />
                <TableHead />
                {data.channels.map((c) => (
                  <React.Fragment key={c.id}>
                    <TableHead className="border-l text-right text-[11px]">
                      Sugerido
                    </TableHead>
                    <TableHead className="text-right text-[11px]">
                      Margen
                    </TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.map((p) => {
                const c = costs.get(p.id)!;
                const prices = channelPrices(c, p.listPrice, data.channels, data.settings);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="sticky left-0 bg-card font-mono text-xs">
                      <a href={`/productos/${p.id}`} className="text-primary hover:underline">
                        {p.code}
                      </a>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(c.variableCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(c.totalCost)}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.listPrice > 0 ? fmtArs(p.listPrice) : "—"}</TableCell>
                    {prices.map((cp) => (
                      <React.Fragment key={cp.channel.id}>
                        <TableCell className="border-l text-right tabular-nums">
                          {fmtArs(cp.suggestedPrice)}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            p.listPrice > 0
                              ? cp.netMarginAtList < 0
                                ? "text-red-600"
                                : "text-emerald-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {p.listPrice > 0 ? fmtPct(cp.netMarginAtList) : "—"}
                        </TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Las comisiones por canal se configuran en Parámetros → Canales de venta.
        El margen objetivo actual es {fmtPct(data.settings.targetMargin)}.
      </p>
    </div>
  );
}
