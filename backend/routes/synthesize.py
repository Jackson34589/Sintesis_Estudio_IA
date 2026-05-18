import json
import asyncio
import threading
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import SynthesizeRequest, SynthesizeResponse, DetectLanguageRequest, DetectLanguageResponse
from services.claude_service import synthesize_text, synthesize_text_stream
from services.cache_service import cache_service
from services.lang_service import detect_language

router = APIRouter()

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",   # prevents nginx from buffering SSE
    "Connection": "keep-alive",
}


@router.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize(payload: SynthesizeRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    lang_code, lang_name = detect_language(text)

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


@router.post("/synthesize/stream")
async def synthesize_stream(payload: SynthesizeRequest):
    """Streaming endpoint — returns SSE chunks so the UI can render progressively."""
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")

    lang_code, lang_name = detect_language(text)

    # Return cached result instantly as a single chunk
    if not payload.images:
        cached = cache_service.get(text)
        if cached:
            async def _cached():
                yield f"data: {json.dumps({'lang': lang_name, 'cached': True})}\n\n"
                yield f"data: {json.dumps({'chunk': cached})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            return StreamingResponse(_cached(), media_type="text/event-stream", headers=_SSE_HEADERS)

    async def _stream():
        full_chunks: list[str] = []
        try:
            yield f"data: {json.dumps({'lang': lang_name, 'cached': False})}\n\n"

            loop = asyncio.get_running_loop()
            queue: asyncio.Queue = asyncio.Queue()

            def _run_claude():
                try:
                    for chunk in synthesize_text_stream(text, payload.images):
                        loop.call_soon_threadsafe(queue.put_nowait, chunk)
                except Exception as exc:
                    loop.call_soon_threadsafe(queue.put_nowait, exc)
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

            thread = threading.Thread(target=_run_claude, daemon=True)
            thread.start()

            while True:
                item = await queue.get()
                if item is None:
                    break
                if isinstance(item, Exception):
                    yield f"data: {json.dumps({'error': str(item)})}\n\n"
                    return
                full_chunks.append(item)
                yield f"data: {json.dumps({'chunk': item})}\n\n"

            thread.join(timeout=5)

            if not payload.images and full_chunks:
                cache_service.set(text, "".join(full_chunks))

            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(_stream(), media_type="text/event-stream", headers=_SSE_HEADERS)


@router.post("/detect-lang", response_model=DetectLanguageResponse)
async def detect_lang(payload: DetectLanguageRequest):
    lang_code, lang_name = detect_language(payload.text)
    return DetectLanguageResponse(language=lang_code, language_name=lang_name)
