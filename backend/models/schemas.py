from pydantic import BaseModel, Field
from typing import List, Optional


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=50000)


class SynthesizeResponse(BaseModel):
    synthesis: str
    detected_language: str
    cached: bool = False


class QuizRequest(BaseModel):
    highlighted_fragments: List[str] = Field(..., min_length=1)
    n_questions: int = Field(default=5, ge=3, le=10)


class QuizOption(BaseModel):
    A: str
    B: str
    C: str
    D: str


class QuizQuestion(BaseModel):
    question: str
    options: QuizOption
    correct: str
    explanation: str


class QuizResponse(BaseModel):
    questions: List[QuizQuestion]


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=5)


class DetectLanguageResponse(BaseModel):
    language: str
    language_name: str
