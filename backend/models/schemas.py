from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ChangeStatus(str, Enum):
    IMPLEMENTED = "implemented"
    MISSING = "missing"
    PARTIAL = "partial"
    UNAUTHORIZED = "unauthorized"


class DetectedDiff(BaseModel):
    id: str
    description: str
    location: str = ""
    change_type: str = "visual"
    page: int = 1
    confidence: float = 0.0
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    attribute: Optional[str] = None


class RequestedChange(BaseModel):
    id: int
    description: str
    location: str = ""
    target_value: Optional[str] = None
    old_value: Optional[str] = None
    attribute: Optional[str] = None
    change_type: str = "general"


class ReconciliationItem(BaseModel):
    id: int
    request_description: Optional[str] = None
    status: ChangeStatus
    confidence: float = 0.0
    matched_diff: Optional[str] = None
    evidence: str = ""
    location: str = ""
    page: int = 1


class AnalysisSummary(BaseModel):
    implemented: int = 0
    missing: int = 0
    partial: int = 0
    unauthorized: int = 0
    total_requested: int = 0
    total_diffs: int = 0


class PageImage(BaseModel):
    page: int
    rev_a: str = ""
    rev_b: str = ""
    diff_overlay: str = ""


class AnalysisResult(BaseModel):
    summary: AnalysisSummary
    requested_changes: list[RequestedChange] = Field(default_factory=list)
    detected_diffs: list[DetectedDiff] = Field(default_factory=list)
    reconciliation: list[ReconciliationItem] = Field(default_factory=list)
    page_images: list[PageImage] = Field(default_factory=list)
    demo_mode: bool = False
    processing_notes: list[str] = Field(default_factory=list)
