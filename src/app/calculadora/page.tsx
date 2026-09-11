import { loadAll, filamentPricePerKg, mercadoLibreChannel, assetAmortPerHour } from "@/lib/calc";
import { PageHeader } from "@/components/shared";
import { CalculatorForm } from "./calculator-form";

export const dynamic = "force-dynamic";

export default async function CalculadoraPage() {
  const data = await loadAll();
  const filaments = data.supplies
    .filter((s) => s.category === "Filamento")
    .map((s) => ({
      id: s.id,
      name: `${s.code} — ${s.name}`,
      pricePerKg: filamentPricePerKg(s),
    }));
  const assets = data.assets.map((a) => ({
    id: a.id,
    name: `${a.code} — ${a.name}`,
    amortPerHour: assetAmortPerHour(a),
    usefulLifeHours: a.usefulLifeHours,
    costArs: a.costArs,
  }));
  const ml = mercadoLibreChannel(data.channels);

  return (
    <div>
      <PageHeader
        title="Calculadora 3D"
        description="Cotizá una pieza a medida: gramos, horas y margen. Los números salen de Parámetros, Insumos y Activos; podés ajustarlos para este cálculo sin guardar nada."
      />
      <CalculatorForm
        filaments={filaments}
        assets={assets}
        printerWatts={data.settings.printerWatts}
        kwhPrice={data.settings.kwhPrice}
        failureRate={data.settings.failureRate}
        targetMargin={data.settings.targetMargin}
        marketCommission={ml?.commission ?? 0.13}
        marketFixed={ml?.fixedCost ?? 0}
      />
    </div>
  );
}
