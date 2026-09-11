"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SaleNotifications } from "@/components/sale-notifications";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authScreen =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (authScreen) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <MobileNav />
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-10">
        <SaleNotifications />
        <div className="w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
