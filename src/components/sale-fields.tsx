"use client";

import * as React from "react";
import {
  TextField,
  NumberField,
  DateField,
  SelectField,
  CheckboxField,
} from "@/components/fields";
import { fmtArs, fmtNum, fmtPct } from "@/lib/format";

/**
 * Campos de una venta, con el precio precargado y la ganancia en vivo.
 *
 * Antes el precio unitario arrancaba vacío y sin ninguna referencia: había que
 * ir a Precios por canal en otra pantalla, y nadie iba. Ahora el precio llega
 * ajustado al canal elegido (editable), y debajo se ve qué queda de esa venta
 * — en rojo si el precio cae por debajo del costo variable.
 */

export type SaleProduct = {
  id: number;
  code: string;
  name: string;
  listPrice: number;
  variableCost: number;
  stock: number;
};

export type SaleChannel = {
  id: number;
  name: string;
  commission: number;
  fixedCost: number;
};

export type SaleRow = {
  id: number;
  date: string;
  customer: string | null;
  channelId: number;
  productId: number;
  qty: number;
  unitPrice: number;
  discount: number;
  shipping: number;
  paymentMethod: string | null;
  status: string;
  collectionDate: string | null;
  receipt: string | null;
  invoiced: boolean;
  notes: string | null;
};

export function SaleFields({
  products,
  channels,
  taxRate,
  today,
  sale,
}: {
  products: SaleProduct[];
  channels: SaleChannel[];
  /** IIBB + otros impuestos, como fracción sobre la venta. */
  taxRate: number;
  today: string;
  sale?: SaleRow;
}) {
  const [channelId, setChannelId] = React.useState(
    sale ? String(sale.channelId) : "",
  );
  const [productId, setProductId] = React.useState(
    sale ? String(sale.productId) : "",
  );
  const [qty, setQty] = React.useState(sale ? String(sale.qty) : "1");
  const [unitPrice, setUnitPrice] = React.useState(
    sale ? String(sale.unitPrice) : "",
  );
  const [discount, setDiscount] = React.useState(
    sale ? String(sale.discount) : "0",
  );
  const [shipping, setShipping] = React.useState(
    sale ? String(sale.shipping) : "0",
  );
  // Al editar, el precio ya cargado manda: no se pisa con el sugerido.
  const [priceTouched, setPriceTouched] = React.useState(!!sale);

  const product = products.find((p) => String(p.id) === productId);
  const channel = channels.find((c) => String(c.id) === channelId);

  // Precio de lista llevado al canal: lo que hay que cobrar ahí para que, ya
  // descontadas comisión, impuestos y costo fijo, quede lo mismo que vendiendo
  // en directo al precio de lista.
  const keep = 1 - (channel?.commission ?? 0) - taxRate;
  const channelPrice =
    product && product.listPrice > 0 && keep > 0
      ? (product.listPrice + (channel?.fixedCost ?? 0)) / keep
      : 0;

  // Se ajusta durante el render, no en un efecto: así el campo nunca llega a
  // pintarse con el precio viejo del canal anterior.
  const [lastSuggested, setLastSuggested] = React.useState(channelPrice);
  if (channelPrice !== lastSuggested) {
    setLastSuggested(channelPrice);
    if (!priceTouched && channelPrice > 0) {
      setUnitPrice(String(Math.round(channelPrice)));
    }
  }

  // Misma cuenta que computeSale() en el server, para que lo que se ve acá
  // sea exactamente lo que después muestra la tabla.
  const n = (v: string) => {
    const x = parseFloat(v);
    return Number.isFinite(x) ? x : 0;
  };
  const qtyNum = n(qty) || 0;
  const subtotal = qtyNum * n(unitPrice);
  const totalNet = subtotal - n(discount);
  const commission = channel
    ? totalNet * channel.commission + channel.fixedCost
    : 0;
  const taxes = totalNet * taxRate;
  const netIncome = totalNet - commission - n(shipping) - taxes;
  const variableCost = (product?.variableCost ?? 0) * qtyNum;
  const contribution = netIncome - variableCost;
  const marginPct = totalNet > 0 ? contribution / totalNet : 0;

  const belowCost =
    !!product && product.variableCost > 0 && n(unitPrice) > 0 &&
    n(unitPrice) < product.variableCost;
  const showResult = !!product && !!channel && totalNet > 0;

  return (
    <>
      <DateField
        name="date"
        label="Fecha de la venta"
        defaultValue={sale?.date ?? today}
        required
      />
      <TextField
        name="customer"
        label="Cliente"
        defaultValue={sale?.customer}
        placeholder="Nombre o @instagram"
      />
      <SelectField
        name="channelId"
        label="Canal"
        value={channelId}
        onValueChange={setChannelId}
        options={channels.map((c) => ({
          value: c.id,
          label: c.commission > 0 ? `${c.name} (${fmtPct(c.commission)})` : c.name,
        }))}
        placeholder="¿Por dónde se vendió?"
        required
        hint="Define la comisión que se descuenta."
      />
      <SelectField
        name="productId"
        label="Producto"
        value={productId}
        onValueChange={setProductId}
        options={products.map((p) => ({
          value: p.id,
          label: `${p.code} — ${p.name} (stock: ${fmtNum(p.stock)})`,
        }))}
        placeholder="¿Qué se vendió?"
        required
      />
      <NumberField
        name="qty"
        label="Cantidad"
        value={qty}
        onValueChange={setQty}
        required
      />
      <NumberField
        name="unitPrice"
        label="Precio unitario cobrado"
        suffix="ARS"
        value={unitPrice}
        onValueChange={(v) => {
          setPriceTouched(true);
          setUnitPrice(v);
        }}
        required
        hint={
          channelPrice > 0
            ? `Sugerido en ${channel?.name ?? "este canal"}: ${fmtArs(channelPrice)}. Editalo si cobraste otra cosa.`
            : "El precio real de esta venta, con descuento ya aplicado si lo hubo en el precio."
        }
      />
      <NumberField
        name="discount"
        label="Descuento"
        value={discount}
        onValueChange={setDiscount}
        suffix="ARS"
        hint="En pesos, sobre el total."
      />
      <NumberField
        name="shipping"
        label="Envío a cargo nuestro"
        value={shipping}
        onValueChange={setShipping}
        suffix="ARS"
        hint="Solo si el envío lo pagamos nosotros."
      />
      <TextField
        name="paymentMethod"
        label="Medio de pago"
        defaultValue={sale?.paymentMethod}
        placeholder="Efectivo, transferencia, MP…"
      />
      <SelectField
        name="status"
        label="¿Ya se cobró?"
        defaultValue={sale?.status ?? "Cobrada"}
        options={[
          { value: "Cobrada", label: "Sí, cobrada" },
          { value: "Pendiente", label: "No, cobro pendiente" },
        ]}
        hint="Si está pendiente, después la marcás cobrada desde la tabla."
      />
      <DateField
        name="collectionDate"
        label="Fecha de cobro (si fue otro día)"
        defaultValue={sale?.collectionDate}
        hint="Vacío = misma fecha de la venta. Arma el flujo de caja."
      />
      <TextField
        name="receipt"
        label="Comprobante"
        defaultValue={sale?.receipt}
        placeholder="N° de factura o recibo"
      />
      <CheckboxField
        name="invoiced"
        label="Se facturó (ARCA)"
        defaultChecked={sale?.invoiced}
        hint="Suma al control del tope de monotributo."
      />
      <TextField name="notes" label="Notas" defaultValue={sale?.notes} span2 />

      <div
        className={`sm:col-span-2 rounded-[12px] border-3 px-3 py-3 ${
          belowCost || (showResult && contribution < 0)
            ? "border-destructive bg-destructive/10"
            : "border-border bg-secondary"
        }`}
      >
        {!showResult ? (
          <p className="text-[11px] font-semibold leading-snug text-muted-foreground">
            Elegí canal, producto y precio para ver cuánto deja esta venta.
          </p>
        ) : (
          <>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              {contribution >= 0 ? "Te quedan" : "Perdés"}
            </div>
            <div className="font-display text-2xl tabular-nums">
              {fmtArs(Math.abs(contribution))}
              <span className="ml-2 text-base">margen {fmtPct(marginPct)}</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">
              {fmtArs(totalNet)} de venta − {fmtArs(commission)} de comisión
              {taxes > 0 ? ` − ${fmtArs(taxes)} de impuestos` : ""}
              {n(shipping) > 0 ? ` − ${fmtArs(n(shipping))} de envío` : ""} −{" "}
              {fmtArs(variableCost)} de costo variable.
            </p>
            {belowCost && (
              <p className="mt-1.5 text-[11px] font-extrabold leading-snug text-destructive">
                El precio está por debajo del costo variable del producto (
                {fmtArs(product!.variableCost)} por unidad): cada unidad que
                vendas a este precio pierde plata.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
