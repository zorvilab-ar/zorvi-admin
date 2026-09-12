import { loadAll, allProductCosts } from "@/lib/calc";
import { createProduct, deleteProduct } from "@/lib/actions";
import { fmtArs, fmtNum, fmtPct } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, SelectField } from "@/components/fields";
import { SlicerImport } from "@/components/slicer-import";
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

const STATUS_STYLE: Record<string, string> = {
  Activo: "bg-[#7AA37A] text-white",
  "En desarrollo": "bg-[#F2B550]",
  Discontinuado: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS = ["En desarrollo", "Activo", "Discontinuado"].map((s) => ({
  value: s,
  label: s,
}));

export default async function ProductosPage() {
  const data = await loadAll();
  const costs = allProductCosts(data);

  const addSheet = (
    <FormSheet
      title="Nuevo producto"
      description="Cargá los datos del slicer. Después entrá a la ficha para armar la receta (materiales que lleva)."
      action={createProduct}
      triggerLabel="Nuevo producto"
      successMessage="Producto creado. Ahora armale la receta desde su ficha."
      wide
    >
      <TextField name="code" label="Código" required placeholder="LAMP-003" hint="LAMP-001, LAMP-002… Corto y único." />
      <TextField name="name" label="Nombre" required placeholder="Lámpara Hongo" />
      <TextField name="model" label="Archivo / modelo 3D" placeholder="hongo_v2.3mf" />
      <SelectField name="status" label="Estado" defaultValue="En desarrollo" options={STATUS_OPTIONS} />
      <SlicerImport />
      <NumberField name="printHours" label="Horas de impresión" suffix="h" hint="Del slicer. Con esto se calculan luz, desgaste de máquina y costos fijos." />
      <NumberField name="grams" label="Gramos de filamento" suffix="g" hint="Del slicer, informativo." />
      <NumberField name="assemblyMinutes" label="Minutos de armado" suffix="min" hint="Cablear, embalar, etiquetar." />
      <NumberField name="listPrice" label="Precio de lista" suffix="ARS" hint="Podés dejarlo en 0 y decidirlo después con el precio sugerido." />
      <NumberField name="initialStock" label="Stock inicial" hint="Lámparas ya hechas antes de empezar a registrar producción." />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Productos"
        description="La ficha de costo de cada lámpara. Tocá un producto para ver el desglose completo, editar su receta y comparar precios por canal."
        actions={addSheet}
      />

      {data.products.length === 0 ? (
        <EmptyState
          title="Todavía no hay productos"
          helper="Creá tu primera lámpara con los datos del slicer y armale la receta. El costo y el precio sugerido salen solos."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Costo variable</TableHead>
                  <TableHead className="text-right">Costo total</TableHead>
                  <TableHead className="text-right">Precio sugerido</TableHead>
                  <TableHead className="text-right">Precio de lista</TableHead>
                  <TableHead className="text-right">Margen neto</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p) => {
                  const c = costs.get(p.id)!;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">
                        <a href={`/productos/${p.id}`} className="font-bold text-primary underline-offset-2 hover:underline">
                          {p.code}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`/productos/${p.id}`} className="font-bold hover:underline">
                          {p.name}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[11px] ${STATUS_STYLE[p.status] ?? ""}`}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(p.printHours)} h</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{fmtArs(c.variableCost)}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{fmtArs(c.totalCost)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{fmtArs(c.suggestedPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.listPrice > 0 ? fmtArs(p.listPrice) : "—"}</TableCell>
                      <TableCell
                        className={`text-right font-bold tabular-nums ${
                          p.listPrice > 0 ? (c.netMarginPct < 0 ? "text-destructive" : "text-[#7AA37A]") : ""
                        }`}
                      >
                        {p.listPrice > 0 ? fmtPct(c.netMarginPct) : "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <ConfirmDelete action={deleteProduct} id={p.id} what={`el producto ${p.code} (${p.name}) y su receta`} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="mt-4 max-w-4xl text-xs font-semibold text-muted-foreground">
        <strong>Costo variable</strong> = lo que cuesta hacer una lámpara más (materiales, luz, máquina, armado y fallas).
        Es el piso absoluto del precio. <strong>Costo total</strong> = costo variable + la parte de los costos fijos.
        El precio de lista tiene que estar arriba del costo total para que el negocio cierre.
      </p>
    </div>
  );
}
