import React from "react";
import { loadAll, allProductCosts, channelPrices } from "@/lib/calc";
import { fmtArs, fmtPct } from "@/lib/format";
import { PageHeader } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const target = data.settings.targetMargin;

  // Con todas las comisiones en cero los seis canales dan el mismo número, así
  // que la tabla muestra un precio que no es el real de MercadoLibre ni el de
  // la tienda web. Conviene decirlo antes de que alguien fije precios con eso.
  const noCommissions =
    data.channels.length > 0 &&
    data.channels.every((c) => c.commission === 0 && c.fixedCost === 0);

  // Productos que hoy se venden por debajo del margen objetivo en el canal
  // directo (el primero sin comisión, o el primero de la lista).
  const baseChannel =
    data.channels.find((c) => c.commission === 0 && c.fixedCost === 0) ??
    data.channels[0];
  const underTarget = baseChannel
    ? data.products.filter((p) => {
        if (p.listPrice <= 0) return false;
        const c = costs.get(p.id);
        if (!c) return false;
        const [cp] = channelPrices(c, p.listPrice, [baseChannel], data.settings);
        return cp.netMarginAtList < target;
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Precios por canal"
        description="Se calcula solo. El precio sugerido es el que necesitás en cada canal para llegar al margen objetivo, ya descontadas comisión, impuestos y costo fijo por venta. El margen neto es lo que queda de verdad vendiendo a precio de lista: en ámbar cuando queda por debajo del objetivo, en rojo cuando directamente perdés plata."
      />

      {noCommissions && (
        <Alert className="mb-5 border-[#E0883A]">
          <AlertTitle>Los canales están todos en comisión 0</AlertTitle>
          <AlertDescription>
            Por eso los {data.channels.length} canales muestran el mismo precio.
            MercadoLibre, Tienda web y Mayorista hoy no reflejan lo que
            realmente cobran. Cargá las comisiones en{" "}
            <a href="/parametros" className="underline">Parámetros → Canales</a>{" "}
            antes de fijar precios con esta tabla.
          </AlertDescription>
        </Alert>
      )}

      {underTarget.length > 0 && (
        <Alert className="mb-5 border-[#E0883A]">
          <AlertTitle>
            {underTarget.length === 1
              ? "Un producto está por debajo del margen objetivo"
              : `${underTarget.length} productos están por debajo del margen objetivo`}
          </AlertTitle>
          <AlertDescription>
            {underTarget.map((p) => p.code).join(", ")} se{" "}
            {underTarget.length === 1 ? "vende" : "venden"} a un precio que deja
            menos del {fmtPct(target)} objetivo. Mirá la columna Sugerido: o
            sube el precio, o baja el costo.
          </AlertDescription>
        </Alert>
      )}

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
                          className={`text-right font-bold tabular-nums ${
                            p.listPrice > 0
                              ? cp.netMarginAtList < 0
                                ? "text-destructive"
                                : cp.netMarginAtList < target
                                  ? "text-[#E0883A]"
                                  : "text-[#7AA37A]"
                              : "text-muted-foreground"
                          }`}
                          title={
                            p.listPrice > 0 && cp.netMarginAtList < target
                              ? `Objetivo ${fmtPct(target)}`
                              : undefined
                          }
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
