import { NextRequest } from "next/server";
import { BriefRequestSchema, PipelineEvent } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000/api/brief";

export async function POST(req: NextRequest) {
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = BriefRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.issues,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Helper to format an SSE event string
  const formatSseEvent = (event: PipelineEvent) => `data: ${JSON.stringify(event)}\n\n`;

  // 1. Direct connection to live FastAPI backend (Tavily + Gemini pipeline)
  try {
    const fastApiResponse = await fetch(FASTAPI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(parsed.data),
    });

    if (fastApiResponse.ok && fastApiResponse.body) {
      // Pipe FastAPI's live SSE stream directly to the browser
      return new Response(fastApiResponse.body as any, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Backend returned an error response (e.g. 500, 422, etc.)
    // Never silently substitute mock data! (Priority 1)
    const errText = await fastApiResponse.text().catch(() => "");
    const errorMsg = `FastAPI backend returned status ${fastApiResponse.status}: ${errText || fastApiResponse.statusText}`;
    
    return createSseErrorResponse({
      stage: "Error",
      message: errorMsg,
      error: errorMsg,
    });
  } catch (err: any) {
    // Live backend connection failed (e.g. FastAPI server is not running on port 8000)
    // Never silently substitute mock data! Show clear error instead (Priority 1).
    const errorMsg =
      `Live FastAPI backend is offline or unreachable at ${FASTAPI_URL}. ` +
      `Please ensure the backend is running by executing: python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`;

    return createSseErrorResponse({
      stage: "Error",
      message: errorMsg,
      error: errorMsg,
    });
  }
}

function createSseErrorResponse(event: PipelineEvent) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const payload = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
