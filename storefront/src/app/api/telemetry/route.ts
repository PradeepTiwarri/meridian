import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Meridian Storefront — Mock Telemetry API Route
// =============================================================================
// This endpoint simulates the future NestJS backend.
// It receives telemetry payloads and logs them to the server console.
//
// In production, this will be replaced by:
//   NestJS → Redis Pub/Sub → FastAPI ML Engine
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Pretty-print to the server console for development visibility
    console.log(
      "\n📡 [TELEMETRY]",
      payload.event_type?.toUpperCase(),
      "─────────────────────────────────"
    );
    console.log("   Session:", payload.session_id);
    console.log("   Time:   ", payload.timestamp);
    console.log("   Data:   ", JSON.stringify(payload.payload, null, 2));
    console.log("   ─────────────────────────────────────────────────\n");

    return NextResponse.json(
      { status: "received", event_type: payload.event_type },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
