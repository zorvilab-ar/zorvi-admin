import { loadAll, productStocks } from "@/lib/calc";
import { getListings, shopConfigurada, ShopError, type ListingTienda } from "@/lib/shop/client";
import { publishListing } from "@/lib/shop/actions";
import { fmtArs, fmtNum } from "@/lib/format";
import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { FormSheet } from "@/components/form-sheet";
import { TextField, NumberField, SelectField, CheckboxField } from "@/components/fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

/** Slug tentativo a partir del nombre, para no tipearlo a mano. */
function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function TiendaPage() {
  const data = await loadAll();
  const stocks = new Map(productStocks(data).map((s) => [s.product.code, s.current]));

  let listings: ListingTienda[] = [];
  let error: string | null = null;
  if (!shopConfigurada()) {
    error =
      "Falta configurar la tienda: SHOP_API_URL y SHOP_INTERNAL_KEY en las variables de entorno.";
  } else {
    try {
      listings = await getListings();
    } catch (e) {
      error = e instanceof ShopError ? e.message : "No se pudo leer la tienda.";
    }
  }
  const porCodigo = new Map(listings.map((l) => [l.code, l]));
  const publicados = listings.filter((l) => l.published).length;
  const reservadas = listings.reduce((a, l) => a + l.reserved, 0);

  const fields = (p: (typeof data.products)[number], l?: ListingTienda) => (
    <>
      <input type="hidden" name="code" value={p.code} />
      <TextField
        name="name"
        label="Nombre en la tienda"
        defaultValue={l?.name ?? p.name}
        required
        hint="Puede ser distinto del nombre interno."
      />
      <TextField
        name="slug"
        label="Slug (la URL)"
        defaultValue={l?.slug ?? slugify(p.name)}
        required
        hint="Así queda: zorvilab.com/lamparas/velador-negro"
      />
      <SelectField
        name="category"
        label="Categoría"
        defaultValue={l?.category ?? "lamparas"}
        options={[
          { value: "lamparas", label: "Lámparas" },
          { value: "deco-hogar", label: "Deco hogar" },
          { value: "cocina", label: "Cocina" },
          { value: "llaveros", label: "Llaveros" },
        ]}
        required
      />
      <SelectField
        name="availability"
        label="Disponibilidad"
        defaultValue={l?.availability ?? "on-demand"}
        options={[
          { value: "stock", label: "Con stock — se reservan unidades al comprar" },
          { value: "on-demand", label: "A pedido — se imprime cuando entra la orden" },
        ]}
        required
        hint="Con stock, la tienda deja de venderla cuando se agota."
      />
      <TextField
        name="subtitle"
        label="Subtítulo"
        defaultValue={l?.subtitle}
        placeholder="Luz cálida · 3 colores"
      />
      <TextField name="image" label="Foto (ruta pública)" defaultValue={l?.image} placeholder="/images/lampara-panal.png" />
      <TextField name="description" label="Descripción" defaultValue={l?.description} span2 />
      <TextField name="care" label="Cuidados" defaultValue={l?.care} span2 />
      <TextField
        name="sizesRaw"
        label="Talles"
        defaultValue={l?.sizes.map((s) => `${s.label} | ${s.extra}`).join("\n")}
        placeholder="Mediana · 22 cm | 0"
        span2
        hint="Uno por línea: etiqueta | recargo en ARS."
      />
      <TextField
        name="colorsRaw"
        label="Colores"
        defaultValue={l?.colors.map((c) => `${c.name} | ${c.hex}`).join("\n")}
        placeholder="Negro | #3B2A22"
        span2
        hint="Uno por línea: nombre | color en hexadecimal."
      />
      <TextField name="engravingLabel" label="Grabado (texto de la opción)" defaultValue={l?.engraving?.label} />
      <NumberField name="engravingExtra" label="Recargo del grabado" defaultValue={l?.engraving?.extra ?? 0} suffix="ARS" />
      <SelectField
        name="badge"
        label="Etiqueta"
        defaultValue={l?.badge ?? ""}
        options={[
          { value: "bestseller", label: "Más vendido" },
          { value: "new", label: "Nuevo" },
          { value: "on-demand", label: "A pedido" },
        ]}
        placeholder="Sin etiqueta"
      />
      <NumberField name="sortOrder" label="Orden en el catálogo" defaultValue={l?.sortOrder ?? 0} hint="Más chico, más arriba." />
      <CheckboxField
        name="published"
        label="Publicado en la tienda"
        defaultChecked={l?.published}
        span2
        hint={
          p.listPrice > 0
            ? `Se publica a ${fmtArs(p.listPrice)}, el precio de lista de Productos.`
            : "⚠ Este producto no tiene precio de lista. Cargalo en Productos antes de publicarlo."
        }
      />
    </>
  );

  return (
    <div>
      <PageHeader
        title="Tienda"
        description="La ficha que ve el comprador. El precio y el stock no se cargan acá: salen solos de Productos y de Stock, para que la tienda y el admin nunca digan cosas distintas."
      />

      {error && (
        <Alert className="mb-5 border-[#C8382D]">
          <AlertTitle>No se pudo conectar con la tienda</AlertTitle>
          <AlertDescription>
            {error} El resto del admin funciona igual.
          </AlertDescription>
        </Alert>
      )}

      {!error && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Publicados" value={fmtNum(publicados)} hint={`de ${data.products.length} productos`} />
          <Kpi label="Sin publicar" value={fmtNum(data.products.length - publicados)} />
          <Kpi
            label="Unidades reservadas"
            value={fmtNum(reservadas)}
            hint="Vendidas en la web, sin asentar todavía"
            tone={reservadas > 0 ? "negative" : "neutral"}
          />
          <Kpi label="En el catálogo web" value={fmtNum(listings.length)} />
        </div>
      )}

      {data.products.length === 0 ? (
        <EmptyState
          title="Todavía no hay productos"
          helper="Cargá productos en el catálogo interno antes de publicarlos en la tienda."
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio de lista</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>En la tienda</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Reservadas</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p) => {
                  const l = porCodigo.get(p.code);
                  const stock = stocks.get(p.code) ?? 0;
                  const desfasado =
                    l && (l.price !== p.listPrice || l.stockPublished !== Math.max(0, stock));
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-bold">{l?.name ?? p.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.listPrice > 0 ? fmtArs(p.listPrice) : <span className="text-destructive">sin precio</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNum(stock)}</TableCell>
                      <TableCell>
                        {!l ? (
                          <Badge className="bg-muted text-[11px]">Sin publicar</Badge>
                        ) : l.published ? (
                          <Badge className="bg-[#7AA37A] text-[11px] text-white">Publicado</Badge>
                        ) : (
                          <Badge className="bg-[#F2B550] text-[11px]">Borrador</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {l ? (l.availability === "stock" ? "Con stock" : "A pedido") : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l && l.reserved > 0 ? fmtNum(l.reserved) : "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {desfasado && (
                          <span
                            className="mr-1 text-[11px] font-extrabold text-[#E0883A]"
                            title="El precio o el stock de la tienda quedaron viejos. Volvé a publicar."
                          >
                            desactualizado
                          </span>
                        )}
                        <FormSheet
                          mode={l ? "edit" : "create"}
                          triggerLabel={l ? undefined : "Publicar"}
                          triggerVariant="secondary"
                          triggerSize="xs"
                          title={`${l ? "Editar" : "Publicar"} ${p.code} en la tienda`}
                          description="Todo esto lo ve el comprador. El precio sale de Productos y el stock de la página Stock."
                          action={publishListing}
                          successMessage="Ficha actualizada en la tienda"
                          submitLabel="Guardar en la tienda"
                          wide
                        >
                          {fields(p, l)}
                        </FormSheet>
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
