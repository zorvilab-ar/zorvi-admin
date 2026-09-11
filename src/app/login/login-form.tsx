"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  config:
    "Faltan las variables de Supabase en Vercel. Conectá la integración y volvé a deployar.",
  forbidden: "Ese usuario no está en la lista de admins (ADMIN_EMAILS).",
  auth: "No se pudo iniciar sesión. Probá de nuevo.",
};

export function LoginForm({
  configured,
  errorKey,
}: {
  configured: boolean;
  errorKey?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState(ERRORS[errorKey ?? ""] ?? "");
  const [magicSent, setMagicSent] = React.useState(false);

  async function submit(mode: "password" | "magic", fd: FormData) {
    setPending(true);
    setMessage("");
    try {
      if (!configured) {
        setMessage(ERRORS.config);
        return;
      }
      const email = String(fd.get("email") ?? "").trim();
      const password = String(fd.get("password") ?? "");
      const supabase = createBrowserSupabase();

      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        setMagicSent(true);
        return;
      }

      if (mode === "password") {
        if (!password) {
          setMessage("Ingresá la contraseña o usá el enlace mágico.");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace("/");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-1">
        {!configured && (
          <p className="rounded-xl border-2 border-border bg-muted px-3 py-2 text-sm font-semibold">
            {ERRORS.config}
          </p>
        )}
        {message && configured && (
          <p className="rounded-xl border-2 border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            {message}
          </p>
        )}
        {magicSent ? (
          <p className="text-sm font-semibold text-muted-foreground">
            Te mandamos un enlace. Abrilo desde el mismo navegador.
          </p>
        ) : (
          <form
            className="space-y-4"
            action={(fd) => {
              void submit("password", fd);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-10"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending || !configured}>
              {pending ? "Entrando…" : "Entrar"}
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={pending || !configured}
              formAction={(fd) => {
                void submit("magic", fd);
              }}
            >
              Enviame un enlace mágico
            </Button>
          </form>
        )}
        <p className="text-center text-[12px] font-semibold text-muted-foreground">
          Los usuarios se dan de alta en Supabase Auth. Desactivá el registro
          público.
        </p>
      </CardContent>
    </Card>
  );
}
