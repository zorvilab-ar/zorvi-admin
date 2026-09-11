import { loadAll } from "@/lib/calc";
import { updateSettings, updateChannel } from "@/lib/actions";
import { fmtPct, fmtArs } from "@/lib/format";
import { PageHeader, SectionTitle } from "@/components/shared";
import { TextField, NumberField, DateField } from "@/components/fields";
import { FormSheet } from "@/components/form-sheet";
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

export default async function ParametrosPage() {
  const { settings: st, channels } = await loadAll();

  return (
    <div>
      <PageHeader
        title="Parámetros"
        description="Todo el costeo cuelga de esta página. Se configura una sola vez; después solo se actualiza el dólar o alguna tarifa."
      />

      <form action={updateSettings}>
        <Card>
          <CardContent className="space-y-8">
            <div>
              <SectionTitle>1 · Generales</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField name="businessName" label="Nombre" defaultValue={st.businessName} required />
                <DateField name="startDate" label="Inicio de actividad" defaultValue={st.startDate} hint="Define el primer mes del Resumen." required />
                <NumberField name="fxRate" label="Dólar (ARS/USD)" defaultValue={st.fxRate} suffix="ARS" hint="El dólar con el que realmente comprás filamento." />
                <DateField name="fxDate" label="Última actualización del dólar" defaultValue={st.fxDate} />
              </div>
            </div>

            <div>
              <SectionTitle>2 · Impresión y capacidad</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField name="printerWatts" label="Potencia de la impresora" defaultValue={st.printerWatts} suffix="W" hint="Consumo medio real, no el pico." />
                <NumberField name="kwhPrice" label="Tarifa eléctrica" defaultValue={st.kwhPrice} suffix="$/kWh" hint="Precio final con impuestos." />
                <NumberField name="hoursAvailable" label="Horas disponibles por mes" defaultValue={st.hoursAvailable} suffix="h" hint="Capacidad máxima si corre casi continuo." />
                <NumberField name="hoursProductive" label="Horas productivas por mes" defaultValue={st.hoursProductive} suffix="h" hint="Las que esperás vender de verdad. Con esto se reparten los costos fijos." />
                <NumberField name="failureRate" label="Tasa de fallas" defaultValue={st.failureRate * 100} suffix="%" hint="Al principio suele ser 10–20%." />
                <NumberField name="defaultWaste" label="Merma de filamento" defaultValue={st.defaultWaste * 100} suffix="%" hint="Purga, soportes, brim." />
              </div>
            </div>

            <div>
              <SectionTitle>3 · Mano de obra</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField name="assemblyRate" label="Hora de armado" defaultValue={st.assemblyRate} suffix="$/h" hint="Aunque todavía no se pague, va al costo." />
                <NumberField name="designRate" label="Hora de diseño" defaultValue={st.designRate} suffix="$/h" hint="Para cotizar piezas a pedido." />
              </div>
            </div>

            <div>
              <SectionTitle>4 · Precios</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField name="targetMargin" label="Margen objetivo" defaultValue={st.targetMargin * 100} suffix="%" hint="Sobre el PRECIO. 45% ⇒ precio 1,82× el costo." />
                <NumberField name="wholesaleDiscount" label="Descuento mayorista" defaultValue={st.wholesaleDiscount * 100} suffix="%" />
              </div>
            </div>

            <div>
              <SectionTitle>5 · Impuestos y facturación</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField name="iibbRate" label="IIBB sobre ventas" defaultValue={st.iibbRate * 100} suffix="%" hint="Si todavía no tributás, dejalo en 0." />
                <NumberField name="otherTaxRate" label="Otros impuestos" defaultValue={st.otherTaxRate * 100} suffix="%" />
                <TextField name="billingPartner" label="Socio que factura" defaultValue={st.billingPartner} />
                <TextField name="monotributoCategory" label="Categoría de monotributo" defaultValue={st.monotributoCategory} />
                <NumberField name="monotributoCap" label="Tope anual de la categoría" defaultValue={st.monotributoCap} suffix="ARS" hint="De la web de ARCA. El Tablero avisa cuando te acercás." />
              </div>
            </div>

            <div>
              <SectionTitle>6 · Socios</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField name="reinvestPercent" label="Utilidades a reinvertir" defaultValue={st.reinvestPercent} suffix="%" hint="Arrancan con 100% para la segunda impresora." />
              </div>
            </div>

            <Button type="submit" size="lg">
              Guardar parámetros
            </Button>
          </CardContent>
        </Card>
      </form>

      <SectionTitle>Canales de venta</SectionTitle>
      <p className="mb-3 -mt-1 text-sm font-semibold text-muted-foreground">
        La comisión de cada canal se descuenta sola en cada venta y en los
        precios sugeridos.
      </p>
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-right">Costo fijo por venta</TableHead>
                <TableHead className="hidden lg:table-cell">Nota</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold">{c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtPct(c.commission)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(c.fixedCost)}</TableCell>
                  <TableCell className="hidden text-xs font-semibold text-muted-foreground lg:table-cell">
                    {c.notes}
                  </TableCell>
                  <TableCell className="text-right">
                    <FormSheet
                      mode="edit"
                      title={`Canal: ${c.name}`}
                      description="Comisión y costo fijo que se descuentan en cada venta de este canal."
                      action={updateChannel}
                      successMessage={`${c.name} actualizado`}
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <NumberField name="commission" label="Comisión sobre la venta" defaultValue={c.commission * 100} suffix="%" hint={c.notes ?? undefined} />
                      <NumberField name="fixedCost" label="Costo fijo por venta" defaultValue={c.fixedCost} suffix="ARS" hint="Ej.: envío gratis, costo del stand prorrateado." />
                    </FormSheet>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
