import os
import json
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYNTHESIS_PROMPT = """Eres un tutor experto en radiología médica. Tu tarea es sintetizar el siguiente texto académico \
para que un estudiante pueda estudiar eficientemente y responder preguntas de examen.

INSTRUCCIONES:
1. Si el texto está en inglés, tradúcelo y sintetiza en español
2. Si el texto ya está en español, sintetiza directamente
3. La síntesis debe cubrir ABSOLUTAMENTE TODOS los temas importantes — no omitas nada relevante
4. Extiéndete tanto como sea necesario para cubrir el contenido completo
5. Usa formato estructurado: títulos, subtítulos, listas cuando aplique
6. Al final incluye una sección "🎯 Puntos clave para el examen" con los conceptos más importantes
7. Usa terminología médica correcta pero explica términos técnicos complejos

TEXTO A SINTETIZAR:
{text}

SÍNTESIS:"""

QUIZ_PROMPT = """Eres un profesor examinador de radiología médica.
Basándote ÚNICAMENTE en los siguientes fragmentos que el estudiante consideró importantes,
genera {n_questions} preguntas de examen variadas (definición, aplicación clínica, comparación).

Para cada pregunta incluye:
- La pregunta clara y directa
- 4 opciones de respuesta (A, B, C, D)
- La respuesta correcta
- Explicación breve de por qué es correcta

FRAGMENTOS RESALTADOS POR EL ESTUDIANTE:
{highlighted_text}

Responde ÚNICAMENTE con JSON válido con esta estructura exacta:
{{
  "questions": [
    {{
      "question": "...",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct": "A",
      "explanation": "..."
    }}
  ]
}}"""


def synthesize_text(text: str) -> str:
    prompt = SYNTHESIS_PROMPT.format(text=text)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def generate_quiz(highlighted_fragments: list[str], n_questions: int) -> dict:
    highlighted_text = "\n".join(f"- {f}" for f in highlighted_fragments)
    prompt = QUIZ_PROMPT.format(
        n_questions=n_questions, highlighted_text=highlighted_text
    )
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
