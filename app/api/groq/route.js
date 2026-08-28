export async function POST(request) {
  try {
    const body = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: body.model || "llama-3.3-70b-versatile",
          messages: body.messages || [],
          temperature: body.temperature ?? 0.2
        })
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
