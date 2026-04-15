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

SYNTHESIS_PROMPT_WITH_IMAGES = """Eres un tutor experto en radiología médica. Tu tarea es sintetizar el siguiente \
texto académico para que un estudiante pueda estudiar eficientemente y responder preguntas de examen.

Se adjuntan {n_images} imagen(es) extraídas del documento, numeradas del 1 al {n_images}. \
Pueden ser radiografías, tomografías, resonancias, ecografías, esquemas anatómicos u otras figuras médicas.

INSTRUCCIONES:
1. Si el texto está en inglés, tradúcelo y sintetiza en español
2. Si el texto ya está en español, sintetiza directamente
3. La síntesis debe cubrir ABSOLUTAMENTE TODOS los temas importantes — no omitas nada relevante
4. Usa formato estructurado: títulos, subtítulos, listas cuando aplique
5. OBLIGATORIO — analiza cada imagen adjunta e intégrala en el texto:
   - Identifica qué muestra cada imagen (tipo de estudio, región anatómica, hallazgo)
   - Inserta el marcador [IMG:N] EN EL PÁRRAFO donde se describe lo que muestra esa imagen
   - El marcador debe ir justo después de la oración que describe o explica la imagen
   - REGLA ESTRICTA: cada marcador [IMG:N] debe aparecer UNA SOLA VEZ en toda la síntesis — nunca repitas el mismo número
   - Ejemplos correctos:
     "La radiografía de tórax PA muestra el mediastino ensanchado. [IMG:1]"
     "En la TC abdominal con contraste se aprecia el hígado en fase portal. [IMG:2]"
   - Si una imagen no corresponde claramente a ningún párrafo, agrégala al final con una breve descripción
   - TODAS las imágenes deben aparecer exactamente una vez con su marcador [IMG:N]
6. Al final incluye una sección "🎯 Puntos clave para el examen"
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

MAX_IMAGES = 20  # Cap para evitar contextos demasiado grandes


def synthesize_text(text: str, images: list[str] = []) -> str:
    images = images[:MAX_IMAGES]

    if images:
        # Multimodal: send images + text together so Claude places [IMG:N] markers
        content = []
        for i, b64 in enumerate(images, 1):
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/png", "data": b64},
            })
            content.append({"type": "text", "text": f"↑ Imagen {i}"})

        prompt = SYNTHESIS_PROMPT_WITH_IMAGES.format(text=text, n_images=len(images))
        content.append({"type": "text", "text": prompt})

        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,
            messages=[{"role": "user", "content": content}],
        )
    else:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,
            messages=[{"role": "user", "content": SYNTHESIS_PROMPT.format(text=text)}],
        )

    return message.content[0].text


def generate_quiz(highlighted_fragments: list[str], n_questions: int) -> dict:
    highlighted_text = "\n".join(f"- {f}" for f in highlighted_fragments)
    prompt = QUIZ_PROMPT.format(n_questions=n_questions, highlighted_text=highlighted_text)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
