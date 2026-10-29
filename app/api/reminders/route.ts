import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

/**
 * Minimal email provider adapter. Protect this route with authentication before
 * exposing it publicly, and trigger it only from trusted server-side jobs.
 */
export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({ error: "Email is not configured on the server." }, { status: 503 });
  }
  // Never allow a public caller to choose arbitrary recipients or send arbitrary emails.
  const secret = process.env.REMINDER_JOB_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.REMINDER_TO) {
    return NextResponse.json({ error: "Set REMINDER_TO on the server." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const subject = String(body.subject ?? "Tales & Tinkers Studio reminder").slice(0, 120);
  const text = String(body.text ?? "You have content to review in Tales & Tinkers Studio.").slice(0, 4000);
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [process.env.REMINDER_TO],
      subject,
      text
    });
    return NextResponse.json({ sent: true, id: result.data?.id ?? null });
  } catch (err) {
    console.error("Reminder email error", err);
    return NextResponse.json({ error: "Email delivery failed." }, { status: 500 });
  }
}
