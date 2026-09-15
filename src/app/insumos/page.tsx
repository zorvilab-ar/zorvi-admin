import { loadInsumos } from "@/lib/views/client";
import { createSupply, updateSupply, deleteSupply } from "@/lib/actions";
import { fmtArs, fmtArsDec, fmtNum, fmtDate } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { TextField, NumberField, SelectField } from "@/components/fields";
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

const CATEGORIES = ["Filamento", "Componente", "Packaging", "Otro"].map((c) => ({
  value: c,
  label: c,
}));

const CAT_STYLE: Record<string, string> = {
  Filamento: "bg-[#F2B550]",
  Componente: "bg-[#5B7FB5] text-white",
  Packaging: "bg-[#7AA37A] text-white",
  Otro: "bg-muted",
};

type Supply = {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  packQty: number;
  supplier: string | null;
  initialStock: number;
  reorderPoint: number;
  notes: string | null;
};

function SupplyFields({ s }: { s?: Supply }) {
  return (
    <>
      {s && <input type="hidden" name="id" value={s.id} />}
      <TextField name="code" label="Código" defaultValue={s?.code} required placeholder="FIL-004" hint="FIL- para filamentos, COMP- para componentes, PACK- para packaging." />
      <TextField name="name" label="Nombre" defaultValue={s?.name} required placeholder="Filamento Rojo" />
      <SelectField name="category" label="Categoría" defaultValue={s?.category ?? "Filamento"} options={CATEGORIES} hint="Separa el costo en la ficha del producto." />
      <TextField name="unit" label="Unidad de consumo" defaultValue={s?.unit ?? "g"} hint="g para filamento, u para componentes y packaging." />
      <NumberField name="purchasePrice" label="Precio de compra del pack" defaultValue={s?.purchasePrice} suffix="ARS" required />
      <NumberField name="packQty" label="Cantidad que trae el pack" defaultValue={s?.packQty} required hint="En la unidad de consumo: un rollo de 1 kg = 1000 g; una bolsa de 10 = 10 u." />
      <TextField name="supplier" label="Proveedor" defaultValue={s?.supplier} />
      <NumberField name="initialStock" label="Stock inicial" defaultValue={s?.initialStock ?? 0} hint="Lo que ya tenés en el cajón hoy." />
      <NumberField name="reorderPoint" label="Punto de reposición" defaultValue={s?.reorderPoint ?? 0} hint="Cuando el stock baja de acá, la página Stock avisa que hay que comprar." />
      <TextField name="notes" label="Notas / link de compra" defaultValue={s?.notes} span2 />
    </>
  );
}

export default async function InsumosPage() {
  const { insumos } = await loadInsumos();

  const addSheet = (
    <FormSheet
      title="Agregar insumo"
      description="El costo unitario se calcula solo: precio del pack ÷ cantidad que trae."
      action={createSupply}
      triggerLabel="Nuevo insumo"
      successMessage="Insumo agregado"
      wide
    >
      <SupplyFields />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Insumos"
        description="Catálogo de materiales: filamentos, componentes eléctricos y packaging. El costo unitario alimenta todas las recetas."
        actions={addSheet}
      />

      {insumos.length === 0 ? (
        <EmptyState
          title="Todavía no hay insumos"
          helper="Cargá los filamentos, portalámparas y cajas con su precio de compra. Con eso se arma el costo de cada lámpara."
          action={addSheet}
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
                  <TableHead className="text-right">Precio del pack</TableHead>
                  <TableHead className="text-right">Trae</TableHead>
                  <TableHead className="text-right">Costo unitario</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.code}</TableCell>
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${CAT_STYLE[s.category] ?? ""}`}>{s.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(s.purchasePrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtNum(s.packQty)} {s.unit}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {fmtArsDec(s.unitCost)}/{s.unit}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{s.supplier}</TableCell>
                    <TableCell className="text-xs">{fmtDate(s.updatedAt)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <FormSheet mode="edit" title={`Editar ${s.code}`} action={updateSupply} successMessage="Insumo actualizado" wide>
                        <SupplyFields s={s} />
                      </FormSheet>
                      <ConfirmDelete action={deleteSupply} id={s.id} what={`el insumo ${s.code} (${s.name})`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
