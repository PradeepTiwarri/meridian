import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// =============================================================================
// Next.js Middleware — Supabase Auth Session Refresh + Admin Protection
// =============================================================================

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
