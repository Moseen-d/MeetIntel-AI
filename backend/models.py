from typing import Literal, Optional
from pydantic import BaseModel, Field

class BriefRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100, description="Target company or person name")
    type: Literal["company", "person"] = Field("company", description="Entity type: company or person")
    meetingTime: str = Field(..., description="ISO meeting timestamp or date string")
    context: Optional[str] = Field("", max_length=500, description="Optional meeting context or goals")
    purpose: Optional[str] = Field(None, max_length=200, description="Optional meeting purpose (e.g. Job Interview)")

class SourceCitation(BaseModel):
    id: Optional[int] = None
    title: str = "Web Source"
    url: str
    date: str = ""

class BriefItem(BaseModel):
    headline: str
    summary: str
    date: str = ""
    confidence: Literal["verified", "single-source", "uncertain", "unconfirmed"] = "single-source"
    sources: list[SourceCitation] = Field(default_factory=list)

class BriefingResponse(BaseModel):
    subject: str
    meetingTime: str
    tldr: str
    keyDevelopments: list[BriefItem] = Field(default_factory=list)
    leadershipAndPeople: list[BriefItem] = Field(default_factory=list)
    productsAndAnnouncements: list[BriefItem] = Field(default_factory=list)
    risksAndOpenUncertainties: list[BriefItem] = Field(default_factory=list)
    talkingPoints: list[str] = Field(default_factory=list)
    openQuestions: list[str] = Field(default_factory=list)
    sources: list[SourceCitation] = Field(default_factory=list)
    generatedAt: Optional[str] = None
    coverageNote: str = "Covers the last 30 days"
    isLowData: bool = False

class PipelineEvent(BaseModel):
    stage: str
    message: str
    progress: Optional[int] = None
    data: Optional[dict] = None
    error: Optional[str] = None
