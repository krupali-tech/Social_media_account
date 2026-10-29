# Tales & Tinkers Studio — Hosted App Starter

This is a Next.js App Router starter package for the hosted version of Tales & Tinkers Studio. It is a **starter codebase**, not a deployed app or production-ready system.

## Included
- Responsive dashboard and content calendar
- Create/edit drafts and content status workflow
- Human approval confirmation
- Four brand pillars and starter content examples
- Server-side OpenAI text generation endpoint (`POST /api/generate`)
- Server-side Resend reminder adapter (`POST /api/reminders`, protected by `REMINDER_JOB_SECRET`)
- Fail-closed publishing route (`POST /api/publish`) that intentionally does not publish
- Initial Supabase schema for content, assets, approvals and preferences with RLS policies
- `.env.example`

## Local setup
1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local` and fill only credentials for services you have configured. Keep secrets server-side.
3. Run `npm install`.
4. Run `npm run dev` and open `http://localhost:3000`.

The UI demo currently keeps draft changes in React state only; it does not yet persist content to Supabase or implement authentication. The API route for generation is wired to the OpenAI API when configured. No email will be sent until the reminder route is invoked with the server-side secret and a verified sender is configured.

## Recommended deployment order
1. Create a private Git repository.
2. Create a Supabase project. Review and apply `supabase/schema.sql`; finish auth and server-side Supabase client setup.
3. Deploy the Next.js app to a managed host (e.g. Vercel) and configure environment variables.
4. Add server-side authentication to every mutating route and persist content through Supabase. Never expose the service-role key in the browser.
5. Configure OpenAI API billing and a text model in `OPENAI_TEXT_MODEL`. Add separate image generation and upload each slide/frame to private storage.
6. Verify an email sender domain in Resend, set `EMAIL_FROM`, `REMINDER_TO`, and `REMINDER_JOB_SECRET`; add a trusted scheduled job for reminders.
7. Configure a Meta developer app and OAuth for an eligible Instagram Business/Creator account. Use Meta's current documentation to confirm permissions, supported formats and review requirements.
8. Implement the publishing adapter only after server-side authorization and audit logs exist.

## Non-negotiable publishing controls
- The starter's publish endpoint is intentionally disabled and returns HTTP 501.
- Never publish directly from a browser.
- Store an approval against an exact content version. Any edit to publishable content invalidates that approval.
- Before each publish call, server-side code must verify the user, content owner, approved version, connected account, asset readiness and an explicit confirmation.
- Log approval and publishing attempts/results.
- Stories publishing availability varies by Meta API flow/account type. Confirm the chosen integration supports every required format before promising it.

## External references
- Next.js environment variables: https://nextjs.org/docs/pages/guides/environment-variables
- Supabase + Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- OpenAI image generation: https://developers.openai.com/api/docs/guides/image-generation
- Instagram professional publishing: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Resend email API: https://resend.com/features/email-api
