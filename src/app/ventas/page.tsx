import { loadVentas } from "@/lib/views/client";
import { createSale, updateSale, deleteSale, markSaleCollected } from "@/lib/actions";
import { fmtArs, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { SaleFields } from "@/components/sale-fields";
import { Badge } from "@/components/ui/badge";
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

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  // Contribución, comisión y neto vienen calculados; acá solo se ordena y pinta.
  const { ventas, productos: saleProducts, canales: saleChannels, taxRate } =
    await loadVentas();
  const computed = [...ventas].sort((a, b) => b.sale.date.localeCompare(a.sale.date));
  const today = new Date().toISOString().slice(0, 10);

  const totalNet = computed.reduce((a, s) => a + s.totalNet, 0);
  const totalContrib = computed.reduce((a, s) => a + s.contribution, 0);
  const totalUnits = computed.reduce((a, s) => a + s.sale.qty, 0);
  const pending = computed.filter((s) => s.sale.status === "Pendiente");


  const addSheet = (
    <FormSheet
      title="Registrar venta"
      description="Cargala el mismo día. La comisión del canal, los impuestos y el costo se descuentan solos."
      action={createSale}
      triggerLabel="Nueva venta"
      successMessage="Venta registrada 🎉"
      wide
    >
      <SaleFields
        products={saleProducts}
        channels={saleChannels}
        taxRate={taxRate}
        today={today}
      />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="La página más importante: de acá salen el resultado, la caja y el stock. Cargá cada venta el mismo día."
        actions={addSheet}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Unidades vendidas" value={fmtNum(totalUnits)} />
        <Kpi label="Ventas netas" value={fmtArs(totalNet)} />
        <Kpi
          label="Contribución marginal"
          value={fmtArs(totalContrib)}
          tone={totalContrib > 0 ? "positive" : "neutral"}
          hint={totalNet > 0 ? `Margen ${fmtPct(totalContrib / totalNet)}` : "Lo que queda para pagar los fijos"}
        />
        <Kpi
          label="Cobros pendientes"
          value={fmtArs(pending.reduce((a, s) => a + s.netIncome, 0))}
          tone={pending.length > 0 ? "negative" : "neutral"}
          hint={pending.length > 0 ? `${pending.length} venta(s) sin cobrar` : "Todo cobrado ✔"}
        />
      </div>

      {computed.length === 0 ? (
        <EmptyState
          title="Todavía no hay ventas"
          helper="Cuando vendas la primera lámpara, cargala acá. El resultado, la caja y el stock se actualizan solos."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-right">Nos queda</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead>Cobro</TableHead>
                  <TableHead>Fact.</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.map((s) => {
                  return (
                    <TableRow key={s.sale.id}>
                      <TableCell className="text-xs">{fmtDate(s.sale.date)}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.sale.customer ?? "—"}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.channelName}</TableCell>
                      <TableCell className="font-bold">
                        {s.productCode} {s.sale.qty > 1 ? `×${fmtNum(s.sale.qty)}` : ""}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(s.sale.qty)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(s.totalNet)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(s.commission)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(s.netIncome)}</TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${s.contribution < 0 ? "text-destructive" : "text-[#7AA37A]"}`}>
                        {fmtArs(s.contribution)}
                      </TableCell>
                      <TableCell>
                        {s.sale.status === "Cobrada" ? (
                          <Badge className="bg-[#7AA37A] text-[11px] text-white">
                            Cobrada {s.sale.collectionDate ? fmtDate(s.sale.collectionDate) : ""}
                          </Badge>
                        ) : (
                          <form action={markSaleCollected} className="inline">
                            <input type="hidden" name="id" value={s.sale.id} />
                            <Button type="submit" variant="secondary" size="xs">
                              Marcar cobrada
                            </Button>
                          </form>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-bold">{s.sale.invoiced ? "Sí" : "No"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <FormSheet
                          mode="edit"
                          title={`Editar la venta del ${fmtDate(s.sale.date)}`}
                          action={updateSale}
                          successMessage="Venta actualizada"
                          wide
                        >
                          <input type="hidden" name="id" value={s.sale.id} />
                          <SaleFields
                            products={saleProducts}
                            channels={saleChannels}
                            taxRate={taxRate}
                            today={today}
                            sale={s.sale}
                          />
                        </FormSheet>
                        <ConfirmDelete action={deleteSale} id={s.sale.id} what={`la venta del ${fmtDate(s.sale.date)} (${s.productCode})`} />
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
