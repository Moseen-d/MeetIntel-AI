"""
Integration test suite for the complete research workflow.
Verifies the validator, schema mapping, and end-to-end pipeline.
"""
import pytest
from backend.models import BriefRequest
from backend.services.briefing_pipeline import validate_and_clean_briefing

def test_validator_strips_sourceless_claims():
    """Ensure that claims without a source URL are rejected/stripped by validator."""
    raw = {
        "tldr": "Test executive summary.",
        "keyDevelopments": [
            {
                "headline": "Sourceless Claim",
                "summary": "This claim has no source.",
                "sources": [],
            },
            {
                "headline": "Valid Sourced Claim",
                "summary": "This claim has a valid source [1].",
                "sources": [{"title": "Reuters", "url": "https://reuters.com/news/123"}],
            },
        ],
    }
    sources = [{"id": 1, "title": "Reuters", "url": "https://reuters.com/news/123"}]

    cleaned = validate_and_clean_briefing(
        raw_briefing=raw,
        subject="Acme Corp",
        meeting_time="2024-11-10T10:00:00Z",
        sources=sources,
        is_low_data=False,
    )

    # The sourceless claim must be pruned
    headlines = [item.headline for item in cleaned.keyDevelopments]
    assert "Sourceless Claim" not in headlines
    assert "Valid Sourced Claim" in headlines

def test_validator_low_data_notice():
    """Ensure that sparse news outputs clean transparent zero-source notice."""
    raw = {"tldr": "Low data summary.", "keyDevelopments": []}
    cleaned = validate_and_clean_briefing(
        raw_briefing=raw,
        subject="Unknown Startup",
        meeting_time="2024-11-10T10:00:00Z",
        sources=[],
        is_low_data=True,
    )
    assert len(cleaned.keyDevelopments) > 0
    assert (
        "No verifiable sources found" in cleaned.keyDevelopments[0].headline
        or "No significant developments found" in cleaned.keyDevelopments[0].headline
    )

if __name__ == "__main__":
    print("Testing pipeline validator logic...")
    test_validator_strips_sourceless_claims()
    test_validator_low_data_notice()
    print("Validator tests passed successfully!")
