from fastapi import APIRouter, HTTPException
from models.schemas import SynthesizeRequest, SynthesizeResponse, DetectLanguageRequest, DetectLanguageResponse
from services.claude_service import synthesize_text
from services.cache_service import cache_service
from services.lang_service import detect_language

router = APIRouter()


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize(payload: SynthesizeRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    lang_code, lang_name = detect_language(text)

    # Solo usar caché cuando no hay imágenes (con imágenes cada síntesis es única)
    if not payload.images:
        cached = cache_service.get(text)
        if cached:
            return SynthesizeResponse(synthesis=cached, detected_language=lang_name, cached=True)

    try:
        synthesis = synthesize_text(text, payload.images)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al llamar a la IA: {str(e)}")

    if not payload.images:
        cache_service.set(text, synthesis)

    return SynthesizeResponse(synthesis=synthesis, detected_language=lang_name, cached=False)


@router.post("/detect-lang", response_model=DetectLanguageResponse)
async def detect_lang(payload: DetectLanguageRequest):
    lang_code, lang_name = detect_language(payload.text)
    return DetectLanguageResponse(language=lang_code, language_name=lang_name)
