import re
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, Optional
from urllib.parse import urlparse
from backend.config import settings
from backend.models import BriefRequest, BriefingResponse, BriefItem, SourceCitation
from backend.services.tavily_service import TavilyService
from backend.services.gemini_service import GeminiService
from backend.services.date_utils import calculate_research_window

logger = logging.getLogger("briefly.pipeline")

async def run_briefing_workflow(
    request: BriefRequest
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Executes the 5-step pre-meeting briefing agent workflow connecting Tavily and Gemini:
    1. Calculate 30-day research window based on meeting date and current date.
    2. Plan targeted queries restricted to the window.
    3. Search Tavily with date filters and independently validate dates in backend.
    4. Synthesize structured briefing with strict date and source grounding.
    5. Programmatically clean and enforce date truth against hallucination.
    """
    subject = request.subject.strip()
    entity_type = request.type
    meeting_time = request.meetingTime
    context = request.context or ""
    purpose = request.purpose or ""

    # Check API keys
    if not settings.has_tavily:
        yield {
            "stage": "Error",
            "message": "TAVILY_API_KEY is not configured in backend/.env. Please configure your key to run live web research.",
            "error": "TAVILY_API_KEY missing",
        }
        return

    if not settings.has_gemini:
        yield {
            "stage": "Error",
            "message": "GEMINI_API_KEY is not configured in backend/.env. Please configure your Google Gemini key to analyze results.",
            "error": "GEMINI_API_KEY missing",
        }
        return

    # 1. Calculate research window (Req 1 & 2)
    # Start date = 30 days before meeting date; End date = min(meeting date, current date)
    try:
        start_dt, end_dt, start_date_str, end_date_str = calculate_research_window(meeting_time)
        window_desc = f"{start_date_str} to {end_date_str}"
        logger.info(f"Research window for '{subject}': {window_desc} (Meeting: {meeting_time})")
    except Exception as e:
        logger.error(f"Failed to calculate research window: {e}")
        yield {
            "stage": "Error",
            "message": f"Invalid meeting time format: {str(e)}",
            "error": str(e),
        }
        return

    tavily_service = TavilyService()
    gemini_service = GeminiService()

    try:
        # ----------------------------------------------------
        # STEP 1: PLAN (Gemini)
        # ----------------------------------------------------
        yield {
            "stage": "Planning queries",
            "message": f"Formulating 4-6 targeted search queries for {subject} covering 30-day window ({window_desc})...",
            "progress": 15,
        }

        queries = gemini_service.plan_search_queries(
            subject=subject,
            entity_type=entity_type,
            context=context,
            purpose=purpose,
            research_window=window_desc,
        )

        query_strings = [q.get("query", "") for q in queries if q.get("query")]
        if not query_strings:
            from backend.services.gemini_service import is_engineering_interview_context
            if entity_type == "person":
                query_strings = [
                    f"{subject} interviews public statements speeches",
                    f"{subject} career history background current role",
                    f"{subject} leadership decisions executive actions",
                    f"{subject} essays articles views perspectives",
                ]
                queries = [
                    {"query": qs, "topic": "news" if i % 2 == 0 else "general"}
                    for i, qs in enumerate(query_strings)
                ]
            elif is_engineering_interview_context(context, purpose):
                query_strings = [
                    f"{subject} software architecture developer updates",
                    f"{subject} engineering platform SDK release",
                    f"{subject} infrastructure scaling challenges",
                    f"{subject} technical systems announcements",
                ]
                queries = [{"query": qs, "topic": "news"} for qs in query_strings]
            else:
                query_strings = [
                    f"{subject} latest news announcements",
                    f"{subject} product launch updates",
                    f"{subject} executive leadership statements",
                    f"{subject} funding revenue risks",
                ]
                queries = [{"query": qs, "topic": "news"} for qs in query_strings]

        yield {
            "stage": "Planning queries",
            "message": f"Generated {len(queries)} targeted search queries for {window_desc}.",
            "progress": 25,
            "data": {"queries": query_strings},
        }

        # ----------------------------------------------------
        # STEP 2: SEARCH (Tavily with date filters & backend validation)
        # ----------------------------------------------------
        yield {
            "stage": "Searching the web",
            "message": f"Querying Tavily news indices with date filter ({window_desc})...",
            "progress": 40,
        }

        # Tavily date filter applied (Req 3) & backend independent date validation (Req 4, 5, 7)
        sources = tavily_service.search_multiple_queries(
            queries=queries,
            start_date=start_date_str,
            end_date=end_date_str,
            start_datetime=start_dt,
            end_datetime=end_dt,
            subject=subject,
            entity_type=entity_type,
        )

        verified_dated_count = sum(1 for s in sources if s.get("is_dated"))
        is_low_data = len(sources) <= 1 or verified_dated_count <= 1

        yield {
            "stage": "Reading sources",
            "message": (
                f"Retrieved {len(sources)} sources ({verified_dated_count} dated within research window, {len(sources) - verified_dated_count} undated)."
                if not is_low_data
                else (
                    f"Retrieved 0 sources. No verifiable sources found in the selected research window ({window_desc})."
                    if not sources
                    else f"Retrieved {len(sources)} sources. Only limited verifiable sources found for window {window_desc}."
                )
            ),
            "progress": 60,
            "data": {"sourcesCount": len(sources)},
        }

        # ----------------------------------------------------
        # STEP 3: EXTRACT & VERIFY
        # ----------------------------------------------------
        yield {
            "stage": "Verifying claims",
            "message": (
                "Corroborating cross-source evidence and assessing claim confidence..."
                if not is_low_data
                else (
                    f"No verifiable sources found in the selected research window ({window_desc}). Synthesizing transparent report..."
                    if not sources
                    else "Limited recent sources detected. Verifying available snippets..."
                )
            ),
            "progress": 75,
        }

        # ----------------------------------------------------
        # STEP 4: SYNTHESIZE (Gemini with strict date rules)
        # ----------------------------------------------------
        yield {
            "stage": "Writing briefing",
            "message": "Asking Gemini to synthesize the one-page briefing with verified citations...",
            "progress": 85,
        }

        raw_briefing = gemini_service.synthesize_briefing(
            subject=subject,
            entity_type=entity_type,
            meeting_time=meeting_time,
            context=context,
            purpose=purpose,
            sources=sources,
            research_start_date=start_date_str,
            research_end_date=end_date_str,
            is_low_data=is_low_data,
        )

        # ----------------------------------------------------
        # STEP 5: VALIDATE & ENFORCE SOURCE TRUTH
        # ----------------------------------------------------
        validated = validate_and_clean_briefing(
            raw_briefing=raw_briefing,
            subject=subject,
            meeting_time=meeting_time,
            sources=sources,
            start_date_str=start_date_str,
            end_date_str=end_date_str,
            is_low_data=is_low_data,
            purpose=purpose,
            entity_type=entity_type,
        )

        yield {
            "stage": "Complete",
            "message": "Briefing generated and validated successfully.",
            "progress": 100,
            "data": validated.model_dump(),
        }

    except Exception as e:
        logger.error(f"Error in briefing workflow: {e}", exc_info=True)
        yield {
            "stage": "Error",
            "message": f"Research workflow error: {str(e)}",
            "error": str(e),
        }


def validate_and_clean_briefing(
    raw_briefing: Dict[str, Any],
    subject: str,
    meeting_time: str,
    sources: list,
    start_date_str: str = "",
    end_date_str: str = "",
    is_low_data: bool = False,
    purpose: Optional[str] = None,
    entity_type: str = "company",
) -> BriefingResponse:
    """
    Programmatically cleans and validates the LLM briefing:
    - Enforces source truth for publication dates on all items: Gemini CANNOT invent or modify dates (Req 6).
    - Excludes items without valid source URLs.
    - Enforces confidence scoring:
        * Verified: >= 2 independent sources with at least one dated source within window.
        * Single-source: 1 dated source.
        * Uncertain: conflicting, thin, or undated evidence.
        * Unconfirmed: unsupported claims.
    - If insufficient recent results exist, explicitly discloses this in the briefing.
    - Provides accurate coverageNote with exact dates.
    """
    if not start_date_str or not end_date_str:
        try:
            _, _, calc_start, calc_end = calculate_research_window(meeting_time)
            start_date_str = start_date_str or calc_start
            end_date_str = end_date_str or calc_end
        except Exception:
            start_date_str = start_date_str or "30 days ago"
            end_date_str = end_date_str or "Meeting date"

    window_desc = f"{start_date_str} to {end_date_str}"

    # Build lookup dictionaries from verified backend sources
    sources_by_url: Dict[str, Dict[str, Any]] = {}
    sources_by_id: Dict[int, Dict[str, Any]] = {}

    for s in sources:
        url = s.get("url", "").strip()
        try:
            parsed = urlparse(url)
            norm_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/").lower()
        except Exception:
            norm_url = url.rstrip("/").lower()

        if norm_url:
            sources_by_url[norm_url] = s
        if s.get("id"):
            sources_by_id[s["id"]] = s

    def clean_items(raw_items: list) -> list[BriefItem]:
        valid_items = []
        for item in (raw_items or []):
            if not isinstance(item, dict):
                continue

            headline = (item.get("headline") or "Update").strip()
            summary = (item.get("summary") or "").strip()
            raw_sources = item.get("sources", [])

            cited_citations: list[SourceCitation] = []
            has_dated_source = False
            verified_dates: list[str] = []

            for s in raw_sources:
                if not isinstance(s, dict):
                    continue
                url = str(s.get("url") or "").strip()
                if not url.startswith("http"):
                    continue

                # Match against backend sources
                matched = None
                try:
                    parsed = urlparse(url)
                    norm_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/").lower()
                    matched = sources_by_url.get(norm_url)
                except Exception:
                    pass

                if not matched and s.get("id"):
                    matched = sources_by_id.get(s["id"])

                if matched:
                    # Source verified in backend
                    v_date = matched.get("published_date") or "Undated"
                    is_dated = matched.get("is_dated", False)
                    cited_citations.append(
                        SourceCitation(
                            id=matched.get("id"),
                            title=matched.get("title", s.get("title", "Web Source")),
                            url=matched.get("url", url),
                            date=v_date,
                        )
                    )
                    if is_dated and v_date != "Undated":
                        has_dated_source = True
                        verified_dates.append(v_date)
                else:
                    # URL not in backend retrieved sources -> mark as Undated
                    cited_citations.append(
                        SourceCitation(
                            id=s.get("id"),
                            title=s.get("title", "Web Source"),
                            url=url,
                            date="Undated",
                        )
                    )

            # Strip sourceless claims
            if not cited_citations:
                continue

            # Requirement 6: Do not allow Gemini to invent or modify publication dates!
            # Requirement 7: Mark undated sources clearly
            if has_dated_source and verified_dates:
                # Use latest verified date from actual backend sources
                item_date = max(verified_dates)
            else:
                item_date = "Undated"

            # Determine confidence strictly:
            # - Verified: at least 2 independent domains corroborate the claim, with at least one dated source within window.
            # - Single-source: 1 dated source.
            # - Uncertain: conflicting, thin or undated evidence.
            # - Unconfirmed: unsupported claims.
            unique_domains = {
                urlparse(c.url).netloc.lower().replace("www.", "")
                for c in cited_citations
                if c.url
            }

            raw_conf = str(item.get("confidence", "")).lower()

            if raw_conf == "unconfirmed" or not cited_citations:
                confidence = "unconfirmed"
            elif len(unique_domains) >= 2 and has_dated_source and raw_conf not in ("uncertain", "unconfirmed"):
                confidence = "verified"
            elif len(cited_citations) >= 1 and has_dated_source and raw_conf not in ("uncertain", "unconfirmed"):
                confidence = "single-source"
            else:
                confidence = "uncertain"

            # Ensure every factual claim has supporting inline source attribution [id]
            cited_ids = [c.id for c in cited_citations if c.id]
            if cited_ids and not re.search(r"\[\d+(?:,\s*\d+)*\]", summary):
                summary = f"{summary.rstrip('.')} [{', '.join(str(i) for i in cited_ids)}]."

            valid_items.append(
                BriefItem(
                    headline=headline,
                    summary=summary,
                    date=item_date,
                    confidence=confidence,
                    sources=cited_citations,
                )
            )

        return valid_items

    key_developments = clean_items(raw_briefing.get("keyDevelopments", []))
    leadership = clean_items(raw_briefing.get("leadershipAndPeople", []))
    products = clean_items(raw_briefing.get("productsAndAnnouncements", []))
    risks = clean_items(raw_briefing.get("risksAndOpenUncertainties", []))

    # Low data handling: Never create placeholder or fabricated source citations (Req 1).
    # Never describe the absence of retrieved results as proof that no company news exists (Req 2).
    # Transparently show "No verifiable sources found in the selected research window" (Req 5).
    if is_low_data or not key_developments:
        fallback_source = (
            [
                SourceCitation(
                    id=s.get("id", 1),
                    title=s.get("title", "Web Source"),
                    url=s.get("url", ""),
                    date=s.get("published_date") or "Undated",
                )
                for s in sources[:2]
            ]
            if sources
            else []
        )

        if not key_developments:
            headline = (
                "No verifiable sources found in the selected research window"
                if not sources
                else "Limited verifiable sources retrieved in the selected research window"
            )
            summary = (
                f"No verifiable sources found in the selected research window ({window_desc})."
                if not sources
                else f"Only limited verifiable sources were retrieved for {subject} within the selected research window ({window_desc})."
            )
            key_developments = [
                BriefItem(
                    headline=headline,
                    summary=summary,
                    date="Undated" if not sources or not sources[0].get("is_dated") else (sources[0].get("published_date") or "Undated"),
                    confidence="uncertain",
                    sources=fallback_source,
                )
            ]

    # Executive Summary (TLDR) adjustment: transparent disclosure without claiming absence of business activities
    raw_tldr = raw_briefing.get("tldr", "").strip()
    if not sources:
        if entity_type == "person":
            tldr = (
                f"Unable to confidently identify verifiable public records for {subject} in the selected research window ({window_desc}). "
                f"Please verify the person's full name, current organization, or title."
            )
        else:
            tldr = f"No verifiable sources found in the selected research window ({window_desc})."
    elif is_low_data:
        disclosure = f"Only limited verifiable sources were retrieved for {subject} within the selected research window ({window_desc})."
        if "verifiable" not in raw_tldr.lower() and "limited" not in raw_tldr.lower():
            tldr = f"{raw_tldr} ({disclosure})" if raw_tldr else disclosure
        else:
            tldr = raw_tldr
    else:
        tldr = raw_tldr or f"Research summary for {subject} based on the 30-day research window ({window_desc})."

    # Build sources list strictly from real backend verified sources (never fabricated citations)
    sources_citations = [
        SourceCitation(
            id=s.get("id", idx),
            title=s.get("title", "Web Source"),
            url=s.get("url", ""),
            date=s.get("published_date") or "Undated",
        )
        for idx, s in enumerate(sources, start=1)
    ]

    coverage_note = (
        f"Research window: {window_desc} • No verifiable sources found"
        if not sources
        else (
            f"Research window: {window_desc} • Limited verifiable sources"
            if is_low_data
            else f"Research window: {window_desc}"
        )
    )

    return BriefingResponse(
        subject=subject,
        meetingTime=meeting_time,
        tldr=tldr,
        keyDevelopments=key_developments,
        leadershipAndPeople=leadership,
        productsAndAnnouncements=products,
        risksAndOpenUncertainties=risks,
        talkingPoints=raw_briefing.get("talkingPoints", []),
        openQuestions=raw_briefing.get("openQuestions", []),
        sources=sources_citations,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        coverageNote=coverage_note,
        isLowData=is_low_data,
    )
