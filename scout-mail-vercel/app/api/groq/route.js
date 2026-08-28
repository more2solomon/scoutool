import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const url = String(body.url || "").trim();
    const instructions = String(body.instructions || "Read the website and summarize it.").trim();

    if (!url) return NextResponse.json({ error: "URL is required." }, { status: 400 });
    if (!/^https?:\/\//i.test(url)) return NextResponse.json({ error: "Only http/https URLs are allowed." }, { status: 400 });
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is not configured on Vercel." }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "groq/compound",
        messages: [
          {
            role: "system",
            content: "You are a careful website-analysis assistant. Do not invent facts. Return concise, useful output."
          },
          {
            role: "user",
            content: `${instructions}\n\nTarget website: ${url}`
          }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Groq API request failed." }, { status: response.status });
    }

    return NextResponse.json({ text: data?.choices?.[0]?.message?.content || "" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unexpected error." }, { status: 500 });
  }
}
