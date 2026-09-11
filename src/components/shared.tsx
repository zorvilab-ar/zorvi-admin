import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { PackageOpen } from "lucide-react";

export function LinkButton({
  href,
  children,
  variant = "outline",
  size = "default",
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  return (
    <a href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </a>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl tracking-wide sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-sm font-semibold text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 font-display text-xl tabular-nums sm:text-2xl",
            tone === "positive" && "text-[#7AA37A]",
            tone === "negative" && "text-destructive",
          )}
        >
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 font-display text-lg tracking-wide first:mt-0">
      {children}
    </h2>
  );
}

export function Num({
  value,
  tone,
}: {
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        tone === "positive" && "text-[#7AA37A]",
        tone === "negative" && "text-destructive",
      )}
    >
      {value}
    </span>
  );
}

/** Estado vacío amigable, con la acción para arrancar al lado. */
export function EmptyState({
  title,
  helper,
  action,
}: {
  title: string;
  helper: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-3 border-border bg-secondary shadow-[4px_4px_0_var(--border)]">
          <PackageOpen className="h-6 w-6" />
        </div>
        <div className="font-display text-xl">{title}</div>
        <p className="max-w-sm text-sm font-semibold text-muted-foreground">
          {helper}
        </p>
        {action && <div className="mt-1">{action}</div>}
      </CardContent>
    </Card>
  );
}
