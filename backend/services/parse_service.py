import re

from models.schemas import RequestedChange


RE_UPDATED = re.compile(
    r"UPDATED\s+(\w+)\s+([\d,.]+)\s+WAS\s+([\d,.]+)",
    re.IGNORECASE,
)
RE_REMOVED = re.compile(
    r"REMOVED\s+(.+?)(?:\.|,|$)",
    re.IGNORECASE,
)
RE_DIM_CHANGE = re.compile(
    r"(?:from\s+)?([\d,.]+)\s*(?:mm|cm|in)?\s+(?:to|→|->)\s+([\d,.]+)",
    re.IGNORECASE,
)
RE_DIAMETER = re.compile(
    r"(?:ø|φ|dia\.?|diameter)\s*([\d,.]+)",
    re.IGNORECASE,
)

ATTRIBUTE_KEYWORDS = {
    "length": ["length", "long", "horizontal", "position", "offset", "distance"],
    "width": ["width", "thickness", "thick", "depth"],
    "diameter": ["dia", "diameter", "bore", "hole", "ø", "φ", "drill"],
    "radius": ["radius", "corner", "fillet", "r0"],
    "material": ["material", "steel", "aluminum", "alloy"],
    "finish": ["finish", "ra", "surface"],
    "symbol": ["preliminary", "symbol", "stamp", "release"],
    "note": ["note", "deburr", "annotation"],
}


def normalize_number(val: str) -> str:
    v = val.strip().replace(",", ".").replace("ø", "").replace("Ø", "").replace("φ", "").replace("Φ", "").strip()
    if v.endswith("."):
        v = v[:-1]
    return v


def extract_numbers(text: str) -> list[str]:
    return [normalize_number(m) for m in re.findall(r"\d+[,.]?\d*", text)]


def detect_attribute(text: str) -> str:
    lower = text.lower()
    if re.search(r"ø|φ|dia\b|plcs", lower):
        return "diameter"
    if re.search(r"thick|width|depth", lower):
        return "width"
    if re.search(r"length|position|horizontal|offset", lower):
        return "length"
    if re.search(r"preliminary|symbol|stamp", lower):
        return "symbol"
    if re.search(r"\bR[\d,.]+\s*\(", lower):
        return "radius"
    for attr, keywords in ATTRIBUTE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return attr
    return "general"


def _make_change(idx: int, description: str, attribute: str = "general",
                 target: str = "", old: str = "", location: str = "") -> RequestedChange:
    return RequestedChange(
        id=idx,
        description=description,
        location=location,
        target_value=target or None,
        old_value=old or None,
        attribute=attribute,
        change_type=attribute,
    )


def _deduplicate_changes(changes: list[RequestedChange]) -> list[RequestedChange]:
    seen = set()
    result = []
    for i, c in enumerate(changes, start=1):
        key = (c.attribute, c.target_value, c.old_value, c.description[:50])
        if key in seen:
            continue
        seen.add(key)
        c.id = i
        result.append(c)
    return result


def parse_revision_block(text: str) -> list[RequestedChange]:
    changes = []
    idx = 1
    for match in RE_UPDATED.finditer(text):
        attr_raw = match.group(1).upper()
        new_val = normalize_number(match.group(2))
        old_val = normalize_number(match.group(3))
        attr = detect_attribute(attr_raw)
        desc = f"Update {attr_raw.lower()} from {old_val} to {new_val}"
        changes.append(_make_change(idx, desc, attr, new_val, old_val))
        idx += 1
    for match in RE_REMOVED.finditer(text):
        item = match.group(1).strip().rstrip(".")
        if len(item) > 3:
            changes.append(_make_change(idx, f"Remove {item}", "symbol", "", "", "title block"))
            idx += 1
    return changes


def _split_into_items(text: str) -> list[str]:
    lines = text.strip().splitlines()
    items, current = [], ""
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current:
                items.append(current.strip())
                current = ""
            continue
        is_bullet = bool(re.match(r"^[\-\*\•\d]+[\.\)\]]\s*", stripped))
        is_header = bool(re.match(r"^(ECO|CHANGE|ITEM|REVISION|DESCRIPTION|REF|DRW|CHK|DATE|MFG|MATERIAL|SUPPLIER|PAINT|SCALE|NOTES?)\b", stripped, re.IGNORECASE))
        is_noise = bool(re.match(r"^(MANOJ|VIJAY|\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))", stripped, re.IGNORECASE))
        if is_noise:
            continue
        if is_bullet:
            if current:
                items.append(current.strip())
            current = re.sub(r"^[\-\*\•\d]+[\.\)\]]\s*", "", stripped)
        elif is_header and not current:
            continue
        else:
            current = f"{current} {stripped}".strip() if current else stripped
    if current:
        items.append(current.strip())
    return [i for i in items if len(i) > 4]


def _extract_target_old(text: str) -> tuple[str, str]:
    m = RE_DIM_CHANGE.search(text)
    if m:
        return normalize_number(m.group(2)), normalize_number(m.group(1))
    nums = extract_numbers(text)
    if len(nums) >= 2:
        return nums[-1], nums[0]
    if len(nums) == 1:
        return nums[0], ""
    return "", ""


def _extract_location(text: str) -> str:
    for pattern in [
        r"(section\s+[\w\-]+)",
        r"((?:top|bottom|left|right|front|rear|side)\s+(?:view|area|corner|edge))",
        r"(title\s+block)",
        r"(detail\s+[\w\-]+)",
    ]:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return ""


def parse_dimension_overrides(text: str) -> list[RequestedChange]:
    changes = []
    idx = 1
    for match in RE_DIM_CHANGE.finditer(text):
        old_v, new_v = normalize_number(match.group(1)), normalize_number(match.group(2))
        attr = detect_attribute(text[max(0, match.start() - 30):match.end()])
        changes.append(_make_change(idx, f"Change dimension from {old_v} to {new_v}", attr, new_v, old_v))
        idx += 1
    for match in RE_DIAMETER.finditer(text):
        val = normalize_number(match.group(1))
        changes.append(_make_change(idx, f"Set hole diameter to {val}", "diameter", val, ""))
        idx += 1
    return changes


def parse_change_request(text: str) -> list[RequestedChange]:
    if not text or not text.strip():
        return []
    changes = parse_revision_block(text)
    if changes:
        return _deduplicate_changes(changes)
    changes = parse_dimension_overrides(text)
    if changes:
        return _deduplicate_changes(changes)
    raw_items = _split_into_items(text)
    if not raw_items:
        raw_items = [text.strip()]
    result = []
    for idx, item in enumerate(raw_items, start=1):
        attr = detect_attribute(item)
        target, old = _extract_target_old(item)
        result.append(_make_change(idx, item, attr, target, old, _extract_location(item)))
    return _deduplicate_changes(result)


def get_text_blocks(pdf_bytes: bytes) -> list[dict]:
    import fitz
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    blocks = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        for block in page.get_text("dict")["blocks"]:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                text = " ".join(span["text"] for span in line["spans"]).strip()
                if text:
                    bbox = line["bbox"]
                    blocks.append({
                        "text": text, "page": page_num + 1,
                        "x": bbox[0], "y": bbox[1], "x2": bbox[2], "y2": bbox[3],
                    })
    doc.close()
    return blocks


def _block_distance(a: dict, b: dict) -> float:
    return ((a["x"] - b["x"]) ** 2 + (a["y"] - b["y"]) ** 2) ** 0.5


def compare_markup_to_baseline(
    baseline_blocks: list[dict],
    markup_blocks: list[dict],
) -> list[RequestedChange]:
    changes = []
    idx = 1
    for mb in markup_blocks:
        mb_nums = extract_numbers(mb["text"])
        if not mb_nums and len(mb["text"]) < 3:
            continue
        closest = None
        closest_dist = float("inf")
        for bb in baseline_blocks:
            if bb["page"] != mb["page"]:
                continue
            dist = _block_distance(mb, bb)
            if dist < closest_dist:
                closest_dist = dist
                closest = bb
        if closest and closest_dist < 80:
            bb_nums = extract_numbers(closest["text"])
            if mb_nums and bb_nums and mb_nums != bb_nums:
                old_v, new_v = bb_nums[0], mb_nums[0]
                attr = detect_attribute(closest["text"] + " " + mb["text"])
                changes.append(_make_change(idx, f"Change {attr} from {old_v} to {new_v}", attr, new_v, old_v, f"Page {mb['page']}"))
                idx += 1
        elif mb_nums and closest_dist >= 80:
            attr = detect_attribute(mb["text"])
            changes.append(_make_change(idx, f"Annotate {attr}: set to {mb_nums[0]}", attr, mb_nums[0], "", f"Page {mb['page']}"))
            idx += 1
    return changes


def detect_red_markup_changes(markup_array, baseline_array, baseline_text: str) -> list[RequestedChange]:
    changes = []
    h = min(markup_array.shape[0], baseline_array.shape[0])
    w = min(markup_array.shape[1], baseline_array.shape[1])
    markup = markup_array[:h, :w]
    r, g, b = markup[:, :, 0], markup[:, :, 1], markup[:, :, 2]
    red_mask = (r.astype(int) > 140) & (g.astype(int) < 140) & (b.astype(int) < 140) & (r.astype(int) > g.astype(int) + 40)
    if red_mask.sum() < 100:
        return changes
    if "PRELIMINARY" in baseline_text.upper() and red_mask[int(h * 0.7):, :].sum() > 100:
        changes.append(_make_change(1, "Remove preliminary symbol", "symbol", "", "", "title block"))
    return changes
