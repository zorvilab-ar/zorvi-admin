"use client";

import * as React from "react";
import {
  TextField,
  NumberField,
  DateField,
  SelectField,
  CheckboxField,
} from "@/components/fields";
import { fmtArs, fmtArsDec } from "@/lib/format";

/**
 * Campos de una compra, con los dos asientos que antes había que hacer a mano.
 *
 * El drawer ya pedía cantidad, monto y quién pagó, pero esos datos no volvían
 * a ningún lado: el costo del insumo se seguía editando en Insumos y el aporte
 * del socio había que cargarlo de nuevo en Socios. Ahora los dos checkboxes
 * dicen exactamente qué van a hacer, con el número ya calculado.
 */

export type SupplyOption = {
  id: number;
  code: string;
  name: string;
  unit: string;
  purchasePrice: number;
  packQty: number;
};

export type PurchaseRow = {
  id: number;
  date: string;
  supplier: string | null;
  type: string;
  detail: string | null;
  supplyId: number | null;
  qty: number;
  amountArs: number;
  paymentMethod: string | null;
  paidBy: string | null;
  status: string;
  paymentDate: string | null;
  receipt: string | null;
  notes: string | null;
};

export function PurchaseFields({
  supplies,
  partners,
  today,
  purchase,
  linkedContribution = false,
}: {
  supplies: SupplyOption[];
  partners: string[];
  today: string;
  purchase?: PurchaseRow;
  /** La compra ya generó un aporte: el checkbox arranca tildado. */
  linkedContribution?: boolean;
}) {
  const [type, setType] = React.useState(purchase?.type ?? "");
  const [supplyId, setSupplyId] = React.useState(
    purchase?.supplyId ? String(purchase.supplyId) : "",
  );
  const [qty, setQty] = React.useState(purchase ? String(purchase.qty) : "");
  const [amount, setAmount] = React.useState(
    purchase ? String(purchase.amountArs) : "",
  );
  const [paidBy, setPaidBy] = React.useState(purchase?.paidBy ?? "");

  const supply = supplies.find((s) => String(s.id) === supplyId);
  const qtyNum = parseFloat(qty);
  const amountNum = parseFloat(amount);

  const canPriceSupply =
    !!supply &&
    Number.isFinite(qtyNum) &&
    qtyNum > 0 &&
    Number.isFinite(amountNum) &&
    amountNum > 0;
  const newUnitCost = canPriceSupply ? amountNum / qtyNum : 0;
  const oldUnitCost =
    supply && supply.packQty > 0 ? supply.purchasePrice / supply.packQty : 0;
  const costDelta =
    canPriceSupply && oldUnitCost > 0
      ? (newUnitCost - oldUnitCost) / oldUnitCost
      : null;

  const isPartner = partners.includes(paidBy);

  return (
    <>
      <DateField
        name="date"
        label="Fecha"
        defaultValue={purchase?.date ?? today}
        required
      />
      <TextField
        name="supplier"
        label="Proveedor"
        defaultValue={purchase?.supplier}
        placeholder="Mercado Libre, ProyectoColor…"
      />
      <SelectField
        name="type"
        label="Tipo de gasto"
        value={type}
        onValueChange={setType}
        options={[
          { value: "Insumo", label: "Insumo (filamento, componentes) → suma stock" },
          { value: "Costo fijo", label: "Costo fijo (monotributo, ads, software)" },
          { value: "Activo", label: "Activo (impresora, herramientas)" },
          { value: "Otro", label: "Otro" },
        ]}
        placeholder="Elegir…"
        required
        hint={
          type === "Activo"
            ? "Cargalo también en Activos para que se amortice por hora."
            : undefined
        }
      />
      <TextField
        name="detail"
        label="Detalle"
        defaultValue={purchase?.detail}
        placeholder="Rollo PLA negro 1 kg"
      />
      <SelectField
        name="supplyId"
        label="Insumo (solo si el tipo es Insumo)"
        value={supplyId}
        onValueChange={setSupplyId}
        options={supplies.map((s) => ({
          value: s.id,
          label: `${s.code} — ${s.name} (${s.unit})`,
        }))}
        placeholder="Elegir insumo…"
        hint="Vincula la compra al stock de ese insumo."
      />
      <NumberField
        name="qty"
        label="Cantidad comprada"
        value={qty}
        onValueChange={setQty}
        suffix={supply?.unit}
        hint={
          supply
            ? `En ${supply.unit}: un rollo de 1 kg son 1000 g.`
            : "En la unidad del insumo: un rollo de 1 kg = 1000 g."
        }
      />
      <NumberField
        name="amountArs"
        label="Monto total"
        value={amount}
        onValueChange={setAmount}
        suffix="ARS"
        required
      />
      <TextField
        name="paymentMethod"
        label="Medio de pago"
        defaultValue={purchase?.paymentMethod}
      />
      <SelectField
        name="paidBy"
        label="¿Quién lo pagó?"
        value={paidBy}
        onValueChange={setPaidBy}
        options={[
          { value: "Caja", label: "Caja del negocio" },
          ...partners.map((p) => ({ value: p, label: p })),
        ]}
        placeholder="Elegir…"
      />
      <SelectField
        name="status"
        label="¿Ya está pagada?"
        defaultValue={purchase?.status ?? "Pagada"}
        options={[
          { value: "Pagada", label: "Sí, pagada" },
          { value: "Pendiente", label: "No, pago pendiente" },
        ]}
      />
      <TextField
        name="receipt"
        label="Comprobante"
        defaultValue={purchase?.receipt}
        placeholder="N° de factura o recibo"
      />
      <TextField name="notes" label="Notas" defaultValue={purchase?.notes} span2 />
      {/* Al editar se conserva la fecha de pago original; si se pasa de
          Pendiente a Pagada queda vacía y la action le pone la de la compra. */}
      {purchase && (
        <input
          type="hidden"
          name="paymentDate"
          value={purchase.paymentDate ?? ""}
        />
      )}

      <div className="sm:col-span-2 space-y-2 rounded-[12px] border-2 border-dashed border-border bg-muted/40 p-3">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Qué más actualiza esta compra
        </div>

        {canPriceSupply ? (
          <CheckboxField
            name="updateSupplyCost"
            label={`Actualizar el costo de ${supply!.code} a ${fmtArsDec(newUnitCost)}/${supply!.unit}`}
            // Al editar arranca destildado: reabrir una compra vieja para
            // corregir una nota no puede pisar el precio actual del insumo
            // con el de aquella compra.
            defaultChecked={!purchase}
            hint={
              oldUnitCost > 0
                ? `Hoy está en ${fmtArsDec(oldUnitCost)}/${supply!.unit}${
                    costDelta !== null && Math.abs(costDelta) >= 0.005
                      ? ` — ${costDelta > 0 ? "subió" : "bajó"} ${Math.abs(costDelta * 100).toFixed(1)}%`
                      : " — sin cambio"
                  }. Recalcula el costo de cada producto que lo use.`
                : "El insumo todavía no tenía precio cargado."
            }
          />
        ) : (
          <p className="text-[11px] font-semibold leading-snug text-muted-foreground">
            Elegí un insumo y cargá cantidad y monto para poder actualizar su
            costo unitario desde acá.
          </p>
        )}

        {isPartner ? (
          <CheckboxField
            name="registerContribution"
            label={`Registrar también como aporte de ${paidBy}`}
            defaultChecked={purchase ? linkedContribution : true}
            hint={
              Number.isFinite(amountNum) && amountNum > 0
                ? `Suma ${fmtArs(amountNum)} a su capital y deja la caja cuadrada. Se mantiene sincronizado con esta compra.`
                : "Suma el monto a su capital y deja la caja cuadrada."
            }
          />
        ) : (
          <p className="text-[11px] font-semibold leading-snug text-muted-foreground">
            {paidBy === "Caja"
              ? "Pagado por la caja del negocio: no genera aporte de ningún socio."
              : "Si lo pagó un socio de su bolsillo, elegilo arriba y se registra el aporte solo."}
          </p>
        )}
      </div>
    </>
  );
}
