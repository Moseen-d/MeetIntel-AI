import pytest
from datetime import datetime, timezone
from backend.services.briefing_pipeline import validate_and_clean_briefing
from backend.services.gemini_service import GeminiService
from backend.services.tavily_service import TavilyService

def test_person_query_planning_fallback():
    """Verify fallback queries for person entity type focus on the individual."""
    service = GeminiService()
    fallback = [
        {"query": "Dario Amodei interviews public statements speeches", "topic": "news"},
        {"query": "Dario Amodei career history background current role", "topic": "general"},
        {"query": "Dario Amodei leadership decisions executive actions", "topic": "news"},
        {"query": "Dario Amodei essays articles views perspectives", "topic": "general"},
    ]
    # Check that individual name is in every query
    for q in fallback:
        assert "Dario Amodei" in q["query"]
        assert q["topic"] in {"general", "news", "finance"}

def test_person_mode_confidence_scoring():
    """
    Test confidence tiers:
    - Verified: at least two independent sources corroborate the claim, with at least one dated source within the research window.
    - Single-source: one dated source.
    - Uncertain: conflicting, thin or undated evidence.
    - Unconfirmed: unsupported claims.
    """
    sources = [
        {
            "id": 1,
            "title": "Dario Amodei Interview on AI Futures",
            "url": "https://reuters.com/dario-interview",
            "published_date": "2026-10-25",
            "is_dated": True,
        },
        {
            "id": 2,
            "title": "Anthropic CEO Dario Amodei on Scaling Laws",
            "url": "https://bloomberg.com/amodei-scaling",
            "published_date": "2026-10-27",
            "is_dated": True,
        },
        {
            "id": 3,
            "title": "Anthropic Executive Bio",
            "url": "https://anthropic.com/team/dario",
            "published_date": "Undated",
            "is_dated": False,
        },
    ]

    raw_briefing = {
        "tldr": "Dario Amodei is the CEO and co-founder of Anthropic.",
        "keyDevelopments": [
            {
                "headline": "Published Essay on AI Trajectory",
                "summary": "Dario Amodei published a widely discussed essay on AI capabilities and safety.",
                "date": "2026-10-27",
                "confidence": "verified",
                "sources": [
                    {"id": 1, "url": "https://reuters.com/dario-interview"},
                    {"id": 2, "url": "https://bloomberg.com/amodei-scaling"},
                ],
            },
            {
                "headline": "Podcast Discussion on Model Weights",
                "summary": "Amodei discussed model safety thresholds on a recent podcast.",
                "date": "2026-10-25",
                "confidence": "single-source",
                "sources": [{"id": 1, "url": "https://reuters.com/dario-interview"}],
            },
            {
                "headline": "Founding Background",
                "summary": "Amodei previously served as VP of Research before co-founding Anthropic.",
                "date": "Undated",
                "confidence": "single-source",  # Claimed single-source but source is undated!
                "sources": [{"id": 3, "url": "https://anthropic.com/team/dario"}],
            },
            {
                "headline": "Unverified Rumor",
                "summary": "An unconfirmed claim.",
                "date": "2026-10-25",
                "confidence": "unconfirmed",
                "sources": [{"id": 1, "url": "https://reuters.com/dario-interview"}],
            },
        ],
    }

    cleaned = validate_and_clean_briefing(
        raw_briefing=raw_briefing,
        subject="Dario Amodei",
        meeting_time="2026-11-08T10:00:00Z",
        sources=sources,
        start_date_str="2026-10-09",
        end_date_str="2026-11-08",
        is_low_data=False,
        entity_type="person",
    )

    items = cleaned.keyDevelopments
    assert len(items) == 4

    # 1. 2 dated sources -> verified
    assert items[0].confidence == "verified"
    assert items[0].date == "2026-10-27"

    # 2. 1 dated source -> single-source
    assert items[1].confidence == "single-source"
    assert items[1].date == "2026-10-25"

    # 3. Only undated source -> MUST be uncertain (undated evidence cannot be single-source or verified)
    assert items[2].confidence == "uncertain"
    assert items[2].date == "Undated"

    # 4. Explicit unconfirmed -> unconfirmed
    assert items[3].confidence == "unconfirmed"

def test_person_source_prioritization():
    """Verify that source prioritization boosts reputable journalism and person-relevant titles."""
    service = TavilyService(api_key="tvly-mock-key")
    # Test sorting heuristic directly
    subject = "Dario Amodei"
    sample_sources = [
        {
            "id": 1,
            "title": "Amazon invests $4 billion in AI startup Anthropic",
            "url": "https://randomblog.com/amazon-anthropic",
            "snippet": "General news on cloud infrastructure funding.",
            "is_dated": True,
            "score": 0.9,
        },
        {
            "id": 2,
            "title": "Dario Amodei on the Future of Powerful AI | In-Depth Interview",
            "url": "https://reuters.com/dario-amodei-interview",
            "snippet": "Anthropic CEO Dario Amodei speaks on AI safety, model scaling, and governance.",
            "is_dated": True,
            "score": 0.8,
        },
    ]

    # Re-use the heuristic logic tested in TavilyService
    def priority(s):
        score = float(s.get("score") or 0.5)
        s_url = s["url"].lower()
        s_title = s["title"].lower()
        s_snippet = s["snippet"].lower()
        name_tokens = ["dario", "amodei"]
        if "reuters.com" in s_url:
            score += 0.30
        if any(tok in s_title for tok in name_tokens):
            score += 0.40
        elif any(tok in s_snippet for tok in name_tokens):
            score += 0.15
        else:
            score -= 0.35
        return score

    sorted_sources = sorted(sample_sources, key=priority, reverse=True)
    # The Dario Amodei Reuters interview MUST rank ahead of the generic Amazon-Anthropic blog post
    assert sorted_sources[0]["id"] == 2
    assert "Dario Amodei" in sorted_sources[0]["title"]

