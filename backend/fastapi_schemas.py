from datetime import datetime
from pydantic import BaseModel


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


class HealthResponse(BaseModel):
    status: str
