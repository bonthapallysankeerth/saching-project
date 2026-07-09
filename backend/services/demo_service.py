from models.schemas import (
    AnalysisResult,
    AnalysisSummary,
    ChangeStatus,
    DetectedDiff,
    PageImage,
    ReconciliationItem,
    RequestedChange,
)


def get_demo_result() -> AnalysisResult:
    """Return a polished demo result for hackathon presentation."""
    requested = [
        RequestedChange(id=1, description="Increase bore diameter from 10mm to 12mm", location="Section A-A"),
        RequestedChange(id=2, description="Add M6 tapped hole at top-left corner", location="Top view"),
        RequestedChange(id=3, description="Update material specification to 6061-T6 Aluminum", location="Title block"),
        RequestedChange(id=4, description="Change surface finish from Ra 3.2 to Ra 1.6", location="General notes"),
        RequestedChange(id=5, description="Add deburr note: DEBURR ALL EDGES", location="General notes"),
    ]

    detected = [
        DetectedDiff(id="d1", description="Dimension changed: 10mm → 12mm", location="Section A-A", change_type="dimension", page=1, confidence=0.92),
        DetectedDiff(id="d2", description="Visual change detected (2.3% of page modified)", location="top-left area", change_type="visual", page=1, confidence=0.78),
        DetectedDiff(id="d3", description="Text changed: 'AL 6061' → '6061-T6 ALUMINUM'", location="Page 1", change_type="text", page=1, confidence=0.88),
        DetectedDiff(id="d4", description="Text added: 'DEBURR ALL EDGES'", location="Page 1", change_type="text", page=1, confidence=0.85),
        DetectedDiff(id="d5", description="Visual change detected (1.1% of page modified)", location="bottom-right area", change_type="visual", page=1, confidence=0.71),
        DetectedDiff(id="d6", description="Text changed: 'Rev A' → 'Rev B'", location="Page 1", change_type="text", page=1, confidence=0.95),
    ]

    reconciliation = [
        ReconciliationItem(id=1, request_description="Increase bore diameter from 10mm to 12mm", status=ChangeStatus.IMPLEMENTED, confidence=0.92, matched_diff="Dimension changed: 10mm → 12mm", evidence="Exact dimension match found in Section A-A (score: 92%)", location="Section A-A", page=1),
        ReconciliationItem(id=2, request_description="Add M6 tapped hole at top-left corner", status=ChangeStatus.PARTIAL, confidence=0.58, matched_diff="Visual change detected (2.3% of page modified)", evidence="Visual change in top-left area but M6 specification not confirmed in text diff.", location="Top view", page=1),
        ReconciliationItem(id=3, request_description="Update material specification to 6061-T6 Aluminum", status=ChangeStatus.IMPLEMENTED, confidence=0.88, matched_diff="Text changed: 'AL 6061' → '6061-T6 ALUMINUM'", evidence="Material spec updated in title block (score: 88%)", location="Title block", page=1),
        ReconciliationItem(id=4, request_description="Change surface finish from Ra 3.2 to Ra 1.6", status=ChangeStatus.MISSING, confidence=0.12, matched_diff=None, evidence="No matching change found in Rev A → Rev B diff.", location="General notes", page=1),
        ReconciliationItem(id=5, request_description="Add deburr note: DEBURR ALL EDGES", status=ChangeStatus.IMPLEMENTED, confidence=0.85, matched_diff="Text added: 'DEBURR ALL EDGES'", evidence="Deburr note found in general notes (score: 85%)", location="General notes", page=1),
        ReconciliationItem(id=6, request_description=None, status=ChangeStatus.UNAUTHORIZED, confidence=0.71, matched_diff="Visual change detected (1.1% of page modified)", evidence="Unauthorized: change in bottom-right area with no matching request entry.", location="bottom-right area", page=1),
    ]

    summary = AnalysisSummary(
        implemented=3,
        missing=1,
        partial=1,
        unauthorized=1,
        total_requested=5,
        total_diffs=6,
    )

    return AnalysisResult(
        summary=summary,
        requested_changes=requested,
        detected_diffs=detected,
        reconciliation=reconciliation,
        page_images=[],
        demo_mode=True,
        processing_notes=[
            "Demo mode: showing sample reconciliation results.",
            "Upload real PDFs to run the live diff engine.",
        ],
    )
