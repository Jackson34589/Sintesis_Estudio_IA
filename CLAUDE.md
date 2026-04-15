# CLAUDE.md — RadioSíntesis AI
## Asistente inteligente de síntesis y estudio para Radiología

---

## 🎯 Propósito del Proyecto

Aplicación web que permite a estudiantes de radiología:
1. Ingresar textos académicos (inglés o español)
2. Recibir una síntesis estructurada en **español**, destacando lo más relevante para exámenes
3. (Fase 2) Generar diapositivas automáticamente desde la síntesis

---

## 🧠 Identidad del Proyecto

- **Nombre:** RadioSíntesis AI
- **Usuario objetivo:** Estudiante de radiología con poco tiempo y muchos textos en inglés
- **Tono de respuestas IA:** Académico, claro, conciso. Como un tutor que resume para el examen
- **Idioma de síntesis:** Siempre en español, sin importar el idioma de entrada

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  - Editor de texto / paste                          │
│  - Visualizador de síntesis con resaltador          │
│  - Quiz sobre texto resaltado                       │
│  - Exportar síntesis resaltada a PDF                │
│  - (Fase 2) Exportar a PPTX                         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (FastAPI)                   │
│  - /api/synthesize   → síntesis del texto           │
│  - /api/detect-lang  → detección de idioma          │
│  - /api/quiz         → genera preguntas sobre resaltados │
│  - /api/export-pptx  → (Fase 2) exportar slides     │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┬──────────────┐
        │              │
┌───────▼──────┐ ┌─────▼──────┐
│ Claude API   │ │  Caché     │
│ (Haiku)      │ │  en memoria│
│ Síntesis +   │ │  (hash)    │
│ Traducción   │ └────────────┘
└──────────────┘
```

---

## 📦 Stack Tecnológico

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | React + Vite + TailwindCSS | Gratis |
| Backend | FastAPI (Python 3.11+) | Gratis |
| IA Principal | Claude API - Haiku | ~$0.002/texto |
| Detección idioma | `langdetect` (Python lib) | Gratis |
| Caché síntesis | Dict en memoria (sin DB) | Gratis |
| Resaltados | `localStorage` del navegador | Gratis |
| Exportar PDF | `jsPDF` + `html2canvas` (JS) | Gratis |
| Despliegue FE | Vercel | Gratis |
| Despliegue BE | Render.com | Gratis (tier básico) |
| (Fase 2) Slides | `python-pptx` | Gratis |

---

## 📁 Estructura de Carpetas

```
radiosintesis/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TextInput.jsx        # Editor de texto a sintetizar
│   │   │   ├── SynthesisOutput.jsx  # Visualizador de síntesis
│   │   │   ├── Highlighter.jsx      # Resaltador con múltiples colores
│   │   │   ├── ReviewMode.jsx       # Modo repaso: solo muestra resaltado
│   │   │   ├── QuizPanel.jsx        # Quiz generado sobre texto resaltado
│   │   │   └── ExportButton.jsx     # Exportar PDF resaltado / (Fase 2) PPTX
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js               # Calls al backend
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py                      # Entry point FastAPI
│   ├── routes/
│   │   ├── synthesize.py            # Lógica de síntesis
│   │   ├── quiz.py                  # Genera preguntas sobre resaltados
│   │   └── export.py                # (Fase 2) Exportar
│   ├── services/
│   │   ├── claude_service.py        # Integración Claude API
│   │   ├── cache_service.py         # Caché para ahorrar costos
│   │   └── lang_service.py          # Detección de idioma
│   ├── models/
│   │   └── schemas.py               # Pydantic models
│   ├── requirements.txt
│   └── .env
│
├── CLAUDE.md                        # Este archivo
└── README.md
```

---

## 🤖 Prompt Base para Síntesis (Claude)

> ⚠️ **Principio de calidad:** La síntesis debe ser **tan completa como el texto lo requiera**.
> No se limitan los tokens de salida. Una síntesis incompleta es inútil para el estudio.
> El objetivo es cubrir el 100% del contenido relevante, no producir respuestas cortas.

```python
SYNTHESIS_PROMPT = """
Eres un tutor experto en radiología médica. Tu tarea es sintetizar el siguiente texto académico 
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

SÍNTESIS:
"""
```

---

## 🖊️ Funcionalidades de Estudio

### Flujo completo del estudiante

```
1. Pega el texto → se genera la síntesis en español
2. Lee la síntesis y resalta lo más importante con colores
3. Activa "Modo Repaso" → solo ve lo que resaltó
4. Presiona "Generar Quiz" → la IA pregunta sobre sus resaltados
5. Responde las preguntas y ve su evaluación
6. Descarga PDF con síntesis + resaltados para estudiar offline
```

---

### 🎨 Resaltador con colores

El primo resalta texto directamente sobre la síntesis con tres colores:

| Color | Significado sugerido |
|-------|---------------------|
| 🟡 Amarillo | Importante |
| 🔴 Rojo | Crítico para examen |
| 🔵 Azul | Definición / concepto |

Los resaltados se guardan automáticamente en `localStorage` — persisten si cierra el navegador. Se vinculan al hash del texto para que cada síntesis tenga sus propios resaltados.

```javascript
// Estructura en localStorage
{
  "highlights": {
    "[hash_del_texto]": [
      {
        "id": "h1",
        "text": "La tomografía computarizada usa rayos X...",
        "color": "yellow",
        "startOffset": 120,
        "endOffset": 175
      }
    ]
  }
}
```

---

### 👁️ Modo Repaso

Botón que oculta todo el texto de la síntesis y **solo muestra los fragmentos resaltados**, agrupados por color. Replica exactamente el método de estudio del usuario: resaltar → releer solo lo resaltado.

```
┌─────────────────────────────────┐
│  🔴 CRÍTICO PARA EXAMEN         │
│  • La dosis de radiación en TC  │
│    abdominal es de 8-10 mSv     │
│  • El medio de contraste puede  │
│    causar nefrotoxicidad         │
│                                 │
│  🟡 IMPORTANTE                  │
│  • Las ventanas en TC: pulmón   │
│    (-600 UH), hueso (+400 UH)   │
└─────────────────────────────────┘
```

---

### ❓ Quiz sobre resaltados

El primo presiona "Generar Quiz" y la IA crea preguntas **únicamente sobre el texto que él resaltó** — no sobre toda la síntesis. Así el quiz es personalizado a su propio criterio de lo importante.

#### Prompt para Quiz

```python
QUIZ_PROMPT = """
Eres un profesor examinador de radiología médica.
Basándote ÚNICAMENTE en los siguientes fragmentos que el estudiante consideró importantes,
genera {n_questions} preguntas de examen variadas (definición, aplicación clínica, comparación).

Para cada pregunta incluye:
- La pregunta clara y directa
- 4 opciones de respuesta (A, B, C, D)
- La respuesta correcta
- Explicación breve de por qué es correcta

FRAGMENTOS RESALTADOS POR EL ESTUDIANTE:
{highlighted_text}

Responde en JSON con esta estructura:
{{
  "questions": [
    {{
      "question": "...",
      "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "correct": "A",
      "explanation": "..."
    }}
  ]
}}
"""
```

#### Endpoint

```python
# routes/quiz.py
@router.post("/api/quiz")
async def generate_quiz(payload: QuizRequest):
    """
    Recibe los fragmentos resaltados y genera preguntas sobre ellos.
    
    Body:
    {
        "highlighted_fragments": ["fragmento 1", "fragmento 2", ...],
        "n_questions": 5  // entre 3 y 10
    }
    """
    highlighted_text = "\n".join(payload.highlighted_fragments)
    # ... llamada a Claude API con QUIZ_PROMPT
```

---

### 📄 Exportar PDF con resaltados

Genera un PDF descargable que incluye la síntesis completa con los resaltados visibles en color, para que el primo pueda estudiar offline o imprimir.

```javascript
// ExportButton.jsx — usando jsPDF + html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const exportToPDF = async () => {
  const element = document.getElementById('synthesis-content');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0);
  pdf.save('sintesis-radiologia.pdf');
};
```

> ⚠️ **Limitación importante:** Los resaltados viven en `localStorage` del navegador.
> Si el primo limpia la caché o cambia de dispositivo, se pierden.
> Para acceso multi-dispositivo se necesitaría base de datos (Fase 3).

---

```python
# cache_service.py
import hashlib
import json

class CacheService:
    def __init__(self):
        self.cache = {}  # En producción: Redis
    
    def get_cache_key(self, text: str) -> str:
        """Genera hash único del texto para usar como clave"""
        return hashlib.sha256(text.encode()).hexdigest()
    
    def get(self, text: str):
        key = self.get_cache_key(text)
        return self.cache.get(key)
    
    def set(self, text: str, synthesis: str):
        key = self.get_cache_key(text)
        self.cache[key] = synthesis
        # Si el mismo texto ya fue procesado → costo $0
```

---

## 🧠 Algoritmo de Boris — Memoria persistente de errores de desarrollo

> Convención creada por Boris Cherny para Claude Code. No es código de la app —
> es una disciplina de trabajo entre el desarrollador y Claude durante la construcción
> del proyecto.

### ¿Cómo funciona?

1. Claude comete un error durante el desarrollo (bug, mala decisión de arquitectura, patrón incorrecto)
2. El desarrollador lo corrige y le indica explícitamente: **"actualiza el CLAUDE.md para no volver a cometer este error"**
3. Claude documenta la lección en la tabla de abajo
4. En la próxima sesión, Claude lee el CLAUDE.md al inicio y ya sabe qué no hacer

Es memoria institucional persistente entre sesiones, mantenida por el propio Claude y verificada por el desarrollador humano. Sin código extra, sin infraestructura — solo un archivo de texto.

### Principios del método (Boris Cherny)

- **Retroalimentación correctiva inmediata:** después de cada error corregido, instruir a Claude a documentarlo aquí antes de continuar
- **Memoria corporativa:** los errores aislados se convierten en reglas permanentes del proyecto
- **Bucle de verificación:** cada salida de Claude debe ser verificada por el humano para alimentar esta base continuamente
- **Agente como miembro del equipo:** Claude participa del flujo de desarrollo como un colaborador que aprende, no solo ejecuta

### Errores aprendidos

> **Instrucción para Claude:** cada vez que cometas un error durante el desarrollo de este proyecto
> y el desarrollador te lo corrija, agrega una fila a esta tabla antes de continuar.
> Formato: módulo afectado, descripción breve del error, regla que evita repetirlo.

| # | Módulo | Error cometido | Regla aprendida | Fecha |
|---|--------|----------------|-----------------|-------|
| — | —      | Sin errores registrados aún | — | — |

---

## 🚀 Fase 2 — Generación de Diapositivas

Una vez que la síntesis esté lista, se puede generar un `.pptx` automáticamente:

```python
# services/pptx_service.py
from pptx import Presentation
from pptx.util import Inches, Pt

def synthesis_to_pptx(synthesis_text: str, title: str) -> str:
    """Convierte síntesis estructurada en diapositivas"""
    prs = Presentation()
    
    # Parsear secciones de la síntesis
    sections = parse_synthesis_sections(synthesis_text)
    
    for section in sections:
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        slide.shapes.title.text = section["title"]
        slide.placeholders[1].text = section["content"]
    
    output_path = f"exports/{title}_slides.pptx"
    prs.save(output_path)
    return output_path
```

---

## 📋 Variables de Entorno (.env)

```env
# API Keys
ANTHROPIC_API_KEY=sk-ant-...

# App
APP_ENV=development
MAX_TEXT_LENGTH=50000
CACHE_ENABLED=true

# Costos - alertas opcionales
MAX_DAILY_API_CALLS=500
```

---

## 💰 Estimación de Costos Mensuales

| Componente | Uso estimado | Costo mensual |
|-----------|-------------|--------------|
| Claude Haiku API | ~100 textos/mes (~2000 tokens entrada c/u) | ~$0.20 USD |
| Vercel (frontend) | Hobby plan | $0 |
| Render (backend) | Free tier | $0 |
| **TOTAL** | | **~$0.20 USD/mes** |

> 💡 Con caché activo, si el primo vuelve a sintetizar el mismo texto, el costo es $0

---

## 🗺️ Roadmap

### Fase 1 (MVP) — 2-3 semanas
- [x] Input de texto (pegar/escribir)
- [x] Detección automática de idioma
- [x] Síntesis completa en español con IA (sin límite de longitud)
- [x] Puntos clave para examen
- [x] Resaltador con 3 colores sobre la síntesis
- [x] Modo Repaso — solo muestra lo resaltado
- [x] Quiz generado sobre fragmentos resaltados
- [x] Exportar PDF con resaltados
- [x] Persistencia de resaltados en localStorage
- [x] Algoritmo de Boris (aprendizaje de errores)

### Fase 2 — 1-2 semanas adicionales
- [ ] Exportar síntesis a `.pptx`
- [ ] Personalización del diseño de slides
- [ ] Soporte para subir PDF/imagen de texto

### Fase 3 (futuro)
- [ ] App móvil (React Native)
- [ ] Modo quiz: el sistema pregunta sobre la síntesis
- [ ] Compartir síntesis con compañeros

---

## ⚙️ Comandos de Desarrollo

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Ver estadísticas de Boris
curl http://localhost:8000/api/boris/stats
```

---

## 🧾 requirements.txt (Backend)

```
fastapi==0.111.0
uvicorn==0.30.0
anthropic==0.28.0
langdetect==1.0.9
python-dotenv==1.0.1
python-pptx==1.0.0         # Fase 2
pydantic==2.7.0
```

---

*CLAUDE.md generado para RadioSíntesis AI — Algoritmo de Boris v1.0 integrado*

