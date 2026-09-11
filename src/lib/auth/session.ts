import { redirect } from "next/navigation";
import { isAllowedAdmin } from "./admins";
import {
  isAuthRequired,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getAdminUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedAdmin(user.email)) return null;
  return user;
}

export async function assertAdmin() {
  if (!isAuthRequired()) return;
  if (!isSupabaseConfigured()) {
    throw new Error("Faltan las variables de Supabase.");
  }
  const user = await getAdminUser();
  if (!user) {
    throw new Error("No autenticado.");
  }
}

export async function requireAdmin() {
  if (!isAuthRequired()) return null;
  const user = await getAdminUser();
  if (!user) redirect("/login");
  return user;
}
