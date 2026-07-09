from fastapi import APIRouter, File, Form, UploadFile

from models.schemas import AnalysisResult
from services.demo_service import get_demo_result
from services.diff_service import compare_pdfs
from services.parse_service import parse_change_request
from services.markup_service import parse_markup_pdf
from services.pdf_service import pdf_to_numpy, pdf_to_page_images
from services.reconcile_service import build_result

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_revisions(
    rev_a: UploadFile | None = File(None),
    rev_b: UploadFile | None = File(None),
    change_request_text: str = Form(""),
    change_request_file: UploadFile | None = File(None),
    demo: bool = Form(False),
):
    if demo:
        return get_demo_result()

    notes: list[str] = []

    if not rev_a or not rev_b:
        return get_demo_result()

    rev_a_bytes = await rev_a.read()
    rev_b_bytes = await rev_b.read()

    notes.append(f"Rendered Rev A ({rev_a.filename}) and Rev B ({rev_b.filename}).")

    pages_a = pdf_to_page_images(rev_a_bytes)
    pages_b = pdf_to_page_images(rev_b_bytes)
    arrays_a = pdf_to_numpy(rev_a_bytes)
    arrays_b = pdf_to_numpy(rev_b_bytes)

    notes.append(f"Rev A: {len(pages_a)} page(s), Rev B: {len(pages_b)} page(s).")

    detected_diffs, page_images = compare_pdfs(pages_a, pages_b, arrays_a, arrays_b)
    notes.append(f"Detected {len(detected_diffs)} meaningful change(s) between revisions.")

    requested_changes = []
    if change_request_text.strip():
        requested_changes = parse_change_request(change_request_text)
        notes.append(f"Parsed {len(requested_changes)} item(s) from change request text.")
    elif change_request_file:
        markup_bytes = await change_request_file.read()
        markup_arrays = pdf_to_numpy(markup_bytes)
        requested_changes = parse_markup_pdf(
            markup_bytes,
            baseline_bytes=rev_a_bytes,
            markup_arrays=markup_arrays,
            baseline_arrays=arrays_a,
        )
        notes.append(
            f"Parsed {len(requested_changes)} item(s) from markup PDF "
            f"(text-block comparison + red annotation detection)."
        )
    else:
        notes.append("No change request provided — showing diff-only results.")

    if not requested_changes:
        notes.append("Tip: paste an ECO/email or upload a marked-up PDF to enable reconciliation.")

    return build_result(
        requested=requested_changes,
        detected=detected_diffs,
        page_images=page_images,
        demo_mode=False,
        notes=notes,
    )


@router.get("/health")
async def health():
    return {"status": "ok", "engine": "DrawCheck Free MVP v2"}
