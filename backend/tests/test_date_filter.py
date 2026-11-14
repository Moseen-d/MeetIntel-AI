import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from backend.services.date_utils import (
    calculate_research_window,
    parse_source_publication_date,
    validate_source_date,
    parse_datetime_flexible,
)
from backend.services.tavily_service import TavilyService
from backend.services.briefing_pipeline import validate_and_clean_briefing


# ============================================================================
# Requirement 1 & 2: Research Window Calculations
# ============================================================================
def test_calculate_research_window_future_meeting():
    """
    Req 1: Start date = 30 days before meeting date.
    Req 2: End date = earlier of meeting date and current date.
    Meeting is 3 days in the future.
    """
    now = datetime(2026, 11, 7, 12, 0, 0, tzinfo=timezone.utc)
    meeting_time = "2026-11-10T10:00:00Z"  # 3 days in future

    start_dt, end_dt, start_str, end_str = calculate_research_window(meeting_time, now=now)

    # 30 days before Nov 10 is Oct 11
    assert start_str == "2026-10-11"
    # Earlier of meeting (Nov 10) and now (Nov 7) is Nov 7
    assert end_str == "2026-11-07"
    assert end_dt == now


def test_calculate_research_window_past_meeting():
    """
    Meeting was in the past (e.g. 5 days ago).
    End date should be the meeting date (earlier than now).
    """
    now = datetime(2026, 11, 7, 12, 0, 0, tzinfo=timezone.utc)
    meeting_time = "2026-11-02T14:00:00Z"

    start_dt, end_dt, start_str, end_str = calculate_research_window(meeting_time, now=now)

    # 30 days before Nov 2 is Oct 3
    assert start_str == "2026-10-03"
    # Earlier of meeting (Nov 2) and now (Nov 7) is Nov 2
    assert end_str == "2026-11-02"
    assert end_dt.day == 2


def test_calculate_research_window_same_day():
    """
    Meeting is today (November 7, 2026).
    Research window must strictly be October 8, 2026 through November 7, 2026.
    """
    now = datetime(2026, 11, 7, 18, 0, 0, tzinfo=timezone.utc)
    meeting_time = "2026-11-07T10:00:00Z"

    start_dt, end_dt, start_str, end_str = calculate_research_window(meeting_time, now=now)

    assert start_str == "2026-10-08"
    assert end_str == "2026-11-07"


def test_engineering_interview_context_detection():
    """
    Priority 4: Verify engineering interview and internship keywords are detected.
    """
    from backend.services.gemini_service import is_engineering_interview_context

    assert is_engineering_interview_context(
        context="Software Engineering Internship",
        purpose="Job Interview"
    ) is True

    assert is_engineering_interview_context(
        context="Focus on distributed GPU scaling and CUDA compilation",
        purpose=""
    ) is True

    assert is_engineering_interview_context(
        context="General quarterly review",
        purpose="Quarterly Review"
    ) is False


# ============================================================================
# Requirement 4, 5, 7: Source Date Parsing & Backend Independent Validation
# ============================================================================
def test_validate_source_date_inside_window():
    start_dt = datetime(2026, 10, 8, tzinfo=timezone.utc)
    end_dt = datetime(2026, 11, 7, tzinfo=timezone.utc)

    # ISO format within window
    is_valid, date_str, is_dated = validate_source_date("2026-10-25T14:30:00Z", start_dt, end_dt)
    assert is_valid is True
    assert is_dated is True
    assert date_str == "2026-10-25"

    # Simple date within window
    is_valid, date_str, is_dated = validate_source_date("2026-11-02", start_dt, end_dt)
    assert is_valid is True
    assert is_dated is True
    assert date_str == "2026-11-02"


def test_validate_source_date_outside_window_excluded():
    """
    Req 5: Exclude sources outside the required research window.
    """
    start_dt = datetime(2026, 10, 8, tzinfo=timezone.utc)
    end_dt = datetime(2026, 11, 7, tzinfo=timezone.utc)

    # Older than 30 days (e.g. Sept 2026)
    is_valid, date_str, is_dated = validate_source_date("2026-09-15T10:00:00Z", start_dt, end_dt)
    assert is_valid is False  # Must be excluded!

    # Old year 2024
    is_valid, date_str, is_dated = validate_source_date("2024-05-20", start_dt, end_dt)
    assert is_valid is False  # Must be excluded!

    # Future date beyond end_dt
    is_valid, date_str, is_dated = validate_source_date("2026-11-15", start_dt, end_dt)
    assert is_valid is False  # Must be excluded!


def test_validate_source_date_undated():
    """
    Req 7: If a source has no reliable publication date, clearly mark it as
    undated rather than treating it as verified recent news.
    """
    start_dt = datetime(2026, 10, 8, tzinfo=timezone.utc)
    end_dt = datetime(2026, 11, 7, tzinfo=timezone.utc)

    for empty_val in [None, "", "null", "None", "unknown", "undated", "N/A"]:
        is_valid, date_str, is_dated = validate_source_date(empty_val, start_dt, end_dt)
        assert is_valid is True
        assert is_dated is False
        assert date_str == "Undated"


# ============================================================================
# Requirement 3, 4, 5: TavilyService with Date Filters & Independent Filtering
# ============================================================================
def test_tavily_service_filters_and_excludes():
    """
    Verify Tavily date filters passed where supported (Req 3),
    backend validates every returned source date (Req 4),
    and excludes sources outside the window (Req 5).
    """
    service = TavilyService(api_key="tvly-mock-test-key")
    service.client = MagicMock()

    # Mock response with 4 items:
    # 1. Valid recent item (inside window)
    # 2. Old item from 2024 (outside window)
    # 3. Item from 60 days ago (outside window)
    # 4. Undated item
    mock_results = [
        {
            "title": "NVIDIA Blackwell Launch",
            "url": "https://example.com/nvidia-blackwell",
            "content": "NVIDIA launched Blackwell GPUs today.",
            "published_date": "2026-10-25T10:00:00Z",
            "score": 0.95,
        },
        {
            "title": "Old 2024 GPU News",
            "url": "https://example.com/old-news",
            "content": "GPU news from two years ago.",
            "published_date": "2024-06-01T10:00:00Z",
            "score": 0.80,
        },
        {
            "title": "Old News 60 Days Ago",
            "url": "https://example.com/60-days-ago",
            "content": "News from late August.",
            "published_date": "2026-08-25T10:00:00Z",
            "score": 0.70,
        },
        {
            "title": "NVIDIA Corporate Overview",
            "url": "https://example.com/nvidia-overview",
            "content": "Company profile and architecture overview.",
            "published_date": None,
            "score": 0.85,
        },
    ]

    service.client.search.return_value = {"results": mock_results}

    start_dt = datetime(2026, 10, 8, tzinfo=timezone.utc)
    end_dt = datetime(2026, 11, 7, tzinfo=timezone.utc)

    results = service.search_query(
        query="NVIDIA developments",
        start_date="2026-10-08",
        end_date="2026-11-07",
        start_datetime=start_dt,
        end_datetime=end_dt,
    )

    # Check that Tavily search was called with start_date and end_date (Req 3)
    call_kwargs = service.client.search.call_args[1]
    assert call_kwargs.get("start_date") == "2026-10-08"
    assert call_kwargs.get("end_date") == "2026-11-07"
    # Ensure conflicting relative params days and time_range are omitted
    assert "time_range" not in call_kwargs

    # Req 5: Old items (2024 and 60 days ago) MUST be excluded!
    assert len(results) == 2
    urls = [r["url"] for r in results]
    assert "https://example.com/nvidia-blackwell" in urls
    assert "https://example.com/nvidia-overview" in urls
    assert "https://example.com/old-news" not in urls
    assert "https://example.com/60-days-ago" not in urls

    # Req 7: Undated item is marked as "Undated" and is_dated is False
    overview_item = next(r for r in results if r["url"] == "https://example.com/nvidia-overview")
    assert overview_item["published_date"] == "Undated"
    assert overview_item["is_dated"] is False

    # Valid item is marked with verified date
    blackwell_item = next(r for r in results if r["url"] == "https://example.com/nvidia-blackwell")
    assert blackwell_item["published_date"] == "2026-10-25"
    assert blackwell_item["is_dated"] is True


# ============================================================================
# Requirement 6 & 7: Gemini Date Hallucination Prevention & Truth Enforcement
# ============================================================================
def test_validate_and_clean_briefing_overrides_gemini_hallucinated_dates():
    """
    Req 6: Do not allow Gemini to invent or modify publication dates.
    Backend must enforce the true date from the verified backend source.
    """
    backend_sources = [
        {
            "id": 1,
            "title": "Verified Article",
            "url": "https://example.com/news-1",
            "published_date": "2026-10-28",
            "is_dated": True,
            "score": 0.9,
        },
        {
            "id": 2,
            "title": "Undated Article",
            "url": "https://example.com/undated-doc",
            "published_date": "Undated",
            "is_dated": False,
            "score": 0.8,
        },
    ]

    # Suppose Gemini returns hallucinated dates
    raw_briefing = {
        "tldr": "Executive summary.",
        "keyDevelopments": [
            {
                "headline": "Blackwell Shipments",
                "summary": "Shipments started according to [1].",
                # Gemini hallucinated an invented date:
                "date": "2029-12-31",
                "confidence": "verified",
                "sources": [{"title": "Verified Article", "url": "https://example.com/news-1"}],
            },
            {
                "headline": "Architecture Spec",
                "summary": "Architecture spec detailed in [2].",
                # Gemini hallucinated another date for an undated source:
                "date": "2026-11-05",
                "confidence": "verified",
                "sources": [{"title": "Undated Article", "url": "https://example.com/undated-doc"}],
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

    # Item 1: Gemini's 2029-12-31 MUST be overridden by source date 2026-10-28!
    assert items[0].date == "2026-10-28"
    assert items[0].sources[0].date == "2026-10-28"

    # Item 2: Cites undated source. Gemini's 2026-11-05 MUST be overridden to "Undated"!
    # Req 7: Undated cannot be "verified"
    assert items[1].date == "Undated"
    assert items[1].confidence != "verified"
    assert items[1].sources[0].date == "Undated"


# ============================================================================
# Zero Sources & Transparent Disclosure (Never Fabricate Citations)
# ============================================================================
def test_zero_sources_returns_empty_sources_and_transparent_disclosure():
    """
    Req 1: Never create placeholder or fabricated source citations. If there are zero sources, return sources: [].
    Req 2: Never describe the absence of retrieved results as proof that no company news exists.
    Req 5: Transparently show "No verifiable sources found in the selected research window."
    """
    backend_sources = []

    raw_briefing = {
        "tldr": "Some hallucinated overview.",
        "keyDevelopments": [],
    }

    cleaned = validate_and_clean_briefing(
        raw_briefing=raw_briefing,
        subject="NVIDIA",
        meeting_time="2026-11-10T10:00:00Z",
        sources=backend_sources,
        start_date_str="2026-10-11",
        end_date_str="2026-11-07",
        is_low_data=True,
    )

    # Req 1: Must return sources: [] (NO fake https://tavily.com citations!)
    assert cleaned.sources == []
    assert len(cleaned.keyDevelopments) == 1
    assert cleaned.keyDevelopments[0].sources == []

    # Req 5: Transparent disclosure wording
    assert cleaned.keyDevelopments[0].headline == "No verifiable sources found in the selected research window"
    assert "No verifiable sources found in the selected research window (2026-10-11 to 2026-11-07)" in cleaned.keyDevelopments[0].summary
    assert "No verifiable sources found in the selected research window" in cleaned.tldr

    # Req 2: Ensure absence of evidence is not claimed as proof of absence of company news
    assert "minimal new press releases" not in cleaned.keyDevelopments[0].summary
    assert "no company news" not in cleaned.keyDevelopments[0].summary

    # Coverage note
    assert "No verifiable sources found" in cleaned.coverageNote
    assert cleaned.isLowData is True

