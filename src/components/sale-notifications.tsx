"use client";

import * as React from "react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createBrowserSupabase } from "@/lib/supabase/client";

type SaleRow = {
  customer?: string | null;
  qty?: number | null;
  receipt?: string | null;
};

export function SaleNotifications() {
  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("web-sales")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        (payload) => {
          const row = payload.new as SaleRow;
          const who = row.customer?.trim() || "Alguien";
          const qty = row.qty ? ` · ${row.qty} u.` : "";
          toast.success("Nueva compra web", {
            description: `${who}${qty}${row.receipt ? ` · ${row.receipt}` : ""}`,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
