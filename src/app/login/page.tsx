import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-3 border-border bg-primary font-display text-3xl text-primary-foreground shadow-[4px_4px_0_var(--border)]">
            Z
          </div>
          <h1 className="mt-4 font-display text-3xl tracking-wide">
            Zorvi Admin
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Acceso para el equipo. No es público.
          </p>
        </div>
        <LoginForm configured={isSupabaseConfigured()} errorKey={error} />
      </div>
    </div>
  );
}
