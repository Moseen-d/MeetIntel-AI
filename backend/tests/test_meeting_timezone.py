import pytest
from datetime import datetime, timezone, timedelta
from backend.services.date_utils import calculate_research_window, parse_datetime_flexible, DEFAULT_TIMEZONE

def test_meeting_date_9_november_2026_4_30_am_ist():
    """
    Test user requirement:
    - Select 9 November 2026, 4:30 AM IST.
    - Confirm the backend receives the intended time: 2026-11-09T04:30:00+05:30
    - Verify the 30-day research window calculation using the correct meeting date (9 November 2026).
    """
    meeting_time = "2026-11-09T04:30:00+05:30"
    
    # 1. Parse meeting time and check timezone
    dt = parse_datetime_flexible(meeting_time)
    assert dt.year == 2026
    assert dt.month == 11
    assert dt.day == 9
    assert dt.hour == 4
    assert dt.minute == 30
    # Offset must be +05:30
    offset_seconds = dt.utcoffset().total_seconds()
    assert offset_seconds == 19800  # 5.5 hours * 3600

    # 2. Case A: Meeting is today / same day (November 9, 2026 IST)
    # The meeting date is 9 November 2026.
    # 30 days before 9 November 2026 is 10 October 2026.
    now_same_day = datetime(2026, 11, 9, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    start_dt, end_dt, start_str, end_str = calculate_research_window(meeting_time, now=now_same_day)

    assert start_str == "2026-10-10"
    assert end_str == "2026-11-09"
    assert (end_dt.date() - start_dt.date()).days == 30

    # 3. Case B: Meeting is in the future (e.g. today is 8 November 2026, 22:30 IST)
    now_prev_day = datetime(2026, 11, 8, 22, 30, 0, tzinfo=DEFAULT_TIMEZONE)
    start_dt, end_dt, start_str, end_str = calculate_research_window(meeting_time, now=now_prev_day)

    # Start date is still anchored to the meeting date: 30 days before Nov 9 is Oct 10
    assert start_str == "2026-10-10"
    # End date is earlier of meeting and now (Nov 8)
    assert end_str == "2026-11-08"

def test_unspecified_timezone_defaults_to_asia_kolkata():
    """
    Requirement 3: Use the meeting's intended local timezone consistently.
    For this application, use Asia/Kolkata when no other timezone is specified.
    """
    bare_meeting_time = "2026-11-09T04:30:00"
    dt = parse_datetime_flexible(bare_meeting_time)

    assert dt.year == 2026
    assert dt.month == 11
    assert dt.day == 9
    assert dt.hour == 4
    assert dt.minute == 30
    assert dt.utcoffset().total_seconds() == 19800  # +05:30 (IST)

