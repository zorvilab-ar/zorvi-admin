import { PageHeader, Kpi, EmptyState } from "@/components/shared";
import { PedidosWeb } from "@/components/pedidos-web";
import { importarPedidos } from "@/lib/shop/actions";
import {
  getPedidosPendientes,
  shopConfigurada,
  ShopError,
  type PedidoWeb,
} from "@/lib/shop/client";
import { fmtArs, fmtNum } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

/**
 * Los pedidos que la tienda ya cobró y todavía no son ventas del admin.
 *
 * El paso es manual a propósito: el socio mira qué llegó antes de que entre a
 * la contabilidad. Mientras tanto la unidad ya figura reservada en la tienda,
 * así que nadie la puede comprar dos veces mientras espera acá.
 */
export default async function PedidosWebPage() {
  let pedidos: PedidoWeb[] = [];
  let error: string | null = null;

  if (!shopConfigurada()) {
    error =
      "Falta configurar la tienda: SHOP_API_URL y SHOP_INTERNAL_KEY en las variables de entorno.";
  } else {
    try {
      pedidos = await getPedidosPendientes();
    } catch (e) {
      error = e instanceof ShopError ? e.message : "No se pudieron leer los pedidos.";
    }
  }

  const unidades = pedidos.reduce((a, p) => a + p.items.reduce((b, i) => b + i.qty, 0), 0);
  const enProductos = pedidos.reduce((a, p) => a + p.subtotal, 0);
  const enEnvios = pedidos.reduce((a, p) => a + p.shippingCost, 0);

  return (
    <div>
      <PageHeader
        title="Pedidos web"
        description="Lo que se vendió en la tienda y todavía no está asentado. Al asentarlos se crean las ventas, se liberan las reservas y la tienda republica su stock: todo junto, en una sola operación."
      />

      {error && (
        <Alert className="mb-5 border-[#C8382D]">
          <AlertTitle>No se pudo conectar con la tienda</AlertTitle>
          <AlertDescription>{error} El resto del admin funciona igual.</AlertDescription>
        </Alert>
      )}

      {!error && pedidos.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Pedidos esperando" value={fmtNum(pedidos.length)} tone="negative" />
          <Kpi label="Unidades" value={fmtNum(unidades)} hint="Ya reservadas en la tienda" />
          <Kpi label="A asentar como venta" value={fmtArs(enProductos)} hint="Sin el envío" />
          <Kpi
            label="Envíos cobrados"
            value={fmtArs(enEnvios)}
            hint="Lo pagó el cliente. El costo real de la etiqueta se carga en Compras."
          />
        </div>
      )}

      {error ? null : pedidos.length === 0 ? (
        <EmptyState
          title="No hay pedidos esperando"
          helper="Cuando alguien compre en la tienda y se confirme el pago, el pedido aparece acá para asentarlo como venta."
        />
      ) : (
        <PedidosWeb pedidos={pedidos} importar={importarPedidos} />
      )}
    </div>
  );
}
