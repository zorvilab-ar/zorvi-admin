"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtArs, fmtDate, fmtNum } from "@/lib/format";
import { errorToast, esErrorDeConexion } from "@/lib/errors";
import type { PedidoWeb } from "@/lib/shop/client";

/**
 * La bandeja: elegir pedidos y asentarlos como ventas.
 *
 * El trabajo pesado lo hace el backend en una transacción — asienta las
 * ventas, libera las reservas y republica el stock. Acá solo se elige qué
 * entra y se avisa cómo salió.
 */
export function PedidosWeb({
  pedidos,
  importar,
}: {
  pedidos: PedidoWeb[];
  importar: (fd: FormData) => Promise<void>;
}) {
  const [elegidos, setElegidos] = React.useState<string[]>([]);
  const [pending, startTransition] = React.useTransition();

  const alternar = (n: string) =>
    setElegidos((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const todos = elegidos.length === pedidos.length && pedidos.length > 0;
  const alternarTodos = () => setElegidos(todos ? [] : pedidos.map((p) => p.number));

  const asentar = () => {
    const fd = new FormData();
    fd.set("numbers", elegidos.join(","));
    const cuantos = elegidos.length;
    startTransition(async () => {
      try {
        await importar(fd);
        setElegidos([]);
        toast.success(
          cuantos === 1
            ? "Pedido asentado como venta"
            : `${cuantos} pedidos asentados como ventas`,
          { description: "Ya figuran en Ventas y el stock de la tienda quedó al día." },
        );
      } catch (e) {
        toast.error(
          esErrorDeConexion(e)
            ? errorToast(e)
            : e instanceof Error
              ? e.message
              : "No se pudieron asentar los pedidos.",
        );
        console.error(e);
      }
    });
  };

  const seleccionados = pedidos.filter((p) => elegidos.includes(p.number));
  const totalElegido = seleccionados.reduce((a, p) => a + p.subtotal, 0);

  return (
    <>
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={todos}
                    onChange={alternarTodos}
                    aria-label="Elegir todos los pedidos"
                    className="h-4 w-4 accent-[#C8382D]"
                  />
                </TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Qué compró</TableHead>
                <TableHead className="text-right">Productos</TableHead>
                <TableHead className="text-right">Envío cobrado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((p) => (
                <TableRow
                  key={p.number}
                  className={elegidos.includes(p.number) ? "bg-[#FFF7EA]" : undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={elegidos.includes(p.number)}
                      onChange={() => alternar(p.number)}
                      aria-label={`Elegir el pedido ${p.number}`}
                      className="h-4 w-4 accent-[#C8382D]"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold">{p.number}</TableCell>
                  <TableCell className="text-xs">{fmtDate(p.paidAt)}</TableCell>
                  <TableCell className="text-sm font-bold">
                    {p.customerName}
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {p.customerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.items.map((i, n) => (
                      <span key={`${p.number}-${i.code}-${n}`} className="block">
                        {fmtNum(i.qty)} × {i.name}{" "}
                        <span className="text-muted-foreground">({i.code})</span>
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(p.subtotal)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.shippingCost > 0 ? fmtArs(p.shippingCost) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {fmtArs(p.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground">
          {elegidos.length === 0
            ? "Elegí los pedidos que querés asentar."
            : `${fmtNum(elegidos.length)} pedido(s) · ${fmtArs(totalElegido)} en productos. El envío cobrado no entra como venta.`}
        </span>
        <Button onClick={asentar} disabled={elegidos.length === 0 || pending}>
          {pending ? "Asentando…" : "Asentar como ventas"}
        </Button>
      </div>
    </>
  );
}
