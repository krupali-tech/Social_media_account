import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const allowedFormats = new Set(["Carousel", "Single post", "Story sequence", "Reel"]);

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "AI generation is not configured. Add OPENAI_API_KEY on the server." }, { status: 503 });
  }
  try {
    const body = await req.json();
    const topic = String(body.topic ?? "").trim().slice(0, 500);
    const format = String(body.format ?? "Carousel");
    const pillar = String(body.pillar ?? "Little Tinkers");
    if (!topic) return NextResponse.json({ error: "A topic is required." }, { status: 400 });
    if (!allowedFormats.has(format)) return NextResponse.json({ error: "Unsupported content format." }, { status: 400 });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `You are the content assistant for Tales & Tinkers, a warm, inclusive, curious Indian family brand for parents and caregivers of children aged 2–8. Its pillars are Story Trails (Indian traditions, mythology, folklore and world stories), Little Tinkers (crafts and experiments), Together Time (parent-child activities), and Curious World (science and nature). Be playful, practical, culturally respectful and never preachy. Do not make unsupported cultural or scientific claims. Return a polished content brief with: title, caption, slide_or_frame_outline (each slide/frame separately numbered), CTA, and hashtags. Do not say the content is published.`
        },
        { role: "user", content: `Create a ${format} for the ${pillar} pillar on this topic: ${topic}. Return concise, child-safe content and a clear outline for every slide/frame.` }
      ]
    });
    return NextResponse.json({ content: response.output_text, status: "draft", requiresHumanReview: true });
  } catch (err) {
    console.error("AI generation error", err);
    return NextResponse.json({ error: "Content generation failed. Check server logs and API configuration." }, { status: 500 });
  }
}
