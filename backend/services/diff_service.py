import re
import uuid
from difflib import SequenceMatcher

import numpy as np
from PIL import Image, ImageDraw

from models.schemas import DetectedDiff
from services.parse_service import detect_attribute, extract_numbers, normalize_number
from services.pdf_service import numpy_to_b64, resize_to_match

NOISE_PATTERNS = [
    re.compile(r"^[A-Z];?\s*[A-Z];?\s*[A-Z]$"),
    re.compile(r"^(MANOJ|VIJAY|\d{1,2}\s+\w{3}\s+\d{4})$", re.IGNORECASE),
]

METADATA_PATTERNS = [
    re.compile(r"MFG\s*PART", re.I),
    re.compile(r"MATERIAL\s*:", re.I),
    re.compile(r"SUPPLIER\s*:", re.I),
    re.compile(r"PAINT\s*:", re.I),
    re.compile(r"SCALE\s", re.I),
    re.compile(r"DRW|CHK|DATE", re.I),
]


def _is_noise_diff(description: str) -> bool:
    for pat in NOISE_PATTERNS:
        if pat.search(description.strip()):
            return True
    if description.strip() in ("A", "A;", "A; A", "A; A; A"):
        return True
    return False


def _is_valid_dimension(val: str) -> bool:
    try:
        f = float(normalize_number(val))
        if f in (2025, 2026, 72, 1111, 4000, 4.0):
            return False
        return 0.1 <= f <= 200
    except ValueError:
        return False


def _compute_diff_overlay(img_a: np.ndarray, img_b: np.ndarray) -> tuple[np.ndarray, list[dict], float]:
    h = max(img_a.shape[0], img_b.shape[0])
    w = max(img_a.shape[1], img_b.shape[1])
    a = resize_to_match(img_a, h, w)
    b = resize_to_match(img_b, h, w)

    gray_a = np.mean(a, axis=2).astype(np.float32)
    gray_b = np.mean(b, axis=2).astype(np.float32)
    diff = np.abs(gray_a - gray_b)
    mask = diff > 25

    changed_pixels = int(mask.sum())
    total_pixels = h * w
    change_pct = changed_pixels / total_pixels if total_pixels else 0

    overlay = b.copy()
    overlay[mask] = np.clip(
        overlay[mask].astype(int) * 0.5 + np.array([255, 60, 60]) * 0.5, 0, 255
    ).astype(np.uint8)

    regions = []
    if change_pct > 0.005:
        ys, xs = np.where(mask)
        if len(xs) > 0:
            x1, x2 = int(xs.min()), int(xs.max())
            y1, y2 = int(ys.min()), int(ys.max())
            pil_overlay = Image.fromarray(overlay)
            draw = ImageDraw.Draw(pil_overlay)
            draw.rectangle([x1, y1, x2, y2], outline=(255, 60, 60), width=3)
            overlay = np.array(pil_overlay)
            regions.append({
                "x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1,
                "area_pct": round(change_pct * 100, 2),
            })

    return overlay, regions, 1.0 - change_pct


def _describe_region_location(region: dict, page_w: int, page_h: int) -> str:
    cx = region["x"] + region["w"] / 2
    cy = region["y"] + region["h"] / 2
    h_pos = "left" if cx < page_w * 0.33 else "right" if cx > page_w * 0.66 else "center"
    v_pos = "top" if cy < page_h * 0.33 else "bottom" if cy > page_h * 0.66 else "center"
    if h_pos == "center" and v_pos == "center":
        return "center of drawing"
    return f"{v_pos}-{h_pos} area"


def _extract_typed_dimensions(text: str) -> dict[str, str]:
    """Extract known engineering dimensions from drawing text."""
    dims = {}
    m = re.search(r"(?:ø|φ|Ø)\s*([\d,.]+)", text, re.IGNORECASE)
    if m:
        dims["diameter"] = normalize_number(m.group(1))
    for m in re.finditer(r"(?<![\d])(2[,.]\d)(?![\d])", text):
        val = normalize_number(m.group(1))
        try:
            if 2.0 <= float(val) <= 3.5:
                dims["width"] = val
                break
        except ValueError:
            pass
    for m in re.finditer(r"(?<![\d])(10[,.]5|11)(?![\d])", text):
        dims.setdefault("length", normalize_number(m.group(1)))
    m = re.search(r"\bR([\d,.]+)\s*\(", text, re.IGNORECASE)
    if m:
        dims["radius"] = normalize_number(m.group(1))
    return dims


def _classify_value_attr(old_v: str, new_v: str, context: str) -> str:
    """Classify a numeric change by value range and context."""
    ctx_attr = detect_attribute(context)
    if ctx_attr != "general":
        return ctx_attr
    try:
        vals = [float(normalize_number(old_v)), float(normalize_number(new_v))]
        avg = sum(vals) / 2
        if 4 <= avg <= 7:
            return "diameter"
        if 2 <= avg <= 3.5:
            return "width"
        if 9 <= avg <= 15:
            return "length"
    except ValueError:
        pass
    return "general"
    """Compare line-by-line and extract only paired number changes."""
    pairs = []
    lines_a = [l.strip() for l in text_a.splitlines() if l.strip()]
    lines_b = [l.strip() for l in text_b.splitlines() if l.strip()]
    matcher = SequenceMatcher(None, lines_a, lines_b)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag not in ("replace", "delete", "insert"):
            continue
        old_text = " ".join(lines_a[i1:i2]) if tag != "insert" else ""
        new_text = " ".join(lines_b[j1:j2]) if tag != "delete" else ""
        combined = old_text + " " + new_text

        if any(p.search(combined) for p in METADATA_PATTERNS):
            continue

        old_nums = [n for n in extract_numbers(old_text) if _is_valid_dimension(n)]
        new_nums = [n for n in extract_numbers(new_text) if _is_valid_dimension(n)]

        if old_nums and new_nums:
            if len(old_nums) == len(new_nums):
                for o, n in zip(old_nums, new_nums):
                    if o != n:
                        attr = _classify_value_attr(o, n, combined)
                        if attr != "general":
                            pairs.append((o, n, attr))
            elif len(old_nums) == 1 and len(new_nums) == 1:
                if old_nums[0] != new_nums[0]:
                    attr = _classify_value_attr(old_nums[0], new_nums[0], combined)
                    if attr != "general":
                        pairs.append((old_nums[0], new_nums[0], attr))

    return pairs


def _extract_real_dimension_changes(text_a: str, text_b: str) -> list[tuple[str, str, str]]:
    """Extract only genuine dimension changes — no cross-product of all numbers."""
    pairs = []
    seen = set()

    def _add(old_v: str, new_v: str, attr: str):
        old_v, new_v = normalize_number(old_v), normalize_number(new_v)
        if not _is_valid_dimension(old_v) or not _is_valid_dimension(new_v):
            return
        if old_v == new_v:
            return
        key = (old_v, new_v, attr)
        if key not in seen:
            seen.add(key)
            pairs.append(key)

    dims_a = _extract_typed_dimensions(text_a)
    dims_b = _extract_typed_dimensions(text_b)
    for attr in set(dims_a) | set(dims_b):
        old_v = dims_a.get(attr, "")
        new_v = dims_b.get(attr, "")
        if old_v and new_v:
            _add(old_v, new_v, attr)

    for old_v, new_v, attr in _diff_aligned_lines(text_a, text_b):
        _add(old_v, new_v, attr)

    return pairs


def _granular_text_diffs(text_a: str, text_b: str, page: int) -> list[DetectedDiff]:
    diffs = []
    if text_a.strip() == text_b.strip():
        return diffs

    seen = set()
    for old_v, new_v, attr in _extract_real_dimension_changes(text_a, text_b):
        key = (old_v, new_v, attr)
        if key in seen:
            continue
        seen.add(key)
        label = {"diameter": "Hole diameter", "width": "Thickness", "length": "Horizontal position",
                 "radius": "Corner radius"}.get(attr, attr.capitalize())
        diffs.append(DetectedDiff(
            id=f"dim-{uuid.uuid4().hex[:8]}",
            description=f"{label} changed: {old_v} → {new_v}",
            location="front view" if attr in ("diameter", "length") else "side view" if attr == "width" else f"Page {page}",
            change_type="dimension",
            page=page,
            confidence=0.92,
            old_value=old_v,
            new_value=new_v,
            attribute=attr,
        ))

    if "PRELIMINARY" in text_a.upper() and "PRELIMINARY" not in text_b.upper():
        diffs.append(DetectedDiff(
            id=f"sym-{uuid.uuid4().hex[:8]}",
            description="Preliminary symbol removed",
            location="title block",
            change_type="symbol",
            page=page,
            confidence=0.90,
            attribute="symbol",
        ))

    removed_match = re.search(r"REMOVED\s+(.+?)(?:\.|$)", text_b, re.IGNORECASE)
    if removed_match and not any(d.attribute == "symbol" for d in diffs):
        item = removed_match.group(1).strip()
        if "preliminary" in item.lower():
            diffs.append(DetectedDiff(
                id=f"rem-{uuid.uuid4().hex[:8]}",
                description="Preliminary symbol removed (per revision notes)",
                location="title block",
                change_type="symbol",
                page=page,
                confidence=0.85,
                attribute="symbol",
            ))

    return diffs


def compare_pdfs(
    pages_a: list[dict],
    pages_b: list[dict],
    arrays_a: list[np.ndarray],
    arrays_b: list[np.ndarray],
) -> tuple[list[DetectedDiff], list[dict]]:
    all_diffs: list[DetectedDiff] = []
    page_images = []
    max_pages = max(len(pages_a), len(pages_b), len(arrays_a), len(arrays_b))

    for i in range(max_pages):
        page_num = i + 1
        has_a = i < len(arrays_a)
        has_b = i < len(arrays_b)
        page_img = {"page": page_num, "rev_a": "", "rev_b": "", "diff_overlay": ""}

        if has_a:
            page_img["rev_a"] = pages_a[i]["image_b64"] if i < len(pages_a) else numpy_to_b64(arrays_a[i])
        if has_b:
            page_img["rev_b"] = pages_b[i]["image_b64"] if i < len(pages_b) else numpy_to_b64(arrays_b[i])

        if has_a and has_b:
            overlay, regions, sim_score = _compute_diff_overlay(arrays_a[i], arrays_b[i])
            page_img["diff_overlay"] = numpy_to_b64(overlay)

            if regions and regions[0]["area_pct"] > 0.3:
                page_w, page_h = arrays_a[i].shape[1], arrays_a[i].shape[0]
                location = _describe_region_location(regions[0], page_w, page_h)
                all_diffs.append(DetectedDiff(
                    id=f"vis-{uuid.uuid4().hex[:8]}",
                    description=f"Visual change detected ({regions[0]['area_pct']}% of page modified)",
                    location=location,
                    change_type="visual",
                    page=page_num,
                    confidence=round(min(0.95, 1.0 - sim_score + 0.5), 2),
                ))

            text_a = pages_a[i]["text"] if i < len(pages_a) else ""
            text_b = pages_b[i]["text"] if i < len(pages_b) else ""
            all_diffs.extend(_granular_text_diffs(text_a, text_b, page_num))

        page_images.append(page_img)

    filtered = [d for d in all_diffs if not _is_noise_diff(d.description)]
    return filtered, page_images
