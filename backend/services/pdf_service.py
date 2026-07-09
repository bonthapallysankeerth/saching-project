import base64
import io
from typing import Optional

import fitz
import numpy as np
from PIL import Image


def pdf_to_page_images(pdf_bytes: bytes, dpi: int = 150) -> list[dict]:
    """Render each PDF page to a base64 PNG and extract text."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc[page_num]
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        img_bytes = pixmap.tobytes("png")
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        text = page.get_text("text").strip()
        pages.append({
            "page": page_num + 1,
            "image_b64": b64,
            "text": text,
            "width": pixmap.width,
            "height": pixmap.height,
        })

    doc.close()
    return pages


def pdf_to_numpy(pdf_bytes: bytes, dpi: int = 150) -> list[np.ndarray]:
    """Render PDF pages as numpy RGB arrays for image processing."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    arrays = []
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for page_num in range(len(doc)):
        page = doc[page_num]
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        img = Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")
        arrays.append(np.array(img))

    doc.close()
    return arrays


def extract_all_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    parts = []
    for page_num in range(len(doc)):
        text = doc[page_num].get_text("text").strip()
        if text:
            parts.append(f"[Page {page_num + 1}]\n{text}")
    doc.close()
    return "\n\n".join(parts)


def numpy_to_b64(img_array: np.ndarray) -> str:
    """Convert numpy RGB array to base64 PNG."""
    img = Image.fromarray(img_array.astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def resize_to_match(img: np.ndarray, target_h: int, target_w: int) -> np.ndarray:
    """Resize image to target dimensions."""
    pil = Image.fromarray(img.astype(np.uint8))
    pil = pil.resize((target_w, target_h), Image.Resampling.LANCZOS)
    return np.array(pil)
