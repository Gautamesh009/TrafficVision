from datetime import datetime

from pydantic import BaseModel, Field


class ChallanReview(BaseModel):
    status: str
    notes: str | None = None


class ChallanOut(BaseModel):
    id: str
    image: str
    type: str
    location: str
    ward: str
    zone: str
    status: str
    plate: str
    time: str
    fine: int
    conf: float
    detected_at: datetime


class ViolationOut(BaseModel):
    id: int
    type: str
    plate: str
    confidence: float
    detected_at: datetime
    location: str
    ward: str
    zone: str
    model_version: str
    challan_status: str | None = None
    evidence: list[str] = Field(default_factory=list)


class JobOut(BaseModel):
    id: int
    source_file: str
    status: str
    created_at: datetime
    updated_at: datetime
    result_summary: str | None = None


class AnalyticsSummary(BaseModel):
    total_violations: int
    pending_challans: int
    approved_challans: int
    rejected_challans: int


class HealthResponse(BaseModel):
    status: str
