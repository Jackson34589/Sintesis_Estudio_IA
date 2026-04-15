from fastapi import APIRouter, HTTPException
from models.schemas import QuizRequest, QuizResponse
from services.claude_service import generate_quiz

router = APIRouter()


@router.post("/quiz", response_model=QuizResponse)
async def quiz(payload: QuizRequest):
    if not payload.highlighted_fragments:
        raise HTTPException(
            status_code=400,
            detail="Debes resaltar al menos un fragmento antes de generar el quiz",
        )

    try:
        result = generate_quiz(payload.highlighted_fragments, payload.n_questions)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al generar el quiz: {str(e)}")

    return QuizResponse(**result)
