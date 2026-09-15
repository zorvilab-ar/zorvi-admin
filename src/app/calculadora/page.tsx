import { loadCalculadora } from "@/lib/views/client";
import { PageHeader } from "@/components/shared";
import { CalculatorForm } from "./calculator-form";

export const dynamic = "force-dynamic";

export default async function CalculadoraPage() {
  // El backend ya filtra impresoras y calcula precio del kilo y desgaste.
  const { filamentos: filaments, impresoras: assets, settings, marketCommission, marketFixed } =
    await loadCalculadora();

  return (
    <div>
      <PageHeader
        title="Calculadora 3D"
        description="Cotizá una pieza a medida: gramos, horas y margen. Los números salen de Parámetros, Insumos y Activos; podés ajustarlos para este cálculo sin guardar nada."
      />
      <CalculatorForm
        filaments={filaments}
        assets={assets}
        printerWatts={settings.printerWatts}
        kwhPrice={settings.kwhPrice}
        failureRate={settings.failureRate}
        targetMargin={settings.targetMargin}
        assemblyRate={settings.assemblyRate}
        designRate={settings.designRate}
        marketCommission={marketCommission}
        marketFixed={marketFixed}
      />
    </div>
  );
}
