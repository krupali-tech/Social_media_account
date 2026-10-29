import { NextResponse } from "next/server";

/**
 * Fail-closed publishing gate.
 * This endpoint intentionally does NOT call Meta yet. Do not replace the 501
 * until authentication, DB-backed approval/version checks, Meta OAuth/token
 * storage, media validation, audit logging and explicit confirmation are ready.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.confirmPublish !== true) {
    return NextResponse.json({ error: "Explicit publish confirmation is required." }, { status: 400 });
  }
  return NextResponse.json({
    error: "Publishing is disabled in this starter. No Instagram action was taken.",
    requires: [
      "authenticated user and server-side authorization",
      "database check that the exact content version is approved",
      "final explicit confirmation for this publish action",
      "connected eligible Instagram professional account",
      "public media URL validation and Meta API error handling",
      "audit log for approver, content version, timestamp and API result"
    ]
  }, { status: 501 });
}
