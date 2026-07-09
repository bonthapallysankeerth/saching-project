from rapidfuzz import fuzz

from models.schemas import (
    AnalysisResult,
    AnalysisSummary,
    ChangeStatus,
    DetectedDiff,
    ReconciliationItem,
    RequestedChange,
    PageImage,
)
from services.parse_service import extract_numbers, normalize_number


def _values_match(a: str, b: str, tolerance: float = 0.05) -> bool:
    if not a or not b:
        return False
    try:
        fa, fb = float(normalize_number(a)), float(normalize_number(b))
        if fa == fb:
            return True
        return abs(fa - fb) / max(abs(fa), abs(fb), 0.001) < tolerance
    except ValueError:
        return normalize_number(a).lower() == normalize_number(b).lower()


def _match_score(request: RequestedChange, diff: DetectedDiff) -> float:
    desc_score = fuzz.token_set_ratio(request.description.lower(), diff.description.lower())

    attr_score = 0.0
    if request.attribute and diff.attribute:
        if request.attribute == diff.attribute:
            attr_score = 100.0
        elif request.attribute in diff.description.lower() or diff.attribute in request.description.lower():
            attr_score = 60.0

    value_score = 0.0
    if request.target_value and diff.new_value:
        if _values_match(request.target_value, diff.new_value):
            value_score = 100.0
        elif request.target_value in diff.description or diff.new_value in request.description:
            value_score = 70.0
    if request.old_value and diff.old_value:
        if _values_match(request.old_value, diff.old_value):
            value_score = max(value_score, 80.0)

    if request.target_value and diff.old_value and diff.new_value:
        if _values_match(request.old_value, diff.old_value) or _values_match(request.target_value, diff.new_value):
            value_score = max(value_score, 85.0)
        req_nums = extract_numbers(request.description)
        diff_nums = [diff.old_value, diff.new_value]
        for rn in req_nums:
            for dn in diff_nums:
                if dn and _values_match(rn, dn):
                    value_score = max(value_score, 75.0)

    symbol_score = 0.0
    if request.attribute == "symbol" or request.change_type == "symbol":
        if diff.attribute == "symbol" or "preliminary" in diff.description.lower():
            symbol_score = 90.0
        if "remove" in request.description.lower() and "remov" in diff.description.lower():
            symbol_score = 95.0

    combined = (
        desc_score * 0.30
        + attr_score * 0.25
        + value_score * 0.30
        + symbol_score * 0.15
    )

    req_words = set(request.description.lower().split())
    diff_words = set(diff.description.lower().split())
    stop = {"the", "a", "an", "in", "on", "at", "to", "from", "of", "and", "or", "is", "was", "change", "changed"}
    req_words -= stop
    diff_words -= stop
    if req_words and diff_words:
        overlap = len(req_words & diff_words) / max(len(req_words), 1)
        combined = combined * 0.8 + overlap * 100 * 0.2

    return round(combined, 1)


def _classify_status(
    request: RequestedChange,
    diff: DetectedDiff | None,
    score: float,
) -> tuple[ChangeStatus, str]:
    if not diff:
        return ChangeStatus.MISSING, "No matching change found in Rev A → Rev B diff."

    if request.target_value and diff.new_value:
        target_match = _values_match(request.target_value, diff.new_value)
        old_match = request.old_value and diff.old_value and _values_match(request.old_value, diff.old_value)

        if target_match and (old_match or not request.old_value):
            return ChangeStatus.IMPLEMENTED, (
                f"Requested {request.attribute or 'change'} to {request.target_value} — "
                f"found {diff.old_value or '?'} → {diff.new_value} in drawing. Correctly implemented."
            )
        if old_match and not target_match:
            return ChangeStatus.PARTIAL, (
                f"Change detected ({diff.old_value} → {diff.new_value}) but target was "
                f"{request.target_value}, not {diff.new_value}. Incorrectly implemented."
            )
        if not target_match and not old_match and score >= 50:
            return ChangeStatus.PARTIAL, (
                f"Related change found: {diff.description}. "
                f"Expected target value {request.target_value}."
            )

    if request.attribute == "symbol":
        if "remov" in diff.description.lower() and "remove" in request.description.lower():
            if "preliminary" in request.description.lower():
                return ChangeStatus.PARTIAL, (
                    "Revision notes claim preliminary symbol removed, but verify visually — "
                    "stamp may still be present on drawing."
                )
            return ChangeStatus.IMPLEMENTED, f"Symbol removal confirmed: {diff.description}"

    if score >= 70:
        return ChangeStatus.IMPLEMENTED, f"Matched: {diff.description} (score: {score}%)"
    if score >= 40:
        return ChangeStatus.PARTIAL, (
            f"Partial match: {diff.description} (score: {score}%). "
            "Change detected but may not fully match request."
        )

    return ChangeStatus.MISSING, "No matching change found in Rev A → Rev B diff."


def _is_revision_noise(diff: DetectedDiff) -> bool:
    desc = diff.description.lower()
    if diff.change_type == "text" and any(kw in desc for kw in ["manoj", "vijay", "jul 2026", "dec 2025"]):
        return True
    if desc.strip() in ("a", "a;", "a; a; a"):
        return True
    return False


def reconcile(
    requested: list[RequestedChange],
    detected: list[DetectedDiff],
) -> tuple[list[ReconciliationItem], AnalysisSummary]:
    reconciliation: list[ReconciliationItem] = []
    matched_diff_ids: set[str] = set()

    meaningful_diffs = [d for d in detected if not _is_revision_noise(d)]

    for req in requested:
        best_score = 0.0
        best_diff: DetectedDiff | None = None

        for diff in meaningful_diffs:
            if diff.id in matched_diff_ids:
                continue
            score = _match_score(req, diff)
            if score > best_score:
                best_score = score
                best_diff = diff

        status, evidence = _classify_status(req, best_diff if best_score >= 35 else None, best_score)

        if best_diff and status != ChangeStatus.MISSING:
            matched_diff_ids.add(best_diff.id)

        reconciliation.append(ReconciliationItem(
            id=req.id,
            request_description=req.description,
            status=status,
            confidence=best_score / 100,
            matched_diff=best_diff.description if best_diff else None,
            evidence=evidence,
            location=req.location or (best_diff.location if best_diff else ""),
            page=best_diff.page if best_diff else 1,
        ))

    unauthorized_id = len(requested) + 1
    for diff in meaningful_diffs:
        if diff.id not in matched_diff_ids:
            reconciliation.append(ReconciliationItem(
                id=unauthorized_id,
                request_description=None,
                status=ChangeStatus.UNAUTHORIZED,
                confidence=diff.confidence,
                matched_diff=diff.description,
                evidence=f"Change in drawing not requested: {diff.description} ({diff.change_type})",
                location=diff.location,
                page=diff.page,
            ))
            unauthorized_id += 1

    summary = AnalysisSummary(
        implemented=sum(1 for r in reconciliation if r.status == ChangeStatus.IMPLEMENTED),
        missing=sum(1 for r in reconciliation if r.status == ChangeStatus.MISSING),
        partial=sum(1 for r in reconciliation if r.status == ChangeStatus.PARTIAL),
        unauthorized=sum(1 for r in reconciliation if r.status == ChangeStatus.UNAUTHORIZED),
        total_requested=len(requested),
        total_diffs=len(meaningful_diffs),
    )

    return reconciliation, summary


def build_result(
    requested: list[RequestedChange],
    detected: list[DetectedDiff],
    page_images: list[dict],
    demo_mode: bool = False,
    notes: list[str] | None = None,
) -> AnalysisResult:
    reconciliation, summary = reconcile(requested, detected)
    return AnalysisResult(
        summary=summary,
        requested_changes=requested,
        detected_diffs=detected,
        reconciliation=reconciliation,
        page_images=[PageImage(**p) for p in page_images],
        demo_mode=demo_mode,
        processing_notes=notes or [],
    )
