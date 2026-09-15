"use client";

import * as React from "react";
import { customPrintCost } from "@/lib/print-cost";
import { fmtArs, fmtArsDec, fmtPct } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type FilamentOpt = { id: number; name: string; pricePerKg: number };
type AssetOpt = {
  id: number;
  name: string;
  amortPerHour: number;
  usefulLifeHours: number;
  costArs: number;
};

export function CalculatorForm({
  filaments,
  assets,
  printerWatts,
  kwhPrice,
  failureRate,
  targetMargin,
  assemblyRate,
  designRate,
  marketCommission,
  marketFixed,
}: {
  filaments: FilamentOpt[];
  assets: AssetOpt[];
  printerWatts: number;
  kwhPrice: number;
  failureRate: number;
  targetMargin: number;
  assemblyRate: number;
  designRate: number;
  marketCommission: number;
  marketFixed: number;
}) {
  const [filamentId, setFilamentId] = React.useState(filaments[0]?.id ?? 0);
  const [assetId, setAssetId] = React.useState(assets[0]?.id ?? 0);
  const [pricePerKg, setPricePerKg] = React.useState(
    filaments[0]?.pricePerKg ?? 0,
  );
  const [watts, setWatts] = React.useState(printerWatts);
  const [kwh, setKwh] = React.useState(kwhPrice);
  const [failPct, setFailPct] = React.useState(failureRate * 100);
  const [marginPct, setMarginPct] = React.useState(targetMargin * 100);
  const [grams, setGrams] = React.useState(150);
  const [hours, setHours] = React.useState(8);
  const [qty, setQty] = React.useState(1);
  const [extras, setExtras] = React.useState(0);
  const [assemblyMin, setAssemblyMin] = React.useState(0);
  const [designHours, setDesignHours] = React.useState(0);
  const [assemblyPrice, setAssemblyPrice] = React.useState(assemblyRate);
  const [designPrice, setDesignPrice] = React.useState(designRate);

  const filament = filaments.find((f) => f.id === filamentId);
  const asset = assets.find((a) => a.id === assetId);
  const amort = asset?.amortPerHour ?? 0;

  const cost = customPrintCost({
    grams,
    hours,
    qty,
    filamentPricePerKg: pricePerKg,
    extraSuppliesArs: extras,
    assemblyMinutes: assemblyMin,
    designHours,
    assemblyRate: assemblyPrice,
    designRate: designPrice,
    failureRate: failPct / 100,
    printerWatts: watts,
    kwhPrice: kwh,
    amortPerHour: amort,
    targetMargin: marginPct / 100,
    marketCommission,
    marketFixed,
  });

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Card>
        <CardContent className="space-y-5 pt-1">
          <div>
            <h2 className="font-display text-lg tracking-wide">Pieza</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Datos del slicer y extras (portalámparas, packaging, etc.).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Num
              label="Gramos de filamento"
              suffix="g"
              value={grams}
              onChange={setGrams}
            />
            <Num
              label="Horas de impresión"
              suffix="h"
              value={hours}
              onChange={setHours}
            />
            <Num label="Cantidad" suffix="u" value={qty} onChange={setQty} />
            <Num
              label="Insumos extra"
              suffix="ARS"
              value={extras}
              onChange={setExtras}
              hint="Por unidad. Portalámparas, cable, caja…"
            />
          </div>

          <div className="border-t-2 border-border pt-4">
            <h2 className="font-display text-lg tracking-wide">Mano de obra</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Las horas que ponés vos. El armado se cobra por pieza; el diseño,
              una sola vez para todo el pedido.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Num
              label="Armado y post-proceso"
              suffix="min"
              value={assemblyMin}
              onChange={setAssemblyMin}
              hint="Por unidad: lijado, pegado, cableado, prueba."
            />
            <Num
              label="Valor de la hora de armado"
              suffix="ARS"
              value={assemblyPrice}
              onChange={setAssemblyPrice}
            />
            <Num
              label="Diseño / modelado"
              suffix="h"
              value={designHours}
              onChange={setDesignHours}
              hint="Una sola vez para el pedido, no por unidad."
            />
            <Num
              label="Valor de la hora de diseño"
              suffix="ARS"
              value={designPrice}
              onChange={setDesignPrice}
            />
          </div>

          <div className="border-t-2 border-border pt-4">
            <h2 className="font-display text-lg tracking-wide">Costos</h2>
            <p className="text-xs font-semibold text-muted-foreground">
              Arrancan con los valores de Insumos, Activos y Parámetros.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Filamento"
              value={filamentId}
              onChange={(id) => {
                setFilamentId(id);
                const next = filaments.find((f) => f.id === id);
                if (next) setPricePerKg(next.pricePerKg);
              }}
              options={filaments.map((f) => ({ value: f.id, label: f.name }))}
              empty="Cargá un filamento en Insumos"
            />
            <Num
              label="Precio del kilo"
              suffix="ARS"
              value={Math.round(pricePerKg)}
              onChange={setPricePerKg}
              hint={filament ? filament.name : undefined}
            />
            <Select
              label="Impresora"
              value={assetId}
              onChange={setAssetId}
              options={assets.map((a) => ({ value: a.id, label: a.name }))}
              empty="Cargá un activo para el desgaste"
            />
            <Num
              label="Consumo de la impresora"
              suffix="W"
              value={watts}
              onChange={setWatts}
            />
            <Num
              label="Precio del kWh"
              suffix="ARS"
              value={kwh}
              onChange={setKwh}
            />
            <Num
              label="Margen de falla"
              suffix="%"
              value={failPct}
              onChange={setFailPct}
            />
            <Num
              label="Margen objetivo"
              suffix="%"
              value={marginPct}
              onChange={setMarginPct}
              hint="Sobre el costo total. Precio = costo ÷ (1 − margen)."
            />
            <div className="rounded-[10px] border-2 border-border bg-muted/50 px-3 py-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Desgaste / hora
              </div>
              <div className="font-display text-lg tabular-nums">
                {fmtArsDec(amort)}
              </div>
              {asset && (
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {fmtArs(asset.costArs)} ÷ {asset.usefulLifeHours} h
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardContent className="space-y-3 pt-1">
          <h2 className="font-display text-lg tracking-wide">Resultado</h2>
          <Row label="Material" value={fmtArs(cost.material)} />
          <Row label="Luz" value={fmtArs(cost.energy)} />
          <Row label="Desgaste de máquina" value={fmtArs(cost.wear)} />
          {cost.labor > 0 && (
            <Row
              label="Mano de obra"
              value={fmtArs(cost.labor)}
              hint={
                cost.assembly > 0 && cost.design > 0
                  ? `${fmtArs(cost.assembly)} de armado + ${fmtArs(cost.design)} de diseño`
                  : undefined
              }
            />
          )}
          <Row
            label={`Fallas (${fmtPct(failPct / 100)})`}
            value={fmtArs(cost.errorMargin)}
          />
          <Row
            label="Costo sin insumos extra"
            value={fmtArs(cost.costWithoutSupplies)}
            strong
          />
          <Row
            label="Insumos extra"
            value={fmtArs(cost.extras)}
            warn={cost.extrasHigh}
            hint={cost.extrasHigh ? "Más del 30% del costo de impresión" : undefined}
          />
          <div className="rounded-xl border-3 border-border bg-secondary px-3 py-3 shadow-[3px_3px_0_var(--border)]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Total a cobrar
            </div>
            <div className="font-display text-3xl tabular-nums text-primary">
              {fmtArs(cost.charge)}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              Costo {fmtArs(cost.totalCost)} + margen {fmtPct(marginPct / 100)}
            </p>
          </div>
          <div className="rounded-xl border-2 border-border bg-[#FFF7EA] px-3 py-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Precio Mercado Libre
            </div>
            <div className="font-display text-2xl tabular-nums">
              {fmtArs(cost.market)}
            </div>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              {marketCommission > 0
                ? `Comisión ${fmtPct(marketCommission)}${marketFixed > 0 ? ` + ${fmtArs(marketFixed)} fijo` : ""}`
                : "Estimado +22,5%. Cargá la comisión del canal MercadoLibre para el número real."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  warn,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  warn?: boolean;
  hint?: string;
}) {
  return (
    <div className={warn ? "rounded-lg bg-primary/10 px-2 py-1.5" : ""}>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`text-sm font-bold ${strong ? "font-display tracking-wide" : ""}`}
        >
          {label}
        </span>
        <span
          className={`tabular-nums ${strong ? "font-display text-lg" : "text-sm font-extrabold"}`}
        >
          {value}
        </span>
      </div>
      {hint && (
        <p
          className={`text-[11px] font-semibold ${warn ? "text-primary" : "text-muted-foreground"}`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function Num({
  label,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-extrabold">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step="any"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={suffix ? "pr-12" : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  empty,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  empty: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-extrabold">{label}</Label>
      {options.length === 0 ? (
        <p className="rounded-[10px] border-2 border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
          {empty}
        </p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-full rounded-[10px] border-2 border-border bg-[#FFF7EA] px-3 text-sm font-semibold"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
