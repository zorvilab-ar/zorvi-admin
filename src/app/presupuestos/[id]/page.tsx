import { notFound } from "next/navigation";
import {
  loadAll,
  quoteItemCost,
  mercadoLibreChannel,
  totalAmortPerHour,
  filamentPricePerKg,
} from "@/lib/calc";
import {
  updateQuote,
  createQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
} from "@/lib/actions";
import { fmtArs, fmtArsDec, fmtNum, fmtPct } from "@/lib/format";
import {
  PageHeader,
  SectionTitle,
  Kpi,
  EmptyState,
  LinkButton,
} from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { SlicerImport } from "@/components/slicer-import";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, DateField, SelectField } from "@/components/fields";
import { Badge } from "@/components/ui/badge";
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

const STATUS_OPTIONS = ["Borrador", "Enviado", "Aceptado", "Rechazado"].map(
  (s) => ({ value: s, label: s }),
);

const STATUS_STYLE: Record<string, string> = {
  Borrador: "bg-muted text-muted-foreground",
  Enviado: "bg-[#F2B550]",
  Aceptado: "bg-[#7AA37A] text-white",
  Rechazado: "bg-primary text-primary-foreground",
};

type QuoteItem = {
  id: number;
  quoteId: number;
  name: string;
  description: string | null;
  qty: number;
  printHours: number;
  grams: number;
  assemblyMinutes: number;
  designHours: number;
  filamentSupplyId: number | null;
  extraSuppliesArs: number;
  note: string | null;
};

function ItemFields({
  item,
  quoteId,
  filamentOptions,
}: {
  item?: QuoteItem;
  quoteId: number;
  filamentOptions: { value: number; label: string }[];
}) {
  return (
    <>
      {item ? (
        <input type="hidden" name="id" value={item.id} />
      ) : (
        <input type="hidden" name="quoteId" value={quoteId} />
      )}
      <TextField
        name="name"
        label="Nombre de la pieza"
        defaultValue={item?.name}
        required
        placeholder="Soporte, lámpara a medida…"
      />
      <TextField
        name="description"
        label="Descripción"
        defaultValue={item?.description}
        placeholder="Color, material, acabado…"
      />
      <NumberField name="qty" label="Cantidad" defaultValue={item?.qty ?? 1} required />
      <SlicerImport />
      <NumberField
        name="printHours"
        label="Horas de impresión"
        defaultValue={item?.printHours}
        suffix="h"
        required
      />
      <NumberField
        name="grams"
        label="Gramos"
        defaultValue={item?.grams}
        suffix="g"
        required
      />
      <SelectField
        name="filamentSupplyId"
        label="Filamento"
        defaultValue={item?.filamentSupplyId ?? ""}
        options={filamentOptions}
        placeholder="Elegir filamento…"
        hint="Define el precio del kilo."
      />
      <NumberField
        name="assemblyMinutes"
        label="Armado y post-proceso"
        defaultValue={item?.assemblyMinutes ?? 0}
        suffix="min"
        hint="Por unidad. Se cobra a la hora de armado de Parámetros."
      />
      <NumberField
        name="designHours"
        label="Diseño / modelado"
        defaultValue={item?.designHours ?? 0}
        suffix="h"
        hint="Una sola vez para el pedido, no por unidad."
      />
      <NumberField
        name="extraSuppliesArs"
        label="Insumos extra"
        defaultValue={item?.extraSuppliesArs ?? 0}
        suffix="ARS"
        hint="Por unidad. Portalámparas, cable, caja…"
      />
      <TextField name="note" label="Nota" defaultValue={item?.note} span2 />
    </>
  );
}

export default async function PresupuestoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const quote = data.quotes.find((q) => q.id === Number(id));
  if (!quote) notFound();

  const items = data.quoteItems.filter((i) => i.quoteId === quote.id);
  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const amort = totalAmortPerHour(data.assets);
  const ml = mercadoLibreChannel(data.channels);
  const comm = ml?.commission ?? 0.13;
  const fixed = ml?.fixedCost ?? 0;
  const filaments = data.supplies.filter((s) => s.category === "Filamento");
  const filamentOptions = filaments.map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name} (${fmtArs(filamentPricePerKg(s))}/kg)`,
  }));

  const lines = items.map((item) => ({
    item,
    cost: quoteItemCost(item, suppliesById, data.settings, amort, comm, fixed),
  }));
  const totalCharge = lines.reduce((a, l) => a + l.cost.charge, 0);
  const totalCost = lines.reduce((a, l) => a + l.cost.totalCost, 0);
  const totalMarket = lines.reduce((a, l) => a + l.cost.market, 0);

  const editSheet = (
    <FormSheet
      title="Editar presupuesto"
      action={updateQuote}
      triggerLabel="Editar"
      triggerVariant="secondary"
      mode="create"
      submitLabel="Guardar cambios"
      successMessage="Presupuesto actualizado"
    >
      <input type="hidden" name="id" value={quote.id} />
      <DateField name="date" label="Fecha" defaultValue={quote.date} required />
      <TextField
        name="clientName"
        label="Cliente"
        defaultValue={quote.clientName}
        required
      />
      <SelectField
        name="status"
        label="Estado"
        defaultValue={quote.status}
        options={STATUS_OPTIONS}
      />
      <TextField name="notes" label="Notas" defaultValue={quote.notes} span2 />
    </FormSheet>
  );

  const addItem = (
    <FormSheet
      title="Agregar pieza"
      description="Gramos y horas del slicer. El precio se calcula solo."
      action={createQuoteItem}
      triggerLabel="Agregar pieza"
      successMessage="Pieza agregada"
      wide
    >
      <ItemFields quoteId={quote.id} filamentOptions={filamentOptions} />
    </FormSheet>
  );

  return (
    <div>
      <div className="mb-2">
        <LinkButton href="/presupuestos" variant="ghost" size="sm" className="-ml-2">
          ← Volver a presupuestos
        </LinkButton>
      </div>
      <PageHeader
        title={quote.clientName}
        description={quote.notes ?? "Piezas a medida para este cliente."}
        actions={editSheet}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge className={STATUS_STYLE[quote.status] ?? ""}>{quote.status}</Badge>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Costo" value={fmtArs(totalCost)} />
        <Kpi label="Total a cobrar" value={fmtArs(totalCharge)} />
        <Kpi
          label="Precio Mercado Libre"
          value={fmtArs(totalMarket)}
          hint={
            comm > 0
              ? `Comisión ${fmtPct(comm)}`
              : "Estimado +22,5% (cargá la comisión del canal MercadoLibre)"
          }
        />
      </div>

      <SectionTitle>Piezas</SectionTitle>
      {items.length === 0 ? (
        <EmptyState
          title="Este presupuesto no tiene piezas"
          helper="Agregá cada pieza con gramos, horas y filamento. El total a cobrar se arma solo."
          action={addItem}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <div className="flex justify-end px-4 pb-2">{addItem}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pieza</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Gramos</TableHead>
                  <TableHead>Filamento</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">A cobrar</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map(({ item, cost }) => {
                  const supply = item.filamentSupplyId
                    ? suppliesById.get(item.filamentSupplyId)
                    : undefined;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-bold">{item.name}</div>
                        {item.description && (
                          <div className="text-xs font-semibold text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtNum(item.qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtNum(item.printHours)} h
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtNum(item.grams)} g
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {supply ? supply.name : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtArsDec(cost.totalCost)}
                      </TableCell>
                      <TableCell className="text-right font-display tabular-nums">
                        {fmtArs(cost.charge)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <FormSheet
                          mode="edit"
                          title={`Editar ${item.name}`}
                          action={updateQuoteItem}
                          successMessage="Pieza actualizada"
                          wide
                        >
                          <ItemFields
                            item={item}
                            quoteId={quote.id}
                            filamentOptions={filamentOptions}
                          />
                        </FormSheet>
                        <ConfirmDelete
                          action={deleteQuoteItem}
                          id={item.id}
                          what={`la pieza ${item.name}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/60">
                  <TableCell colSpan={6} className="font-display">
                    TOTAL A COBRAR
                  </TableCell>
                  <TableCell className="text-right font-display tabular-nums">
                    {fmtArs(totalCharge)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
