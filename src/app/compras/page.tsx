import { loadAll } from "@/lib/calc";
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
  markPurchasePaid,
} from "@/lib/actions";
import { fmtArs, fmtNum, fmtDate } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { ConfirmDelete } from "@/components/confirm-delete";
import { PurchaseFields } from "@/components/purchase-fields";
import { Badge } from "@/components/ui/badge";
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

const TYPE_STYLE: Record<string, string> = {
  Insumo: "bg-[#5B7FB5] text-white",
  "Costo fijo": "bg-[#F2B550]",
  Activo: "bg-[#E0883A] text-white",
  Otro: "bg-muted",
};

export default async function ComprasPage() {
  const data = await loadAll();
  const suppliesById = new Map(data.supplies.map((s) => [s.id, s]));
  const purchases = [...data.purchases].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);

  const total = purchases.reduce((a, p) => a + p.amountArs, 0);
  const pendingTotal = purchases.filter((p) => p.status === "Pendiente").reduce((a, p) => a + p.amountArs, 0);

  const supplyOptions = data.supplies.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    unit: s.unit,
    purchasePrice: s.purchasePrice,
    packQty: s.packQty,
  }));
  const partnerNames = data.partners.map((p) => p.name);
  // Compras que ya generaron el aporte del socio: el checkbox arranca tildado.
  const withContribution = new Set(
    data.partnerMovements.map((m) => m.purchaseId).filter(Boolean) as number[],
  );

  const addSheet = (
    <FormSheet
      title="Registrar compra o gasto"
      description="Cada peso que sale. El tipo define adónde va: Insumo suma stock, Costo fijo baja el resultado del mes, Activo se amortiza."
      action={createPurchase}
      triggerLabel="Nueva compra"
      successMessage="Compra registrada"
      wide
    >
      <PurchaseFields
        supplies={supplyOptions}
        partners={partnerNames}
        today={today}
      />
    </FormSheet>
  );

  return (
    <div>
      <PageHeader
        title="Compras y gastos"
        description="El libro de egresos: cada peso que sale del negocio, sea filamento, monotributo o una impresora nueva."
        actions={addSheet}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Total gastado" value={fmtArs(total)} />
        <Kpi label="Pagos pendientes" value={fmtArs(pendingTotal)} tone={pendingTotal > 0 ? "negative" : "neutral"} />
        <Kpi
          label="En insumos"
          value={fmtArs(purchases.filter((p) => p.type === "Insumo").reduce((a, p) => a + p.amountArs, 0))}
          hint="Compras que suman al stock"
        />
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          title="Todavía no hay compras"
          helper="Registrá cada gasto: filamento, cuota de monotributo, publicidad. Así el resultado del mes es real."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Pagó</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{fmtDate(p.date)}</TableCell>
                    <TableCell className="text-xs font-semibold">{p.supplier ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${TYPE_STYLE[p.type]}`}>{p.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{p.detail ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.supplyId ? suppliesById.get(p.supplyId)?.code : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.qty > 0 ? fmtNum(p.qty) : "—"}</TableCell>
                    <TableCell className="text-right font-bold tabular-nums">{fmtArs(p.amountArs)}</TableCell>
                    <TableCell className="text-xs font-semibold">{p.paidBy ?? "—"}</TableCell>
                    <TableCell>
                      {p.status === "Pagada" ? (
                        <Badge className="bg-[#7AA37A] text-[11px] text-white">
                          Pagada {p.paymentDate ? fmtDate(p.paymentDate) : ""}
                        </Badge>
                      ) : (
                        <form action={markPurchasePaid} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <Button type="submit" variant="secondary" size="xs">
                            Marcar pagada
                          </Button>
                        </form>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <FormSheet
                        mode="edit"
                        title={`Editar la compra del ${fmtDate(p.date)}`}
                        description="Los dos asientos de abajo se vuelven a aplicar con los valores nuevos."
                        action={updatePurchase}
                        successMessage="Compra actualizada"
                        wide
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <PurchaseFields
                          supplies={supplyOptions}
                          partners={partnerNames}
                          today={today}
                          purchase={p}
                          linkedContribution={withContribution.has(p.id)}
                        />
                      </FormSheet>
                      <ConfirmDelete action={deletePurchase} id={p.id} what={`la compra del ${fmtDate(p.date)} (${fmtArs(p.amountArs)})`} />
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
