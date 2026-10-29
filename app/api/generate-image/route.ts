import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Please sign in before generating an illustration." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Your session could not be verified. Please sign in again." }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Image generation is not configured yet. Add OPENAI_API_KEY to Vercel environment variables." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length < 8) {
      return NextResponse.json({ error: "Please describe the illustration in at least a few words." }, { status: 400 });
    }
    if (prompt.length > 4000) {
      return NextResponse.json({ error: "Please keep the illustration description under 4,000 characters." }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: [
        "Create one original illustration for Tales & Tinkers Studio, a warm, whimsical creative brand for parents and children ages 2–8.",
        "Use a polished picture-book illustration style, gentle expressive characters, tactile gouache or watercolour textures, welcoming colours, charming details, and clear composition.",
        "Be culturally respectful and age-appropriate. Avoid stereotypes, frightening imagery, logos, watermarks, and all written text or lettering.",
        "Follow this scene description:",
        prompt,
      ].join("\n\n"),
      size: "1024x1024",
    });

    const image = result.data?.[0]?.b64_json;
    if (!image) {
      return NextResponse.json({ error: "The image service did not return an image. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ image });
  } catch (error) {
    console.error("Image generation failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (/billing|quota|insufficient_quota/i.test(message)) {
      return NextResponse.json({ error: "OpenAI API billing or usage limits may need attention. Check your API platform billing and try again." }, { status: 402 });
    }
    return NextResponse.json({ error: "Could not generate the illustration right now. Please try again in a moment." }, { status: 500 });
  }
}
