"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// =============================================================================
// Server Action — Sign Out
// =============================================================================

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
