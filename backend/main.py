from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.synthesize import router as synthesize_router
from routes.quiz import router as quiz_router
from routes.export import router as export_router
from routes.extract import router as extract_router
from services.cache_service import cache_service

app = FastAPI(
    title="RadioSíntesis AI",
    description="Backend para síntesis académica de textos de radiología",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(synthesize_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(extract_router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "app": "RadioSíntesis AI"}


@app.get("/api/boris/stats")
def boris_stats():
    return {
        "cache": cache_service.stats(),
        "message": "Algoritmo de Boris activo — errores aprendidos documentados en CLAUDE.md",
    }
