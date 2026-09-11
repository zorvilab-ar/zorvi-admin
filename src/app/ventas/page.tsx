import { loadAll, allSalesComputed, allProductCosts, productStocks } from "@/lib/calc";
import { createSale, deleteSale, markSaleCollected } from "@/lib/actions";
import { fmtArs, fmtNum, fmtPct, fmtDate } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, DateField, SelectField, CheckboxField } from "@/components/fields";
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
  const data = await loadAll();
  const computed = allSalesComputed(data).sort((a, b) => b.sale.date.localeCompare(a.sale.date));
  const productsById = new Map(data.products.map((p) => [p.id, p]));
  const channelsById = new Map(data.channels.map((c) => [c.id, c]));
  const stocks = new Map(productStocks(data).map((s) => [s.product.id, s.current]));
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
      <DateField name="date" label="Fecha de la venta" defaultValue={today} required />
      <TextField name="customer" label="Cliente" placeholder="Nombre o @instagram" />
      <SelectField
        name="channelId"
        label="Canal"
        options={data.channels.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="¿Por dónde se vendió?"
        required
        hint="Define la comisión que se descuenta."
      />
      <SelectField
        name="productId"
        label="Producto"
        options={data.products.map((p) => ({
          value: p.id,
          label: `${p.code} — ${p.name} (stock: ${fmtNum(stocks.get(p.id) ?? 0)})`,
        }))}
        placeholder="¿Qué se vendió?"
        required
      />
      <NumberField name="qty" label="Cantidad" defaultValue={1} required />
      <NumberField name="unitPrice" label="Precio unitario cobrado" suffix="ARS" required hint="El precio real de esta venta, con descuento ya aplicado si lo hubo en el precio." />
      <NumberField name="discount" label="Descuento" defaultValue={0} suffix="ARS" hint="En pesos, sobre el total." />
      <NumberField name="shipping" label="Envío a cargo nuestro" defaultValue={0} suffix="ARS" hint="Solo si el envío lo pagamos nosotros." />
      <TextField name="paymentMethod" label="Medio de pago" placeholder="Efectivo, transferencia, MP…" />
      <SelectField
        name="status"
        label="¿Ya se cobró?"
        defaultValue="Cobrada"
        options={[
          { value: "Cobrada", label: "Sí, cobrada" },
          { value: "Pendiente", label: "No, cobro pendiente" },
        ]}
        hint="Si está pendiente, después la marcás cobrada desde la tabla."
      />
      <DateField name="collectionDate" label="Fecha de cobro (si fue otro día)" hint="Vacío = misma fecha de la venta. Arma el flujo de caja." />
      <TextField name="receipt" label="Comprobante" placeholder="N° de factura o recibo" />
      <CheckboxField name="invoiced" label="Se facturó (ARCA)" hint="Suma al control del tope de monotributo." />
      <TextField name="notes" label="Notas" span2 />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="La página más importante: de acá salen el resultado, la caja y el stock. Cargá cada venta el mismo día."
        actions={addSheet}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
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
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {computed.map((s) => {
                  const p = productsById.get(s.sale.productId);
                  const ch = channelsById.get(s.sale.channelId);
                  return (
                    <TableRow key={s.sale.id}>
                      <TableCell className="text-xs">{fmtDate(s.sale.date)}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.sale.customer ?? "—"}</TableCell>
                      <TableCell className="text-xs font-semibold">{ch?.name}</TableCell>
                      <TableCell className="font-bold">
                        {p?.code} {s.sale.qty > 1 ? `×${fmtNum(s.sale.qty)}` : ""}
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
                      <TableCell className="text-right">
                        <ConfirmDelete action={deleteSale} id={s.sale.id} what={`la venta del ${fmtDate(s.sale.date)} (${p?.code})`} />
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
