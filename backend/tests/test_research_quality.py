import pytest
from datetime import datetime, timezone
from backend.services.tavily_service import (
    are_syndicated_duplicates,
    TavilyService,
    SPAM_OR_LOW_QUALITY_DOMAINS,
)
from backend.services.briefing_pipeline import validate_and_clean_briefing
from backend.services.gemini_service import GeminiService


def test_syndicated_duplicate_detection():
    # Identical or syndicated stories
    t1 = "NVIDIA Announces Third-Quarter Fiscal 2027 Financial Results"
    t2 = "NVIDIA to Announce Third-Quarter Fiscal 2027 Financial Results"
    assert are_syndicated_duplicates(t1, t2) is True

    t3 = "NVIDIA Launches Blackwell Ultra GPU Architecture"
    t4 = "NVIDIA Introduces Blackwell Ultra GPU Architecture for AI"
    assert are_syndicated_duplicates(t3, t4) is True

    # Distinct stories
    t5 = "NVIDIA Announces Record Data Center Revenue"
    t6 = "OpenAI Expands Partnership with Cloud Hyperscalers"
    assert are_syndicated_duplicates(t5, t6) is False


def test_spam_domains_filtered_out():
    service = TavilyService()
    service.client = type("MockClient", (), {})()
    
    # Return mock results containing one legitimate source and one spam content farm
    mock_results = [
        {
            "title": "NVIDIA Blackwell B200 Hyperscaler Shipments Begin",
            "url": "https://nvidianews.nvidia.com/news/blackwell-b200-shipments",
            "content": "Official announcement from NVIDIA.",
            "published_date": "2026-10-25T10:00:00Z",
            "score": 0.95,
        },
        {
            "title": "Short Interest in NVIDIA Decreases Significantly",
            "url": "https://www.marketbeat.com/stocks/NASDAQ/NVDA/short-interest",
            "content": "Automated ticker statistics.",
            "published_date": "2026-10-26T10:00:00Z",
            "score": 0.90,
        },
    ]

    service.client.search = lambda **kw: {"results": mock_results}

    results = service.search_multiple_queries(
        queries=[{"query": "NVIDIA news", "topic": "news"}],
        subject="NVIDIA",
        entity_type="company",
    )

    result_urls = [r["url"] for r in results]
    assert "https://nvidianews.nvidia.com/news/blackwell-b200-shipments" in result_urls
    assert "https://www.marketbeat.com/stocks/NASDAQ/NVDA/short-interest" not in result_urls


def test_independent_domain_corroboration_scoring():
    """
    Items citing two URLs from the SAME domain should be classified as 'single-source',
    while items citing two INDEPENDENT domains should be classified as 'verified'.
    """
    backend_sources = [
        {
            "id": 1,
            "title": "Reuters Article 1",
            "url": "https://reuters.com/article-1",
            "published_date": "2026-10-28",
            "is_dated": True,
        },
        {
            "id": 2,
            "title": "Reuters Article 2",
            "url": "https://reuters.com/article-2",
            "published_date": "2026-10-29",
            "is_dated": True,
        },
        {
            "id": 3,
            "title": "Bloomberg Coverage",
            "url": "https://bloomberg.com/article-3",
            "published_date": "2026-10-29",
            "is_dated": True,
        },
    ]

    raw_briefing = {
        "tldr": "Summary.",
        "keyDevelopments": [
            {
                # 2 sources from the SAME domain (reuters.com) -> NOT independent!
                "headline": "Same Domain Duplicate",
                "summary": "Reported across two pages on same site.",
                "confidence": "verified",
                "sources": [
                    {"id": 1, "url": "https://reuters.com/article-1"},
                    {"id": 2, "url": "https://reuters.com/article-2"},
                ],
            },
            {
                # 2 sources from INDEPENDENT domains (reuters.com + bloomberg.com) -> Independent!
                "headline": "Independently Corroborated Development",
                "summary": "Corroborated across two independent newsrooms.",
                "confidence": "verified",
                "sources": [
                    {"id": 1, "url": "https://reuters.com/article-1"},
                    {"id": 3, "url": "https://bloomberg.com/article-3"},
                ],
            },
        ],
    }

    cleaned = validate_and_clean_briefing(
        raw_briefing=raw_briefing,
        subject="NVIDIA",
        meeting_time="2026-11-10T10:00:00Z",
        sources=backend_sources,
        start_date_str="2026-10-11",
        end_date_str="2026-11-07",
        is_low_data=False,
    )

    items = cleaned.keyDevelopments
    assert len(items) == 2

    # Same domain item must downgrade to single-source
    assert items[0].confidence == "single-source"

    # Independent domain item must remain verified
    assert items[1].confidence == "verified"

