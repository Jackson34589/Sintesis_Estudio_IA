import io
import base64
import os
import fitz  # pymupdf
import anthropic
from fastapi import APIRouter, UploadFile, File, HTTPException
from docx import Document
from pptx import Presentation

router = APIRouter()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

EXTRACT_PROMPT = """Extrae TODO el texto de esta página exactamente como aparece.
Incluye:
- Todo el texto normal y párrafos
- Texto dentro de tablas (mantén la estructura con | si es posible)
- Texto dentro de imágenes, figuras, gráficos y diagramas
- Títulos, subtítulos, pies de figura, leyendas
- Números, unidades, referencias

No interpretes ni resumas — solo extrae el texto tal cual aparece."""


def extract_with_vision(image_bytes: bytes) -> str:
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/png", "data": b64},
                },
                {"type": "text", "text": EXTRACT_PROMPT},
            ],
        }],
    )
    return message.content[0].text


def extract_pdf(content: bytes) -> tuple[str, int]:
    doc = fitz.open(stream=content, filetype="pdf")
    pages_text = []
    for page in doc:
        digital_text = page.get_text().strip()
        if len(digital_text) > 100:
            pages_text.append(digital_text)
        else:
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = page.get_pixmap(matrix=mat)
            vision_text = extract_with_vision(pix.tobytes("png"))
            if vision_text.strip():
                pages_text.append(vision_text)
    doc.close()
    if not pages_text:
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del PDF.")
    return "\n\n".join(pages_text), len(pages_text)


def extract_docx(content: bytes) -> tuple[str, int]:
    doc = Document(io.BytesIO(content))
    parts = []

    for element in doc.element.body:
        tag = element.tag.split("}")[-1]

        if tag == "p":
            # Paragraph
            para = next((p for p in doc.paragraphs if p._element is element), None)
            if para and para.text.strip():
                parts.append(para.text.strip())

        elif tag == "tbl":
            # Table
            tbl = next((t for t in doc.tables if t._element is element), None)
            if tbl:
                rows = []
                for row in tbl.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    rows.append(" | ".join(cells))
                parts.append("\n".join(rows))

    if not parts:
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del archivo Word.")
    return "\n\n".join(parts), len(doc.paragraphs)


def extract_pptx(content: bytes) -> tuple[str, int]:
    prs = Presentation(io.BytesIO(content))
    slides_text = []

    for i, slide in enumerate(prs.slides, 1):
        slide_parts = []

        for shape in slide.shapes:
            # Text frames (títulos, cuadros de texto, cuerpos)
            if shape.has_text_frame:
                text = "\n".join(
                    para.text.strip()
                    for para in shape.text_frame.paragraphs
                    if para.text.strip()
                )
                if text:
                    slide_parts.append(text)

            # Tables inside slides
            if shape.has_table:
                rows = []
                for row in shape.table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    rows.append(" | ".join(cells))
                slide_parts.append("\n".join(rows))

        if slide_parts:
            slides_text.append(f"[Diapositiva {i}]\n" + "\n\n".join(slide_parts))

    if not slides_text:
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del PowerPoint.")
    return "\n\n".join(slides_text), len(prs.slides)


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    filename = (file.filename or "").lower()
    content = await file.read()

    try:
        if filename.endswith(".txt"):
            try:
                text = content.decode("utf-8")
            except UnicodeDecodeError:
                text = content.decode("latin-1")
            return {"text": text, "pages": None, "method": "direct"}

        elif filename.endswith(".pdf"):
            text, pages = extract_pdf(content)
            return {"text": text, "pages": pages, "method": "pdf+vision"}

        elif filename.endswith(".docx"):
            text, count = extract_docx(content)
            return {"text": text, "pages": count, "method": "docx"}

        elif filename.endswith(".pptx"):
            text, slides = extract_pptx(content)
            return {"text": text, "pages": slides, "method": "pptx"}

        elif filename.endswith(".doc"):
            raise HTTPException(
                status_code=415,
                detail="El formato .doc (Word antiguo) no está soportado. Guarda el archivo como .docx e inténtalo de nuevo."
            )

        elif filename.endswith(".ppt"):
            raise HTTPException(
                status_code=415,
                detail="El formato .ppt (PowerPoint antiguo) no está soportado. Guarda el archivo como .pptx e inténtalo de nuevo."
            )

        else:
            raise HTTPException(
                status_code=415,
                detail="Formato no soportado. Usa: .pdf, .docx, .pptx o .txt"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error al procesar el archivo: {str(e)}")
