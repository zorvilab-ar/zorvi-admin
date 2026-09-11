"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function UserMenu() {
  const [email, setEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createBrowserSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  if (!email) return null;

  return (
    <form action={signOut} className="mb-2">
      <div className="mb-2 truncate px-2 text-[11px] font-bold text-muted-foreground">
        {email}
      </div>
      <Button type="submit" variant="outline" className="w-full" size="sm">
        <LogOut />
        Salir
      </Button>
    </form>
  );
}
