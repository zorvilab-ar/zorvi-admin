"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  CircleHelp,
} from "lucide-react";

const groups: {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
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
      { href: "/resumen", label: "Resumen mensual", icon: BarChart3 },
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

const helpSteps: { title: string; body: string }[] = [
  {
    title: "1 · Configurar (una sola vez)",
    body: "Parámetros → Activos → Costos fijos → Insumos → Productos (con su receta). En ese orden. Después no se toca más, salvo que cambie un precio o el dólar.",
  },
  {
    title: "2 · Uso diario: solo 4 páginas",
    body: "Producción (cada tanda que sale de la impresora), Ventas (cada venta, el mismo día), Compras (cada peso que sale) y Socios (aportes y retiros).",
  },
  {
    title: "3 · El resto se calcula solo",
    body: "Stock, Precios, Resumen mensual y el Tablero se arman automáticamente con lo que cargaste. No hay nada que completar ahí.",
  },
  {
    title: "¿Qué número mirar?",
    body: "La contribución marginal por hora de impresión (en el Tablero). Con ese número se decide qué modelo imprimir, qué canal conviene y cuándo comprar la segunda impresora.",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-3 border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b-3 border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-primary font-display text-lg text-primary-foreground shadow-[3px_3px_0_var(--border)]">
          Z
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg tracking-wide">Zorvi Admin</div>
          <div className="text-[11px] font-bold text-muted-foreground">
            Lámparas 3D
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors",
                      active
                        ? "border-2 border-border bg-secondary text-foreground shadow-[2px_2px_0_var(--border)]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t-3 border-border p-3">
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="secondary" className="w-full">
                <CircleHelp />
                ¿Cómo se usa?
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Cómo se usa el admin
              </DialogTitle>
              <DialogDescription>
                Tres pasos, sin vueltas. Cualquier duda puntual está explicada
                arriba de cada página.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {helpSteps.map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl border-2 border-border bg-background p-3"
                >
                  <div className="font-display text-sm">{s.title}</div>
                  <p className="mt-1 text-[13px] font-semibold leading-snug text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        <div className="mt-2 px-2 text-center text-[10px] font-bold text-muted-foreground">
          Zorvi Lab · Agustín, Nico, Juanchi y Mariano
        </div>
      </div>
    </aside>
  );
}
