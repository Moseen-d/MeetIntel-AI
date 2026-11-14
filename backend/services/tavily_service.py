import os
import re
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from backend.config import settings
from backend.services.date_utils import validate_source_date

logger = logging.getLogger("briefly.tavily")

VALID_TAVILY_TOPICS = {"general", "news", "finance"}

REPUTABLE_DOMAINS = {
    # Official, Regulatory & Primary Documents
    "sec.gov", "edgar.sec.gov", "gov", "edu",
    # Tier-1 Business, Financial & Tech Journalism
    "reuters.com", "bloomberg.com", "ft.com", "wsj.com", "nytimes.com",
    "washingtonpost.com", "theverge.com", "techcrunch.com", "wired.com",
    "forbes.com", "fortune.com", "cnbc.com", "bbc.com", "bbc.co.uk",
    "theinformation.com", "economist.com", "time.com", "axios.com",
    "theguardian.com", "businessinsider.com", "venturebeat.com",
    # Deep Technical, Hardware, Semiconductor & Systems Publications
    "anandtech.com", "tomshardware.com", "servethehome.com", "semianalysis.com",
    "nextplatform.com", "huggingface.co", "github.com", "ieeexplore.ieee.org",
    "acm.org", "arxiv.org", "nature.com", "science.org",
    # Authoritative Podcasts, Interviews, Bios & Primary Profiles
    "dwarkeshpatel.com", "lexfridman.com", "youtube.com", "podcasts.apple.com",
    "spotify.com", "substack.com", "wikipedia.org",
}

# Low-quality content scrapers, syndicated auto-generators, and clickbait to filter out
SPAM_OR_LOW_QUALITY_DOMAINS = {
    "zacks.com", "fool.com", "investorplace.com", "barchart.com", "marketbeat.com",
    "tipranks.com", "tickerreport.com", "dailypolitical.com", "defenseworld.net",
    "modernreaders.com", "fairfieldcurrent.com", "themarketsdaily.com",
    "etfdailynews.com", "investorsobserver.com", "claytoncountyregister.com",
    "insidermonkey.com", "benzinga.com", "finviz.com",
}


def are_syndicated_duplicates(title1: str, title2: str) -> bool:
    """
    Detects if two search results represent duplicate or syndicated coverage
    of the exact same announcement based on high lexical token overlap.
    """
    if not title1 or not title2:
        return False
    words1 = set(re.findall(r"\b[a-zA-Z0-9]{3,}\b", title1.lower()))
    words2 = set(re.findall(r"\b[a-zA-Z0-9]{3,}\b", title2.lower()))
    if not words1 or not words2:
        return False
    stops = {
        "the", "and", "for", "with", "from", "that", "this", "news", "report",
        "announces", "announced", "launch", "launches", "update", "updates", "say", "says"
    }
    w1 = words1 - stops
    w2 = words2 - stops
    if not w1 or not w2:
        return False
    intersection = len(w1 & w2)
    smaller_len = min(len(w1), len(w2))
    jaccard = intersection / len(w1 | w2)
    containment = intersection / smaller_len
    return jaccard >= 0.65 or containment >= 0.85

def normalize_tavily_topic(topic: Optional[str]) -> str:
    """
    Tavily only accepts topics: 'general', 'news', or 'finance'.
    Normalizes any unexpected topic (e.g., 'developer_tools', 'software_architecture')
    to 'general' with a warning log to prevent API errors.
    """
    if not topic:
        return "general"
    clean = str(topic).strip().lower()
    if clean in VALID_TAVILY_TOPICS:
        return clean
    logger.warning(
        f"Invalid Tavily topic '{topic}' supplied. Normalizing to 'general'. "
        f"Valid topics: {sorted(list(VALID_TAVILY_TOPICS))}"
    )
    return "general"

class TavilyService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.TAVILY_API_KEY
        self.client = None

        if self.api_key:
            try:
                from tavily import TavilyClient
                self.client = TavilyClient(api_key=self.api_key)
                logger.info("TavilyClient successfully initialized.")
            except ImportError:
                logger.error("tavily-python is not installed. Please install tavily-python.")
            except Exception as e:
                logger.error(f"Failed to initialize TavilyClient: {e}")
        else:
            logger.warning("TAVILY_API_KEY is not set. TavilyService will return empty results.")

    def search_query(
        self,
        query: str,
        topic: str = "news",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        start_datetime: Optional[datetime] = None,
        end_datetime: Optional[datetime] = None,
        days: int = 30,
        max_results: int = 5,
        include_raw_content: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Executes a single search query via the official Tavily Python SDK,
        strictly bounded to the calculated 30-day research window:
        - start_date: 30 days before meeting date (YYYY-MM-DD)
        - end_date: earlier of meeting date and current date (YYYY-MM-DD)
        """
        if not self.client:
            raise ValueError("Tavily client is not configured. Check TAVILY_API_KEY in backend/.env.")

        # Default datetimes if not explicitly supplied
        if end_datetime is None:
            end_datetime = datetime.now(timezone.utc)
        if start_datetime is None:
            start_datetime = end_datetime - timedelta(days=days)

        if not start_date:
            start_date = start_datetime.strftime("%Y-%m-%d")
        if not end_date:
            end_date = end_datetime.strftime("%Y-%m-%d")

        # Guard: If meeting is far in future such that start_date > end_date, no news can exist yet
        if start_datetime > end_datetime:
            logger.info(f"Research window starts in future ({start_date} > {end_date}); returning 0 results.")
            return []

        try:
            topic = normalize_tavily_topic(topic)
            # Build search payload respecting Tavily API constraints
            # Note: Tavily rejects mixing relative time filters (days/time_range) with absolute start_date/end_date
            search_kwargs: Dict[str, Any] = {
                "query": query,
                "topic": topic,
                "max_results": max_results,
                "include_raw_content": include_raw_content,
            }

            if start_date and end_date and start_date <= end_date:
                search_kwargs["start_date"] = start_date
                search_kwargs["end_date"] = end_date
                logger.info(
                    f"Tavily API request: query='{query}', "
                    f"start_date='{start_date}', end_date='{end_date}', topic='{topic}'"
                )
            else:
                search_kwargs["days"] = days
                search_kwargs["time_range"] = "month"
                logger.info(
                    f"Tavily API request: query='{query}', "
                    f"days={days}, topic='{topic}'"
                )

            try:
                response = self.client.search(**search_kwargs)
            except Exception as search_err:
                # If absolute date query throws an error, gracefully fallback to days
                if "start_date" in search_kwargs:
                    logger.warning(f"Tavily search with start_date/end_date failed: {search_err}. Retrying with relative fallback...")
                    fallback_kwargs = {
                        "query": query,
                        "topic": topic,
                        "days": days,
                        "max_results": max_results,
                        "include_raw_content": include_raw_content,
                    }
                    response = self.client.search(**fallback_kwargs)
                else:
                    raise search_err

            raw_results = response.get("results", []) if isinstance(response, dict) else []
            logger.info(f"Tavily API response for '{query}': {len(raw_results)} raw results returned.")
            valid_results = []

            for r in raw_results:
                url = r.get("url", "").strip()
                if not url:
                    continue

                raw_pub_date = r.get("published_date")
                logger.debug(
                    f"Inspecting raw Tavily result: title='{r.get('title')}', "
                    f"url='{url}', published_date='{raw_pub_date}', score={r.get('score')}"
                )

                # Independently validate every returned source's publication date in backend (Req 4)
                is_valid, date_display_str, is_dated = validate_source_date(
                    raw_pub_date, start_datetime, end_datetime
                )

                # Exclude sources outside the required research window (Req 5)
                if not is_valid:
                    logger.info(f"Excluded out-of-range source: {url} (published_date='{raw_pub_date}', window: {start_date} to {end_date})")
                    continue

                valid_results.append({
                    "title": (r.get("title") or "Web Source").strip(),
                    "url": url,
                    "snippet": (r.get("content") or "").strip(),
                    "published_date": date_display_str,  # "YYYY-MM-DD" or "Undated" (Req 7)
                    "is_dated": is_dated,                # True if dated inside window, False if Undated
                    "score": r.get("score", 0.0),
                })

            return valid_results
        except Exception as e:
            logger.error(f"Tavily search failed for query '{query}': {e}")
            raise e

    def search_multiple_queries(
        self,
        queries: List[Dict[str, str]],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        start_datetime: Optional[datetime] = None,
        end_datetime: Optional[datetime] = None,
        days: int = 30,
        subject: Optional[str] = None,
        entity_type: str = "company",
    ) -> List[Dict[str, Any]]:
        """
        Executes multiple queries, deduplicates by URL, and assigns sequential citation IDs.
        Filters strictly by the research window [start_date, end_date].
        Prioritizes official company pages, SEC filings, interviews and reputable publications.
        When entity_type is 'person', prioritizes individual-relevant sources over generic corporate news.
        """
        # If start_datetime is after end_datetime (meeting >30 days in future), 0 results
        if start_datetime and end_datetime and start_datetime > end_datetime:
            logger.info("Research window start is after end date. Returning 0 sources.")
            return []

        all_results = []
        for q in queries:
            query_str = q.get("query", "")
            topic = normalize_tavily_topic(q.get("topic", "news"))
            if not query_str:
                continue

            try:
                results = self.search_query(
                    query=query_str,
                    topic=topic,
                    start_date=start_date,
                    end_date=end_date,
                    start_datetime=start_datetime,
                    end_datetime=end_datetime,
                    days=days,
                    max_results=5,
                )
                all_results.extend(results)
            except Exception as e:
                logger.warning(f"Error querying '{query_str}': {e}")

        # 1. Filter out spam, low-quality content farms, and auto-generated scrapers
        filtered_results = []
        for item in all_results:
            url = item.get("url", "").lower()
            try:
                domain = urlparse(url).netloc.lower().replace("www.", "")
                if any(spam in domain for spam in SPAM_OR_LOW_QUALITY_DOMAINS):
                    logger.debug(f"Filtered out low-quality/spam domain: {domain} ({url})")
                    continue
            except Exception:
                pass
            filtered_results.append(item)

        # 2. Deduplicate by normalized URL (stripping trailing slash, tracking params, and www)
        seen_urls: Dict[str, Dict[str, Any]] = {}
        for item in filtered_results:
            url = item["url"]
            try:
                parsed = urlparse(url)
                netloc = parsed.netloc.lower()
                if netloc.startswith("www."):
                    netloc = netloc[4:]
                clean_path = parsed.path.rstrip("/")
                norm_url = f"{parsed.scheme.lower()}://{netloc}{clean_path}"
            except Exception:
                norm_url = url.rstrip("/").lower()

            # If already seen, prefer the version that has a verified date over Undated
            if norm_url in seen_urls:
                existing = seen_urls[norm_url]
                if not existing.get("is_dated") and item.get("is_dated"):
                    seen_urls[norm_url] = item
            else:
                seen_urls[norm_url] = item

        url_deduped = list(seen_urls.values())

        # 3. Quality scoring heuristic: prioritize official company announcements,
        # technical documentation, reputable journalism, and verified dates
        clean_subject = (subject or "").strip().lower()
        subject_slug = re.sub(r"[^a-z0-9]", "", clean_subject)

        def compute_source_priority(s: Dict[str, Any]) -> float:
            score = float(s.get("score") or 0.5)
            s_url = s.get("url", "").lower()
            s_title = (s.get("title") or "").lower()
            s_snippet = (s.get("snippet") or "").lower()

            try:
                domain = urlparse(s_url).netloc.lower().replace("www.", "")
            except Exception:
                domain = ""

            # Heavy boost for Official Company Newsrooms, Developer Portals & Primary Sites
            if subject_slug and (f"{subject_slug}.com" in domain or f"{subject_slug}.org" in domain or f"{subject_slug}.io" in domain or f"{subject_slug}.ai" in domain):
                score += 0.50
            if "nvidianews." in domain or "newsroom." in domain or "press." in domain or "investor." in domain or "blogs." in domain or "developer." in domain:
                score += 0.40

            # Boost for verified publication date inside the research window
            if s.get("is_dated"):
                score += 0.25

            # Boost for tier-1 business, tech journalism, and technical documentation
            if any(rep_domain in s_url for rep_domain in REPUTABLE_DOMAINS):
                score += 0.35

            # Boost for official SEC filings and regulatory releases
            if "sec.gov" in s_url or "edgar" in s_url:
                score += 0.40

            # Person-specific relevance boost
            if entity_type == "person" and subject:
                name_tokens = [tok.lower() for tok in subject.split() if len(tok) >= 3]
                in_title = any(tok in s_title for tok in name_tokens)
                in_snippet = any(tok in s_snippet for tok in name_tokens)
                
                individual_kws = [
                    "interview", "podcast", "speech", "speaks", "statement", "essay",
                    "career", "biography", "ceo", "founder", "co-founder", "profile",
                    "background", "education", "said", "stated", "quoted"
                ]
                has_ind_kw = any(kw in f"{s_title} {s_snippet}" for kw in individual_kws)

                if in_title:
                    score += 0.45
                elif in_snippet:
                    score += 0.20
                else:
                    # Penalize generic company articles that omit the person's name entirely
                    score -= 0.35

                if has_ind_kw:
                    score += 0.20

            return score

        # Sort candidate sources by priority score descending
        url_deduped.sort(key=compute_source_priority, reverse=True)

        # 4. Detect duplicate or syndicated coverage of the same underlying story
        # When duplicate coverage is detected, keep only the higher-ranked primary publication
        final_deduped: List[Dict[str, Any]] = []
        for candidate in url_deduped:
            cand_title = candidate.get("title", "")
            is_dup = False
            for accepted in final_deduped:
                acc_title = accepted.get("title", "")
                if are_syndicated_duplicates(cand_title, acc_title):
                    is_dup = True
                    logger.debug(
                        f"Detected syndicated duplicate coverage: '{cand_title[:50]}' "
                        f"matches '{acc_title[:50]}'. Retaining primary source."
                    )
                    break
            if not is_dup:
                final_deduped.append(candidate)

        # Assign 1-based citation IDs, preserving exact titles, URLs, and dates
        for idx, item in enumerate(final_deduped, start=1):
            item["id"] = idx

        dated_count = sum(1 for s in final_deduped if s.get("is_dated"))
        logger.info(
            f"Tavily search complete ({entity_type} mode). Total unique sources: {len(final_deduped)} "
            f"({dated_count} dated within window, {len(final_deduped) - dated_count} undated)."
        )
        return final_deduped


def test_tavily_connection() -> Dict[str, Any]:
    """
    Independent test for the Tavily API.
    """
    if not settings.TAVILY_API_KEY:
        return {"status": "unconfigured", "message": "TAVILY_API_KEY is not set in backend/.env"}

    try:
        service = TavilyService()
        results = service.search_query("artificial intelligence technology updates", max_results=2)
        return {
            "status": "connected",
            "results_count": len(results),
            "sample": results[0] if results else None,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
