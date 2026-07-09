from services.diff_service import _extract_real_dimension_changes, compare_pdfs
from services.markup_service import _infer_markup_requests, parse_markup_pdf

baseline = """MFG PART NUMBER : 72-1111-00
MATERIAL : STEEL
SUPPLIER : SUPER FORGE
PAINT : GRAY PAINT
11
15
22
ø5,5 (2 PLCS)
2,8
42,3
R0,6 (4 PLCS)
PRELIMINARY
20-DEC-2025
SCALE 4,000"""

rev_b = """MFG PART NUMBER : 72-1111-00
MATERIAL : STEEL
SUPPLIER : SUPER FORGE
PAINT : GRAY PAINT
10,5
15
22
ø5 (2 PLCS)
2,5
42,3
R0,6 (4 PLCS)
PRELIMINARY
A
REMOVED PRELIMINARY SYMBOL. UPDATED LENGTH 10.5 WAS 11, UPDATED DIA 5 WAS 5.5, UPDATED WIDTH 2.5 WAS 2.8.
07 JUL 2026
MANOJ
VIJAY
SCALE 4,000"""

print("=== MARKUP REQUESTS (should be 4) ===")
requests = _infer_markup_requests(baseline)
for r in requests:
    print(f"  {r.id}. [{r.attribute}] {r.description}")

print("\n=== DETECTED DIFFS (should be ~4-5) ===")
pairs = _extract_real_dimension_changes(baseline, rev_b)
for p in pairs:
    print(f"  {p[2]}: {p[0]} -> {p[1]}")

pages_a = [{"page": 1, "image_b64": "", "text": baseline, "width": 100, "height": 100}]
pages_b = [{"page": 1, "image_b64": "", "text": rev_b, "width": 100, "height": 100}]
import numpy as np
arr = np.ones((100, 100, 3), dtype=np.uint8) * 255
diffs, _ = compare_pdfs(pages_a, pages_b, [arr], [arr])
for d in diffs:
    print(f"  [{d.change_type}] {d.description}")

print(f"\nTotal requests: {len(requests)}, Total diffs: {len(diffs)}")
