import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Settings,
  Printer,
  Landmark,
  Package,
  Lamp,
  Tags,
  Factory,
  ShoppingCart,
  Receipt,
  Users,
  Boxes,
  BarChart3,
  Calculator,
  FileText,
} from "lucide-react";

export const NAV_GROUPS: {
  label: string;
  items: {
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }[];
}[] = [
  {
    label: "General",
    items: [{ href: "/", label: "Tablero", icon: LayoutDashboard }],
  },
  {
    label: "Uso diario",
    items: [
      { href: "/ventas", label: "Ventas", icon: ShoppingCart },
      { href: "/calculadora", label: "Calculadora 3D", icon: Calculator },
      { href: "/presupuestos", label: "Presupuestos", icon: FileText },
      { href: "/produccion", label: "Producción", icon: Factory },
      { href: "/compras", label: "Compras y gastos", icon: Receipt },
      { href: "/socios", label: "Socios", icon: Users },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/productos", label: "Productos", icon: Lamp },
      { href: "/insumos", label: "Insumos", icon: Package },
      { href: "/precios", label: "Precios por canal", icon: Tags },
    ],
  },
  {
    label: "Control",
    items: [
      { href: "/stock", label: "Stock", icon: Boxes },
      { href: "/resumen", label: "Estadísticas", icon: BarChart3 },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/parametros", label: "Parámetros", icon: Settings },
      { href: "/activos", label: "Activos", icon: Printer },
      { href: "/costos-fijos", label: "Costos fijos", icon: Landmark },
    ],
  },
];

export const HELP_STEPS: { title: string; body: string }[] = [
  {
    title: "1 · Configurar (una sola vez)",
    body: "Parámetros → Activos → Costos fijos → Insumos → Productos (con su receta). En ese orden. Después no se toca más, salvo que cambie un precio o el dólar.",
  },
  {
    title: "2 · Uso diario",
    body: "Producción (cada tanda que sale de la impresora), Ventas (cada venta, el mismo día), Calculadora 3D (cotizar a medida), Presupuestos (piezas para un cliente), Compras (cada peso que sale) y Socios (aportes y retiros).",
  },
  {
    title: "3 · El resto se calcula solo",
    body: "Stock (incluye rollos de filamento), Precios, Estadísticas y el Tablero se arman automáticamente con lo que cargaste. No hay nada que completar ahí, salvo los rollos físicos.",
  },
  {
    title: "¿Qué número mirar?",
    body: "La contribución marginal por hora de impresión (en el Tablero). Con ese número se decide qué modelo imprimir, qué canal conviene y cuándo comprar la segunda impresora.",
  },
];
