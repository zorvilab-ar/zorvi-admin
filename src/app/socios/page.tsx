import { loadAll, partnerAccounts } from "@/lib/calc";
import { createPartnerMovement, deletePartnerMovement } from "@/lib/actions";
import { fmtArs, fmtPct, fmtDate } from "@/lib/format";
import { PageHeader, SectionTitle, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
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

export default async function SociosPage() {
  const data = await loadAll();
  const accounts = partnerAccounts(data);
  const partnersById = new Map(data.partners.map((p) => [p.id, p]));
  const movements = [...data.partnerMovements].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);

  const totalIn = accounts.reduce((a, x) => a + x.contributions, 0);
  const totalOut = accounts.reduce((a, x) => a + x.withdrawals, 0);

  const addSheet = (
    <FormSheet
      title="Registrar movimiento de socio"
      description="Aportes y retiros. Los aportes en especie (una herramienta que alguien ya tenía) también van acá, valuados en pesos."
      action={createPartnerMovement}
      triggerLabel="Nuevo movimiento"
      successMessage="Movimiento registrado"
    >
      <DateField name="date" label="Fecha" defaultValue={today} required />
      <SelectField
        name="partnerId"
        label="Socio"
        options={data.partners.map((p) => ({ value: p.id, label: p.name }))}
        placeholder="¿Quién?"
        required
      />
      <SelectField
        name="type"
        label="Tipo"
        options={[
          { value: "Aporte", label: "Aporte (pone plata)" },
          { value: "Retiro", label: "Retiro (saca plata)" },
        ]}
        required
      />
      <NumberField name="amountArs" label="Monto" suffix="ARS" required />
      <TextField name="paymentMethod" label="Medio de pago" placeholder="Transferencia, efectivo…" />
      <TextField name="notes" label="Notas" placeholder="Aporte en especie, adelanto…" />
    </FormSheet>
  );

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Socios"
        description="Los cuatro ponen lo mismo. Esta página dice quién está adelantado y a quién le falta poner para emparejar."
        actions={addSheet}
      />

      <SectionTitle>Resumen por socio</SectionTitle>
      <Card className="mb-8">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Socio</TableHead>
                <TableHead className="text-right">Aportes</TableHead>
                <TableHead className="text-right">Retiros</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">% del capital</TableHead>
                <TableHead className="text-right">Situación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.partner.id}>
                  <TableCell className="font-bold">{a.partner.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(a.contributions)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtArs(a.withdrawals)}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{fmtArs(a.balance)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtPct(a.capitalPct)}</TableCell>
                  <TableCell className="text-right">
                    {Math.abs(a.diffVsEqual) < 1 ? (
                      <Badge className="bg-[#7AA37A] text-[11px] text-white">Parejo ✔</Badge>
                    ) : a.diffVsEqual > 0 ? (
                      <span className="font-bold tabular-nums text-[#7AA37A]">Puso {fmtArs(a.diffVsEqual)} de más</span>
                    ) : (
                      <span className="font-bold tabular-nums text-destructive">Le falta {fmtArs(-a.diffVsEqual)}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/60">
                <TableCell className="font-display">TOTAL</TableCell>
                <TableCell className="text-right font-display tabular-nums">{fmtArs(totalIn)}</TableCell>
                <TableCell className="text-right font-display tabular-nums">{fmtArs(totalOut)}</TableCell>
                <TableCell className="text-right font-display tabular-nums">{fmtArs(totalIn - totalOut)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SectionTitle>Movimientos</SectionTitle>
      {movements.length === 0 ? (
        <EmptyState
          title="Todavía no hay movimientos"
          helper="Registrá cada aporte y cada retiro. La tabla de arriba avisa sola si alguien queda desparejo."
          action={addSheet}
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Socio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Medio</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{fmtDate(m.date)}</TableCell>
                    <TableCell className="font-bold">{partnersById.get(m.partnerId)?.name}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${m.type === "Aporte" ? "bg-[#7AA37A] text-white" : "bg-primary text-primary-foreground"}`}>
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtArs(m.amountArs)}</TableCell>
                    <TableCell className="text-xs font-semibold">{m.paymentMethod ?? "—"}</TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">{m.notes ?? ""}</TableCell>
                    <TableCell className="text-right">
                      <ConfirmDelete
                        action={deletePartnerMovement}
                        id={m.id}
                        what={`el ${m.type.toLowerCase()} de ${partnersById.get(m.partnerId)?.name} (${fmtArs(m.amountArs)})`}
                      />
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
