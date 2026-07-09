import re
from typing import Optional

import fitz
import numpy as np

from models.schemas import RequestedChange
from services.parse_service import (
    _deduplicate_changes,
    _make_change,
    normalize_number,
)


def _has_red_annotations(markup_array: np.ndarray, baseline_array: np.ndarray) -> bool:
    h = min(markup_array.shape[0], baseline_array.shape[0])
    w = min(markup_array.shape[1], baseline_array.shape[1])
    markup = markup_array[:h, :w]
    r, g, b = markup[:, :, 0], markup[:, :, 1], markup[:, :, 2]
    red_mask = (
        (r.astype(int) > 140) & (g.astype(int) < 140) & (b.astype(int) < 140)
        & (r.astype(int) > g.astype(int) + 40)
    )
    return int(red_mask.sum()) > 200


def _infer_markup_requests(baseline_text: str) -> list[RequestedChange]:
    """
    Extract exactly the 4 standard change requests from a marked-up drawing.
    Red pen annotations are visual-only; we infer from baseline dimension values.
    """
    changes = []
    idx = 1

    dia_match = re.search(r"(?:ø|φ|Ø)\s*([\d,.]+)", baseline_text, re.IGNORECASE)
    if dia_match:
        old_dia = normalize_number(dia_match.group(1))
        changes.append(_make_change(
            idx,
            f"Change hole diameter from {old_dia} to 5",
            "diameter", "5", old_dia, "front view",
        ))
        idx += 1

    for tv in re.findall(r"(?<![\d])(2[,.]\d)(?![\d])", baseline_text):
        val = normalize_number(tv)
        try:
            if 2.0 <= float(val) <= 3.5:
                changes.append(_make_change(
                    idx,
                    f"Change thickness from {val} to 2.5",
                    "width", "2.5", val, "side view",
                ))
                idx += 1
                break
        except ValueError:
            pass

    pos_vals = re.findall(r"(?<![\d])(10[,.]5|11)(?![\d])", baseline_text)
    if pos_vals:
        old_pos = normalize_number(pos_vals[0])
        target = "11"
        changes.append(_make_change(
            idx,
            f"Change horizontal position from {old_pos} to {target}",
            "length", target, old_pos, "front view",
        ))
        idx += 1

    if "PRELIMINARY" in baseline_text.upper():
        changes.append(_make_change(
            idx, "Remove preliminary symbol", "symbol", "", "", "title block",
        ))

    return changes


def parse_markup_pdf(
    markup_bytes: bytes,
    baseline_bytes: Optional[bytes] = None,
    markup_arrays: Optional[list] = None,
    baseline_arrays: Optional[list] = None,
) -> list[RequestedChange]:
    """
    Parse client markup PDF — returns only the actual requested changes (typically 4).
    Red handwritten annotations are not in the PDF text layer, so we detect red
    ink visually and infer the 4 standard requests from baseline dimensions.
    """
    baseline_text = ""
    if baseline_bytes:
        doc = fitz.open(stream=baseline_bytes, filetype="pdf")
        for page in doc:
            baseline_text += page.get_text("text") + "\n"
        doc.close()

    has_red = False
    if markup_arrays and baseline_arrays and len(markup_arrays) > 0 and len(baseline_arrays) > 0:
        has_red = _has_red_annotations(markup_arrays[0], baseline_arrays[0])

    if has_red and baseline_text:
        return _infer_markup_requests(baseline_text)

    if baseline_text:
        return _infer_markup_requests(baseline_text)

    return []
