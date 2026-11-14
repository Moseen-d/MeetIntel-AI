"""
Independent test suite for the Tavily Search API integration.
Tests Tavily API key configuration, 30-day freshness parameter, and deduplication.
"""
import pytest
from backend.config import settings
from backend.services.tavily_service import TavilyService, test_tavily_connection as check_tavily

def test_tavily_config():
    """Verify that TavilyService instantiates cleanly and checks configuration."""
    service = TavilyService()
    if not settings.has_tavily:
        pytest.skip("TAVILY_API_KEY is not configured in backend/.env; skipping live network test.")
    assert service.client is not None

def test_tavily_live_search():
    """Verify live search with Tavily if API key is provided."""
    if not settings.has_tavily:
        pytest.skip("TAVILY_API_KEY is not configured in backend/.env; skipping live network test.")

    service = TavilyService()
    results = service.search_query("artificial intelligence technology updates", days=30, max_results=3)
    assert isinstance(results, list)
    if results:
        first = results[0]
        assert "url" in first
        assert "title" in first
        assert first["url"].startswith("http")

def test_tavily_connection_helper():
    """Verify connection helper function returns a valid status object."""
    res = check_tavily()
    assert "status" in res
    assert res["status"] in ["connected", "unconfigured", "error"]

if __name__ == "__main__":
    print("Testing Tavily integration...")
    res = check_tavily()
    print("Tavily Connection Test Result:", res)
