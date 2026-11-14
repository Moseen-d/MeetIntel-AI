import os
import re
import json
import time
import random
import logging
from typing import List, Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger("briefly.gemini")

ENGINEERING_KEYWORDS = {
    "engineer",
    "engineering",
    "software",
    "developer",
    "intern",
    "internship",
    "architect",
    "architecture",
    "infrastructure",
    "systems",
    "platform",
    "backend",
    "full stack",
    "frontend",
    "devops",
    "sre",
    "cuda",
    "gpu",
    "compiler",
    "scaling",
    "distributed",
    "distributed systems",
    "machine learning engineer",
    "ml engineer",
}

INTERVIEW_PURPOSE_KEYWORDS = {
    "interview",
    "job interview",
    "hiring",
    "recruitment",
    "technical interview",
    "coding interview",
    "internship interview",
}


def is_engineering_interview_context(context: Optional[str], purpose: Optional[str]) -> bool:
    """
    Detects whether the meeting context or purpose corresponds to a software
    engineering, technical internship, or architecture interview.
    """
    combined = f"{context or ''} {purpose or ''}".lower()
    if not combined.strip():
        return False

    has_purpose_match = any(kw in combined for kw in INTERVIEW_PURPOSE_KEYWORDS)
    has_tech_match = any(kw in combined for kw in ENGINEERING_KEYWORDS)

    return (has_purpose_match and has_tech_match) or has_tech_match


def is_transient_error(exc: Exception) -> bool:
    """
    Checks if an exception is a transient error suitable for retry
    (e.g., 503 Unavailable, 429 Rate Limit / Resource Exhausted, 5xx Server Error).
    """
    msg = str(exc).lower()
    transient_indicators = [
        "503",
        "unavailable",
        "high demand",
        "overloaded",
        "temporarily unavailable",
        "resource exhausted",
        "429",
        "quota",
        "rate limit",
        "deadline exceeded",
        "timed out",
        "connection reset",
        "500",
        "502",
        "504",
        "internal server error",
        "bad gateway",
        "gateway timeout",
    ]
    return any(indicator in msg for indicator in transient_indicators)


def clean_json_markdown(text: str) -> str:
    """
    Strips markdown code fences (```json ... ```) from LLM output.
    """
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text


class GeminiService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        fallback_model_name: Optional[str] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self.fallback_model_name = fallback_model_name or settings.GEMINI_FALLBACK_MODEL
        self.max_retries = max_retries or settings.GEMINI_MAX_RETRIES
        self.client = None
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                self._client = self.client
                logger.info(
                    f"Google GenAI Client initialized (Primary: {self.model_name}, "
                    f"Fallback: {self.fallback_model_name}, Retries: {self.max_retries})"
                )
            except ImportError:
                logger.error("google-genai SDK is not installed. Please install google-genai.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI Client: {e}")
        else:
            logger.warning("GEMINI_API_KEY is not set. GeminiService will raise error on generation.")

    def _call_model(
        self,
        model: str,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> str:
        """
        Executes a generate_content call using the official google-genai SDK.
        """
        config = {
            "response_mime_type": "application/json",
            "temperature": 0.2,
        }
        if system_instruction:
            config["system_instruction"] = system_instruction

        response = self.client.models.generate_content(
            model=model,
            contents=prompt,
            config=config,
        )

        if not response or not response.text:
            raise ValueError(f"Empty response received from Gemini model {model}.")
        return response.text

    def generate_json(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calls Gemini with automatic retry for transient errors (503, 429, 5xx)
        using exponential backoff and fallback to a secondary model if needed.
        """
        if not self.client:
            raise ValueError("Gemini client is not configured. Check GEMINI_API_KEY in backend/.env.")

        # Attempt with primary model first, then fallback model if primary experiences transient failure
        models_to_try = [self.model_name]
        if self.fallback_model_name and self.fallback_model_name != self.model_name:
            models_to_try.append(self.fallback_model_name)

        last_error = None

        for model_idx, current_model in enumerate(models_to_try):
            is_fallback = (model_idx > 0)
            if is_fallback:
                logger.warning(
                    f"Primary model {self.model_name} failed. Attempting fallback model {current_model}."
                )

            for attempt in range(1, self.max_retries + 1):
                try:
                    logger.info(
                        f"Calling Gemini model '{current_model}' (attempt {attempt}/{self.max_retries})..."
                    )
                    raw_text = self._call_model(
                        model=current_model,
                        prompt=prompt,
                        system_instruction=system_instruction,
                    )
                    cleaned = clean_json_markdown(raw_text)
                    return json.loads(cleaned)

                except Exception as e:
                    last_error = e
                    if is_transient_error(e) and attempt < self.max_retries:
                        backoff = min(1.0 * (2 ** (attempt - 1)), 8.0) + random.uniform(0.1, 0.4)
                        logger.warning(
                            f"Transient error on {current_model} attempt {attempt}: {e}. "
                            f"Retrying in {backoff:.2f}s..."
                        )
                        time.sleep(backoff)
                    else:
                        logger.error(
                            f"Error on {current_model} attempt {attempt}/{self.max_retries}: {e}"
                        )
                        if not is_transient_error(e):
                            # Non-retryable error (e.g. invalid argument, bad prompt), don't keep hammering
                            break

        # If all attempts and fallbacks fail, raise clear error
        raise RuntimeError(
            f"Gemini API request failed after {self.max_retries} attempts across models "
            f"{models_to_try}: {last_error}"
        )

    def plan_search_queries(
        self,
        subject: str,
        entity_type: str,
        context: Optional[str] = None,
        purpose: Optional[str] = None,
        research_window: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """
        Formulates 4-6 targeted search queries strictly bounded to the 30-day window.
        Defensively enforces Tavily topic values strictly to: 'news', 'general', or 'finance'.
        """
        is_person = (entity_type.lower() == "person")
        is_eng = is_engineering_interview_context(context, purpose)
        window_clause = f"covering the research window ({research_window})" if research_window else "covering the last 30 days"

        if is_person:
            system_instruction = (
                "You are an expert executive intelligence analyst. You are planning research where the "
                "PRIMARY SUBJECT IS AN INDIVIDUAL PERSON (not merely the company they lead or work for).\n"
                "Your objective is to discover facts about the individual: their career trajectory, current role "
                "and responsibilities, recent interviews, public statements, speeches, essays/podcasts, leadership decisions, "
                "and professional interests. Company developments should only be included if directly tied to this person.\n"
                "TAVILY API RESTRICTION: The 'topic' field for each query MUST be strictly one of: 'general', 'news', or 'finance'. "
                "Do NOT use arbitrary topic names."
            )
            focus_guidance = (
                f"The target subject is an individual person: {subject}. "
                f"Formulate 4-6 queries prioritizing: "
                f"1) {subject} recent interviews, podcasts, speeches, and public statements; "
                f"2) {subject} professional background, career history, education, and past roles; "
                f"3) {subject} current leadership responsibilities, documented executive decisions, and strategic direction; "
                f"4) {subject} published essays, articles, policy viewpoints, and professional interests. "
                "Ensure every query focuses explicitly on the person."
            )
        elif is_eng:
            system_instruction = (
                "You are an expert research planner. Formulate targeted search queries to find real, "
                "verifiable news, technical announcements, and public disclosures published within the specified research window.\n"
                "TAVILY API RESTRICTION: The 'topic' field for each query MUST be strictly one of: 'general', 'news', or 'finance'. "
                "Do NOT use arbitrary topic names like 'developer_tools' or 'architecture'."
            )
            focus_guidance = (
                "The user is interviewing or meeting regarding Software Engineering, Architecture, or Technical Internship. "
                "Formulate 4-6 queries targeting developer tools, platform announcements, infrastructure scaling, "
                "open source releases, SDKs, or hardware/software architecture updates, while setting 'topic' to 'news' or 'general'."
            )
        else:
            system_instruction = (
                "You are an expert research planner. Formulate targeted search queries to find real, "
                "verifiable news, technical announcements, and public disclosures published within the specified research window.\n"
                "TAVILY API RESTRICTION: The 'topic' field for each query MUST be strictly one of: 'general', 'news', or 'finance'. "
                "Do NOT use arbitrary topic names."
            )
            focus_guidance = (
                f"Formulate 4-6 queries targeting recent corporate announcements, product launches, "
                f"executive leadership changes, and strategic risks for {subject}."
            )

        prompt = f"""Target Subject: {subject}
Entity Type: {entity_type}
Meeting Context: {context or "None provided"}
Meeting Purpose: {purpose or "None provided"}
Research Window: {research_window or "Last 30 days"}

Instructions:
1. {focus_guidance}
2. All queries must be aimed at discovering information {window_clause}.
3. Queries should be concise (3-6 words each) and optimized for news indexing.
4. Output MUST be a valid JSON array of objects with keys:
   - "query": string (the exact search query)
   - "topic": string (MUST be strictly one of: "news", "general", "finance")

Example format:
[
  {{"query": "{subject} software architecture developer updates", "topic": "news"}},
  {{"query": "{subject} platform release announcements", "topic": "news"}},
  {{"query": "{subject} executive leadership statements", "topic": "news"}},
  {{"query": "{subject} strategic partnerships revenue", "topic": "finance"}}
]
"""
        try:
            result = self.generate_json(prompt=prompt, system_instruction=system_instruction)
            if isinstance(result, list):
                # Defensive check: guarantee topic is valid
                clean_queries = []
                for item in result:
                    if isinstance(item, dict) and item.get("query"):
                        t = item.get("topic", "news").lower()
                        if t not in {"general", "news", "finance"}:
                            t = "news"
                        clean_queries.append({"query": str(item["query"]).strip(), "topic": t})
                if clean_queries:
                    return clean_queries
            elif isinstance(result, dict) and "queries" in result and isinstance(result["queries"], list):
                clean_queries = []
                for item in result["queries"]:
                    if isinstance(item, dict) and item.get("query"):
                        t = item.get("topic", "news").lower()
                        if t not in {"general", "news", "finance"}:
                            t = "news"
                        clean_queries.append({"query": str(item["query"]).strip(), "topic": t})
                if clean_queries:
                    return clean_queries
        except Exception as e:
            logger.error(f"Failed to generate search queries via Gemini: {e}")

        # Fallback queries if LLM generation fails
        if is_person:
            return [
                {"query": f"{subject} interviews public statements speeches", "topic": "news"},
                {"query": f"{subject} career history background current role", "topic": "general"},
                {"query": f"{subject} leadership decisions executive actions", "topic": "news"},
                {"query": f"{subject} essays articles views perspectives", "topic": "general"},
            ]
        if is_eng:
            return [
                {"query": f"{subject} software architecture developer updates", "topic": "news"},
                {"query": f"{subject} engineering platform SDK release", "topic": "news"},
                {"query": f"{subject} infrastructure scaling challenges", "topic": "news"},
                {"query": f"{subject} technical systems announcements", "topic": "news"},
            ]
        return [
            {"query": f"{subject} latest news announcements", "topic": "news"},
            {"query": f"{subject} product launch updates", "topic": "news"},
            {"query": f"{subject} executive leadership statements", "topic": "news"},
            {"query": f"{subject} strategic business developments", "topic": "news"},
        ]

    def synthesize_briefing(
        self,
        subject: str,
        entity_type: str,
        meeting_time: str,
        context: Optional[str] = None,
        purpose: Optional[str] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
        research_start_date: Optional[str] = None,
        research_end_date: Optional[str] = None,
        is_low_data: bool = False,
    ) -> Dict[str, Any]:
        """
        Synthesizes a structured briefing strictly grounded in verified sources.
        Enforces that publication dates and URLs are never fabricated.
        """
        sources = sources or []
        window_desc = f"{research_start_date} to {research_end_date}"
        is_person = (entity_type.lower() == "person")
        is_eng = is_engineering_interview_context(context, purpose)

        # Prepare verified sources representation for prompt
        sources_text = ""
        if sources:
            sources_lines = []
            for s in sources:
                s_id = s.get("id")
                title = s.get("title", "Web Source")
                url = s.get("url", "")
                pub_date = s.get("published_date") or "Undated"
                snippet = s.get("snippet", "")
                sources_lines.append(
                    f"[{s_id}] Title: {title}\nURL: {url}\nPublished: {pub_date}\nSnippet: {snippet}\n"
                )
            sources_text = "\n".join(sources_lines)
        else:
            sources_text = "None. Zero verifiable sources were retrieved in the 30-day window."

        if not sources:
            if is_person:
                low_data_guidance = (
                    f"IMPORTANT: No verifiable sources were retrieved for {subject} "
                    f"in the selected research window ({window_desc}).\n"
                    "1. Do NOT create placeholder or fabricated citations.\n"
                    "2. Set 'sources': [] on all items.\n"
                    "3. In 'tldr', state: 'Unable to confidently identify verifiable public records for "
                    f"{subject} in the selected research window ({window_desc}). Please clarify the person\\'s full name, current organization, or title.'\n"
                    "4. In 'openQuestions', formulate clarifying questions to properly identify the person.\n"
                    "5. Do NOT silently research an unrelated person with a similar name."
                )
            else:
                low_data_guidance = (
                    f"IMPORTANT: No verifiable sources were retrieved for {subject} "
                    f"in the selected research window ({window_desc}).\n"
                    "1. Do NOT create placeholder or fabricated citations.\n"
                    "2. Set 'sources': [] on all items.\n"
                    "3. In 'tldr', state: 'No verifiable sources found in the selected research window ("
                    f"{window_desc}).'\n"
                    "4. Do NOT claim the absence of retrieved search results proves that no company news exists.\n"
                    "5. For 'talkingPoints' and 'openQuestions', you may provide thoughtful preparation questions "
                    "based on the meeting purpose, but make sure they are framed as preparation suggestions rather than verified findings."
                )
        elif is_low_data:
            low_data_guidance = (
                f"IMPORTANT: Only limited verifiable sources were retrieved for {subject} "
                f"in the selected research window ({window_desc}).\n"
                "Disclose this limitation in the TL;DR. Do NOT fill sections with old background knowledge or unverified rumors.\n"
                "Ground all developments strictly in the provided sources."
            )
        else:
            low_data_guidance = (
                f"Summarize verified developments published within the 30-day research window ({window_desc}). "
                "Every factual claim must cite only verified sources from the list by their exact URL and ID."
            )

        # Strict confidence scoring instructions applied across all modes
        confidence_rules = (
            "CONFIDENCE SCORING RULES (MANDATORY):\n"
            "- 'verified': Claim is independently corroborated by at least 2 independent, reputable sources with at least one dated source in the window. NEVER label a claim as verified if it only has 1 source or duplicate/syndicated reprints.\n"
            "- 'single-source': Claim is supported by exactly 1 dated source in the window.\n"
            "- 'uncertain': Conflicting reports, unconfirmed rumors, or claims relying strictly on undated sources.\n"
            "- 'unconfirmed': Unsupported claims or speculation."
        )

        is_job_interview = any(
            kw in f"{context or ''} {purpose or ''}".lower() for kw in INTERVIEW_PURPOSE_KEYWORDS
        )

        if is_person:
            system_instruction = (
                "You are an elite executive intelligence analyst for MeetIntel AI. You are preparing an executive dossier "
                "where the PRIMARY SUBJECT IS AN INDIVIDUAL PERSON (e.g., CEO, founder, researcher, executive).\n"
                "Your briefing must focus primarily on the person's identity, professional background, current role, "
                "recent public statements, interviews, speeches, published essays, documented leadership decisions, and professional interests.\n"
                "Company developments should only be included when directly relevant to this person's role or meeting context.\n"
                "You adhere strictly to source evidence: you NEVER invent dates, you NEVER fabricate citations, and you disclose limits transparently."
            )
            role_guidance = (
                f"PERSON-FOCUSED DOSSIER GUIDANCE FOR {subject.upper()}:\n"
                "1. Make the person's identity the primary research subject. Do NOT output a generic company overview.\n"
                "2. Prioritize:\n"
                "   - Professional background and career history (past roles, education, prior companies/research institutions).\n"
                "   - Current role, scope of responsibilities, and key co-founders/collaborators.\n"
                "   - Recent interviews, podcasts, speeches, published essays, and public statements.\n"
                "   - Publicly documented decisions and leadership activities.\n"
                "   - Relevant partnerships, public policy perspectives, and professional interests.\n"
                "3. Section mapping for Person Dossier:\n"
                "   - 'tldr': Concise executive profile synthesizing who the person is, their primary title/role, notable recent statements/essays, and current strategic focus.\n"
                "   - 'keyDevelopments': Recent public statements, interviews, speeches, published essays (e.g. 'Machines of Loving Grace'), or notable executive decisions within the research window.\n"
                "   - 'leadershipAndPeople': Professional background, career trajectory, prior positions, education, and key collaborators or co-founders.\n"
                "   - 'productsAndAnnouncements': Strategic initiatives, flagship models, or major organizational projects directly championed, presented, or announced by this individual.\n"
                "   - 'risksAndOpenUncertainties': Leadership pressures, public debates, governance tensions, or strategic challenges directly involving this person.\n"
                "   - 'talkingPoints': Actionable conversation points specifically tailored for speaking with THIS PERSON.\n"
                "   - 'openQuestions': Strategic, high-conviction questions to ask THIS PERSON.\n"
                f"{confidence_rules}\n"
                "4. IDENTITY VERIFICATION: If the person cannot be confidently identified from the retrieved sources, state so transparently in 'tldr' and request clarification in 'openQuestions'."
            )
        elif is_job_interview:
            system_instruction = (
                "You are an elite executive briefing analyst for MeetIntel AI. Your job is to produce a "
                "factually grounded, one-page pre-meeting brief for a job interview. You adhere strictly to source evidence: "
                "you NEVER invent dates, you NEVER fabricate URLs or source citations, and when evidence "
                "is absent, you disclose it transparently."
            )
            clean_ctx = (context or "").strip()
            if is_eng:
                role_guidance = (
                    f"JOB INTERVIEW CONTEXT: Technical / Software Engineering role indicated in context: '{clean_ctx}'.\n"
                    "1. Tailor 'talkingPoints' to technical architecture, developer platform updates, scaling considerations, "
                    "and engineering trade-offs directly relevant to this role.\n"
                    "2. Tailor 'openQuestions' to strategic technical, architecture, and team questions the candidate can ask the interviewers.\n"
                    f"{confidence_rules}"
                )
            elif clean_ctx and clean_ctx.lower() not in ("interview", "job interview", "none provided", "general", "none"):
                role_guidance = (
                    f"JOB INTERVIEW CONTEXT: Specific role indicated in context: '{clean_ctx}'.\n"
                    f"1. Adapt 'talkingPoints' to strategic priorities, functional competencies, and challenges relevant to this specific role.\n"
                    f"2. Adapt 'openQuestions' to high-conviction, role-specific questions the candidate can ask about team mandate, roadmap, and success metrics for this role.\n"
                    f"{confidence_rules}"
                )
            else:
                role_guidance = (
                    "JOB INTERVIEW CONTEXT: General job interview. NO SPECIFIC ROLE was provided in context.\n"
                    "CRITICAL: Avoid assuming any specific job function (do NOT assume software engineering, sales, or any specific position).\n"
                    "1. Tailor 'talkingPoints' to overall company strategy, growth trajectory, corporate culture, and recent public milestones.\n"
                    "2. Tailor 'openQuestions' to versatile, high-conviction questions about company trajectory, executive focus, team culture, and strategic priorities.\n"
                    f"{confidence_rules}"
                )
        else:
            system_instruction = (
                "You are an elite executive briefing analyst for MeetIntel AI. Your job is to produce a "
                "factually grounded, one-page pre-meeting brief. You adhere strictly to source evidence: "
                "you NEVER invent dates, you NEVER fabricate URLs or source citations, and when evidence "
                "is absent, you disclose it transparently."
            )
            role_guidance = (
                "Tailor 'talkingPoints' and 'openQuestions' to executive decision-making, strategic alignment, and business impact.\n"
                f"{confidence_rules}"
            )

        prompt = f"""SUBJECT: {subject}
ENTITY TYPE: {entity_type}
MEETING TIME: {meeting_time}
MEETING CONTEXT: {context or "None provided"}
MEETING PURPOSE: {purpose or "None provided"}
RESEARCH WINDOW: {window_desc}

DATA GUIDANCE:
{low_data_guidance}

ROLE & SECTION GUIDANCE:
{role_guidance}

RETRIEVED RESEARCH SOURCES (Verify dates and cross-corroborate before claiming verified):
{sources_text}

JSON OUTPUT REQUIREMENTS:
Produce a valid JSON object matching the following structure:
{{
  "tldr": "Concise executive summary (under 4 sentences). If entity_type is 'person', summarize who they are, their role, primary recent statements, and strategic focus.",
  "keyDevelopments": [
    {{
      "headline": "Brief headline (under 12 words)",
      "summary": "Specific development or statement grounded strictly in sources, with inline citation like [1].",
      "date": "Exact date from source (YYYY-MM-DD) or 'Undated'",
      "confidence": "verified" | "single-source" | "uncertain",
      "sources": [
        {{"id": 1, "title": "Source title", "url": "https://..."}}
      ]
    }}
  ],
  "leadershipAndPeople": [
    {{
      "headline": "Role / Career History",
      "summary": "Professional background, prior roles, credentials, and key collaborators with inline citation like [1].",
      "date": "Exact date or 'Undated'",
      "confidence": "verified" | "single-source" | "uncertain",
      "sources": [{{"id": 1, "title": "Source title", "url": "https://..."}}]
    }}
  ],
  "productsAndAnnouncements": [
    {{
      "headline": "Strategic Initiative / Announcement",
      "summary": "Key project, model, or initiative directly championed or led by the subject with inline citation like [1].",
      "date": "Exact date or 'Undated'",
      "confidence": "verified" | "single-source" | "uncertain",
      "sources": [{{"id": 1, "title": "Source title", "url": "https://..."}}]
    }}
  ],
  "risksAndOpenUncertainties": [
    {{
      "headline": "Challenge / Public Debate",
      "summary": "Strategic debate, regulatory inquiry, or leadership pressure involving the subject with inline citation like [1].",
      "date": "Exact date or 'Undated'",
      "confidence": "verified" | "single-source" | "uncertain",
      "sources": [{{"id": 1, "title": "Source title", "url": "https://..."}}]
    }}
  ],
  "talkingPoints": [
    "High-leverage conversation points tailored for this meeting"
  ],
  "openQuestions": [
    "High-conviction questions to ask during the meeting"
  ]
}}

CRITICAL ACCURACY & CONCISENESS RULES:
- Limit keyDevelopments to 3-5 high-signal, strategically impactful items.
- Every development summary MUST have supporting source attribution with an inline source bracket like [1] or [2], and the corresponding source must be listed in "sources".
- Never label a claim as "verified" unless at least 2 independent reputable sources corroborate it with a dated source within the research window. If only 1 source, label as "single-source".
- If zero sources were provided, keyDevelopments, leadershipAndPeople, productsAndAnnouncements, and risksAndOpenUncertainties MUST have "sources": [].
- Never cite "https://tavily.com" or invent placeholder URLs.
- Never invent dates, quotes, financial figures, professional history, or citations.
- Output ONLY the JSON object.
"""
        return self.generate_json(prompt=prompt, system_instruction=system_instruction)


def test_gemini_connection() -> Dict[str, Any]:
    """
    Independent test for Google Gemini API.
    """
    if not settings.GEMINI_API_KEY:
        return {"status": "unconfigured", "message": "GEMINI_API_KEY is not set in backend/.env"}

    try:
        service = GeminiService()
        res = service.generate_json("Generate a JSON object with a 'greeting' message and a 'status': 'ok'")
        return {"status": "connected", "response": res}
    except Exception as e:
        return {"status": "error", "message": str(e)}
