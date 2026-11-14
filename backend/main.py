import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from backend.config import settings
from backend.models import BriefRequest, BriefingResponse
from backend.services.tavily_service import TavilyService, test_tavily_connection
from backend.services.gemini_service import GeminiService, test_gemini_connection
from backend.services.briefing_pipeline import run_briefing_workflow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("briefly.api")

app = FastAPI(
    title="Briefly API — Pre-Meeting Briefing Agent",
    version="1.0.0",
    description="Backend API powered by FastAPI, Tavily Search, and Google Gemini SDKs."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Briefly Pre-Meeting Briefing Agent API",
        "docs": "/docs",
        "health": "/api/health",
    }

@app.get("/api/health")
def health_check():
    """
    Checks backend health and configuration of Tavily and Google Gemini.
    """
    return {
        "status": "healthy",
        "tavily_configured": settings.has_tavily,
        "gemini_configured": settings.has_gemini,
        "gemini_model": settings.GEMINI_MODEL,
    }

@app.get("/api/test/tavily")
def test_tavily():
    """
    Independent test for the Tavily Search API.
    """
    res = test_tavily_connection()
    return res

@app.get("/api/test/gemini")
def test_gemini():
    """
    Independent test for Google Gemini API.
    """
    res = test_gemini_connection()
    return res

@app.post("/api/brief")
async def create_briefing(request: BriefRequest):
    """
    Primary Briefing Endpoint (SSE Streaming):
    Streams live pipeline stages: Planning queries -> Searching the web ->
    Reading sources -> Verifying claims -> Writing briefing -> Complete
    """
    async def event_generator():
        try:
            async for event in run_briefing_workflow(request):
                payload = f"data: {json.dumps(event)}\n\n"
                yield payload.encode("utf-8")
        except Exception as e:
            logger.error(f"SSE stream error: {e}")
            err_event = {
                "stage": "Error",
                "message": f"Server error: {str(e)}",
                "error": str(e),
            }
            yield f"data: {json.dumps(err_event)}\n\n".encode("utf-8")

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
