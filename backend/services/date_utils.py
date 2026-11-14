"""
Date utilities for MeetIntel AI research window calculations and source date validation.
"""
from datetime import datetime, timezone, timedelta, time
from typing import Optional, Tuple
import re
import logging

logger = logging.getLogger("briefly.date_utils")

# Default application timezone: Asia/Kolkata (IST: UTC+05:30)
DEFAULT_TIMEZONE = timezone(timedelta(hours=5, minutes=30), name="IST")

try:
    from zoneinfo import ZoneInfo
    KOLKATA_TZ = ZoneInfo("Asia/Kolkata")
except Exception:
    KOLKATA_TZ = DEFAULT_TIMEZONE

def parse_datetime_flexible(dt_str: str) -> datetime:
    """
    Parses an ISO date string or flexible date formats into a timezone-aware datetime.
    When no timezone is specified, consistently uses Asia/Kolkata (IST: UTC+05:30).
    """
    if not dt_str or not isinstance(dt_str, str):
        raise ValueError("Date string is required")
    
    cleaned = dt_str.strip()
    # Check if explicit timezone indicator exists (e.g. 'Z', '+05:30', '-05:00')
    has_tz = cleaned.endswith("Z") or bool(re.search(r"[+-]\d{2}:\d{2}$", cleaned))

    try:
        iso_str = cleaned.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=KOLKATA_TZ)
        return dt
    except Exception:
        pass

    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
    ):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.replace(tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    raise ValueError(f"Unable to parse date string: {dt_str}")


def calculate_research_window(
    meeting_time_str: str,
    now: Optional[datetime] = None
) -> Tuple[datetime, datetime, str, str]:
    """
    Calculates the strict 30-day research window based on the meeting time:
    1. Research start date = 30 days before the meeting date (in the meeting's local timezone).
    2. Research end date = earlier of the meeting date and current date (now).

    Returns:
    (start_dt, end_dt, start_date_str, end_date_str) with dates formatted as YYYY-MM-DD.
    """
    meeting_dt = parse_datetime_flexible(meeting_time_str)
    target_tz = meeting_dt.tzinfo or KOLKATA_TZ

    if now is None:
        now = datetime.now(target_tz)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=target_tz)
    else:
        # Align now with the meeting's intended timezone
        now = now.astimezone(target_tz)

    # 1. 30 days before meeting date
    start_dt = meeting_dt - timedelta(days=30)

    # 2. Earlier of meeting date and current date
    end_dt = min(meeting_dt, now)

    start_date_str = start_dt.strftime("%Y-%m-%d")
    end_date_str = end_dt.strftime("%Y-%m-%d")

    return start_dt, end_dt, start_date_str, end_date_str


def parse_source_publication_date(date_str: Optional[str]) -> Optional[datetime]:
    """
    Attempts to parse a source's publication date string.
    Returns a UTC datetime if reliably identified, otherwise None.
    """
    if not date_str or not isinstance(date_str, str):
        return None

    cleaned = date_str.strip()
    if not cleaned or cleaned.lower() in ("none", "null", "undated", "unknown", "n/a", "last 30 days"):
        return None

    # 1. ISO format
    try:
        iso_str = cleaned.replace("Z", "+00:00")
        dt = datetime.fromisoformat(iso_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass

    # 2. RFC 2822 (e.g. 'Wed, 02 Nov 2026 14:32:00 GMT')
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        pass

    # 3. Standard date string patterns
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%B %d, %Y",
        "%b %d, %Y",
        "%d %B %Y",
        "%d %b %Y",
    ):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            pass

    return None


def validate_source_date(
    date_str: Optional[str],
    start_dt: datetime,
    end_dt: datetime
) -> Tuple[bool, str, bool]:
    """
    Independently validates a source's publication date against the research window [start_dt, end_dt].

    Returns:
    (is_valid, date_display_str, is_dated)
    - is_valid: True if source should be included, False if outside window (Requirement 5).
    - date_display_str: 'YYYY-MM-DD' if dated, or 'Undated' if no reliable date (Requirement 7).
    - is_dated: True if verified date within window, False if undated.
    """
    pub_dt = parse_source_publication_date(date_str)

    if pub_dt is not None:
        # Full calendar day boundaries for date-level comparisons
        start_boundary = datetime.combine(start_dt.date(), time.min).replace(tzinfo=timezone.utc)
        end_boundary = datetime.combine(end_dt.date(), time.max).replace(tzinfo=timezone.utc)

        if pub_dt < start_boundary or pub_dt > end_boundary:
            # Exclude sources outside the required research window (Requirement 5)
            logger.debug(f"Date {pub_dt} outside research window [{start_boundary}, {end_boundary}]")
            return False, pub_dt.strftime("%Y-%m-%d"), True

        # Valid and inside window
        return True, pub_dt.strftime("%Y-%m-%d"), True

    # No reliable publication date -> Mark as Undated (Requirement 7)
    return True, "Undated", False

