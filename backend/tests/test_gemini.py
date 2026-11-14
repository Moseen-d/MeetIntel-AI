"""
Independent test suite for the Google Gemini API integration.
Tests Gemini API key configuration, JSON mode enforcement, and structured output.
"""
import pytest
from backend.config import settings
from backend.services.gemini_service import GeminiService, test_gemini_connection as check_gemini

def test_gemini_config():
    """Verify that GeminiService initializes properly."""
    service = GeminiService()
    if not settings.has_gemini:
        pytest.skip("GEMINI_API_KEY is not configured in backend/.env; skipping live test.")
    assert service._client is not None

def test_gemini_json_generation():
    """Verify structured JSON generation with Gemini if API key is provided."""
    if not settings.has_gemini:
        pytest.skip("GEMINI_API_KEY is not configured in backend/.env; skipping live test.")

    service = GeminiService()
    res = service.generate_json(
        prompt="Generate a JSON object with 'status': 'ok' and 'service': 'Briefly Gemini Integration'",
        system_instruction="Output valid JSON only."
    )
    assert isinstance(res, dict)
    assert res.get("status") == "ok"

def test_gemini_connection_helper():
    """Verify connection helper function returns a valid status object."""
    res = check_gemini()
    assert "status" in res
    assert res["status"] in ["connected", "unconfigured", "error"]

if __name__ == "__main__":
    print("Testing Gemini integration...")
    res = check_gemini()
    print("Gemini Connection Test Result:", res)
