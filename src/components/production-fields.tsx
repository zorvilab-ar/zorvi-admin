"use client";

import * as React from "react";
import { NumberField, SelectField } from "@/components/fields";
import { fmtNum } from "@/lib/format";

/**
 * Producto + horas + gramos de una tanda.
 *
 * Al elegir el producto precarga horas y gramos desde la receta (lo estimado
 * × unidades), para que solo haya que corregir el desvío real en vez de
 * tipear los dos números de cero. Si el usuario ya tocó un campo a mano, no
 * se lo pisa.
 */
export type ProductEstimate = {
  id: number;
  code: string;
  name: string;
  printHours: number;
  grams: number;
  filamentSupplyId: number | null;
};

export function ProductionFields({
  products,
  filaments,
  printers,
  run,
}: {
  products: ProductEstimate[];
  filaments: { id: number; label: string }[];
  printers: { id: number; label: string }[];
  run?: {
    productId: number;
    unitsOk: number;
    unitsFailed: number;
    hoursReal: number;
    gramsReal: number;
    filamentSupplyId: number | null;
    assetId: number | null;
  };
}) {
  const [productId, setProductId] = React.useState(run?.productId ?? 0);
  const [unitsOk, setUnitsOk] = React.useState(run?.unitsOk ?? 1);
  const [unitsFailed, setUnitsFailed] = React.useState(run?.unitsFailed ?? 0);
  const [hours, setHours] = React.useState(run ? String(run.hoursReal) : "");
  const [grams, setGrams] = React.useState(run ? String(run.gramsReal) : "");
  const [filamentId, setFilamentId] = React.useState(
    run?.filamentSupplyId ? String(run.filamentSupplyId) : "",
  );
  // Una vez que alguien escribe el número real, la receta deja de pisarlo.
  const [touched, setTouched] = React.useState({ hours: !!run, grams: !!run });

  const product = products.find((p) => p.id === productId);
  const attempted = (Number(unitsOk) || 0) + (Number(unitsFailed) || 0);
  const estHours = product ? product.printHours * attempted : 0;
  const estGrams = product ? product.grams * attempted : 0;

  // Recalcula lo estimado mientras el campo siga sin tocarse a mano. Se ajusta
  // durante el render, no en un efecto: evita el parpadeo del valor anterior.
  const [lastEst, setLastEst] = React.useState({ h: estHours, g: estGrams });
  if (estHours !== lastEst.h || estGrams !== lastEst.g) {
    setLastEst({ h: estHours, g: estGrams });
    if (!touched.hours) setHours(estHours ? String(round(estHours)) : "");
    if (!touched.grams) setGrams(estGrams ? String(round(estGrams)) : "");
  }

  const pickProduct = (id: number) => {
    setProductId(id);
    const next = products.find((p) => p.id === id);
    if (next?.filamentSupplyId && !filamentId) {
      setFilamentId(String(next.filamentSupplyId));
    }
  };

  const deviation = (real: string, est: number) => {
    const r = parseFloat(real);
    if (!Number.isFinite(r) || est <= 0) return undefined;
    const d = r - est;
    if (Math.abs(d) < 0.01) return "Igual a lo estimado por la receta.";
    return `${d > 0 ? "+" : ""}${fmtNum(d)} contra lo estimado (${fmtNum(est)}).`;
  };

  return (
    <>
      <SelectField
        name="productId"
        label="Producto"
        value={productId ? String(productId) : ""}
        onValueChange={(v) => pickProduct(Number(v))}
        options={products.map((p) => ({
          value: p.id,
          label: `${p.code} — ${p.name}`,
        }))}
        placeholder="¿Qué se imprimió?"
        required
      />
      <NumberField
        name="unitsOk"
        label="Unidades que salieron bien"
        value={String(unitsOk)}
        onValueChange={(v) => setUnitsOk(Number(v) || 0)}
        required
        hint="Van directo al stock de terminados."
      />
      <NumberField
        name="unitsFailed"
        label="Unidades falladas"
        value={String(unitsFailed)}
        onValueChange={(v) => setUnitsFailed(Number(v) || 0)}
        hint="Impresiones tiradas. Sirve para comparar con la tasa de fallas estimada."
      />
      <SelectField
        name="filamentSupplyId"
        label="Filamento usado"
        value={filamentId}
        onValueChange={setFilamentId}
        options={filaments.map((f) => ({ value: f.id, label: f.label }))}
        placeholder="Elegir filamento…"
        hint="Se descuenta de los rollos abiertos, del más viejo al más nuevo."
      />
      <NumberField
        name="hoursReal"
        label="Horas reales de impresión"
        suffix="h"
        value={hours}
        onValueChange={(v) => {
          setTouched((t) => ({ ...t, hours: true }));
          setHours(v);
        }}
        hint={
          deviation(hours, estHours) ??
          "Las de la pantalla de la impresora. Suman al desgaste de la máquina."
        }
      />
      <NumberField
        name="gramsReal"
        label="Filamento consumido"
        suffix="g"
        value={grams}
        onValueChange={(v) => {
          setTouched((t) => ({ ...t, grams: true }));
          setGrams(v);
        }}
        hint={
          deviation(grams, estGrams) ??
          "Incluida la purga. Se descuenta del stock del filamento elegido."
        }
      />
      <SelectField
        name="assetId"
        label="Impresora"
        defaultValue={run?.assetId ?? undefined}
        options={printers.map((p) => ({ value: p.id, label: p.label }))}
        placeholder={printers.length ? "¿En qué equipo?" : "No hay impresoras cargadas"}
        hint="Solo impresoras: el desgaste de una tanda tiene que ir al equipo que imprimió."
      />
    </>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
