import { notFound } from "next/navigation";
import { loadAll, allProductCosts, channelPrices, unitCost } from "@/lib/calc";
import {
  updateProduct,
  createRecipeItem,
  updateRecipeItem,
  deleteRecipeItem,
} from "@/lib/actions";
import { fmtArs, fmtArsDec, fmtNum, fmtPct } from "@/lib/format";
import { PageHeader, SectionTitle, Kpi, EmptyState, LinkButton } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, SelectField } from "@/components/fields";
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

const STATUS_OPTIONS = ["En desarrollo", "Activo", "Discontinuado"].map((s) => ({
  value: s,
  label: s,
}));

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const product = data.products.find((p) => p.id === Number(id));
  if (!product) notFound();

  const costs = allProductCosts(data);
  const c = costs.get(product.id)!;
  const recipe = data.recipeItems.filter((r) => r.productId === product.id);
  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const prices = channelPrices(c, product.listPrice, data.channels, data.settings);

  const supplyOptions = data.supplies.map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name} (${fmtArsDec(unitCost(s))}/${s.unit})`,
  }));

  const costRows: { label: string; value: number; strong?: boolean }[] = [
    { label: "Filamento", value: c.filament },
    { label: "Componentes", value: c.components },
    { label: "Packaging", value: c.packaging },
    { label: "Otros materiales", value: c.otherMaterials },
    { label: "Energía eléctrica", value: c.energy },
    { label: "Desgaste de máquina", value: c.amortization },
    { label: "Mano de obra (armado)", value: c.labor },
    { label: "Subtotal", value: c.subtotal, strong: true },
    { label: `Ajuste por fallas (${fmtPct(data.settings.failureRate)})`, value: c.failureAdj },
    { label: "COSTO VARIABLE", value: c.variableCost, strong: true },
    { label: "Costos fijos asignados", value: c.fixedAllocated },
    { label: "COSTO TOTAL", value: c.totalCost, strong: true },
  ];

  const editSheet = (
    <FormSheet
      title={`Editar ${product.code}`}
      description="Los datos del slicer y el precio de lista. La receta se edita abajo."
      action={updateProduct}
      triggerLabel="Editar producto"
      triggerVariant="secondary"
      mode="create"
      submitLabel="Guardar cambios"
      successMessage="Producto actualizado"
      wide
    >
      <input type="hidden" name="id" value={product.id} />
      <TextField name="code" label="Código" defaultValue={product.code} required />
      <TextField name="name" label="Nombre" defaultValue={product.name} required />
      <TextField name="model" label="Archivo / modelo 3D" defaultValue={product.model} />
      <SelectField name="status" label="Estado" defaultValue={product.status} options={STATUS_OPTIONS} />
      <NumberField name="printHours" label="Horas de impresión" defaultValue={product.printHours} suffix="h" hint="Del slicer. Mueve luz, máquina y costos fijos." />
      <NumberField name="grams" label="Gramos de filamento" defaultValue={product.grams} suffix="g" />
      <NumberField name="assemblyMinutes" label="Minutos de armado" defaultValue={product.assemblyMinutes} suffix="min" />
      <NumberField name="listPrice" label="Precio de lista" defaultValue={product.listPrice} suffix="ARS" hint={`Sugerido para tu margen objetivo: ${fmtArs(c.suggestedPrice)}`} />
      <NumberField name="initialStock" label="Stock inicial" defaultValue={product.initialStock} />
      <TextField name="notes" label="Notas" defaultValue={product.notes} />
    </FormSheet>
  );

  const addIngredient = (
    <FormSheet
      title="Agregar material a la receta"
      description="Una línea por cada insumo que lleva esta lámpara."
      action={createRecipeItem}
      triggerLabel="Agregar material"
      successMessage="Material agregado a la receta"
    >
      <input type="hidden" name="productId" value={product.id} />
      <SelectField name="supplyId" label="Insumo" options={supplyOptions} placeholder="Elegir insumo…" required hint="¿No está? Cargalo primero en la página Insumos." />
      <NumberField name="qty" label="Cantidad" required hint="En la unidad del insumo: gramos para filamento, unidades para el resto." />
      <NumberField name="wastePct" label="Merma" defaultValue={0} suffix="%" hint="Solo para filamento: purga del AMS, soportes, brim. Componentes y packaging van en 0." />
      <TextField name="note" label="Nota" placeholder="Base, estructura, caja…" />
    </FormSheet>
  );

  return (
    <div>
      <div className="mb-2">
        <LinkButton href="/productos" variant="ghost" size="sm" className="-ml-2">
          ← Volver a productos
        </LinkButton>
      </div>
      <PageHeader
        title={`${product.code} · ${product.name}`}
        description="Ficha de costo completa: desglose, receta y precios por canal. Todo se recalcula solo al guardar."
        actions={editSheet}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Costo variable" value={fmtArs(c.variableCost)} hint="El piso absoluto del precio" />
        <Kpi label="Costo total" value={fmtArs(c.totalCost)} hint="Con la parte de costos fijos" />
        <Kpi label="Precio sugerido" value={fmtArs(c.suggestedPrice)} hint={`Para un margen de ${fmtPct(data.settings.targetMargin)}`} />
        <Kpi
          label="Ganancia por unidad"
          value={product.listPrice > 0 ? fmtArs(c.unitResult) : "—"}
          tone={c.unitResult > 0 ? "positive" : product.listPrice > 0 ? "negative" : "neutral"}
          hint={product.listPrice > 0 ? `Margen neto ${fmtPct(c.netMarginPct)} a precio de lista` : "Cargá el precio de lista para verla"}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>¿De qué está hecho el costo?</SectionTitle>
          <Card>
            <CardContent className="px-0">
              <Table>
                <TableBody>
                  {costRows.map((r) => (
                    <TableRow key={r.label} className={r.strong ? "bg-muted/60" : ""}>
                      <TableCell className={r.strong ? "font-display" : "font-semibold"}>{r.label}</TableCell>
                      <TableCell className={`text-right tabular-nums ${r.strong ? "font-display" : ""}`}>
                        {fmtArsDec(r.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionTitle>Precios por canal</SectionTitle>
          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Precio sugerido</TableHead>
                    <TableHead className="text-right">Margen a precio de lista</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((p) => (
                    <TableRow key={p.channel.id}>
                      <TableCell className="font-bold">{p.channel.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArs(p.suggestedPrice)}</TableCell>
                      <TableCell
                        className={`text-right font-bold tabular-nums ${
                          product.listPrice > 0 ? (p.netMarginAtList < 0 ? "text-destructive" : "text-[#7AA37A]") : ""
                        }`}
                      >
                        {product.listPrice > 0 ? fmtPct(p.netMarginAtList) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Si el margen da rojo en un canal, ahí estás perdiendo plata con cada venta.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <SectionTitle>Receta — qué lleva cada lámpara</SectionTitle>
        {addIngredient}
      </div>

      {recipe.length === 0 ? (
        <EmptyState
          title="La receta está vacía"
          helper="Agregá los materiales que lleva esta lámpara: filamento en gramos, portalámpara, caja, etiqueta. Sin receta no hay costo."
          action={addIngredient}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo unitario</TableHead>
                  <TableHead className="text-right">Merma</TableHead>
                  <TableHead className="text-right">Costo de la línea</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.map((r) => {
                  const s = suppliesById.get(r.supplyId);
                  if (!s) return null;
                  const line = r.qty * unitCost(s) * (1 + r.wastePct);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="text-xs font-semibold">{s.category}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtNum(r.qty)} {s.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtArsDec(unitCost(s))}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r.wastePct)}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{fmtArsDec(line)}</TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{r.note}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <FormSheet mode="edit" title={`Editar línea: ${s.name}`} action={updateRecipeItem} successMessage="Receta actualizada">
                          <input type="hidden" name="id" value={r.id} />
                          <SelectField name="supplyId" label="Insumo" defaultValue={r.supplyId} options={supplyOptions} required />
                          <NumberField name="qty" label="Cantidad" defaultValue={r.qty} required />
                          <NumberField name="wastePct" label="Merma" defaultValue={r.wastePct * 100} suffix="%" />
                          <TextField name="note" label="Nota" defaultValue={r.note} />
                        </FormSheet>
                        <ConfirmDelete action={deleteRecipeItem} id={r.id} what={`la línea de ${s.name}`} />
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
