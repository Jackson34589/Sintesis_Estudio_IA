const BASE_URL = '/api'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Error desconocido')
  }
  return res.json()
}

export async function synthesize(text) {
  const res = await fetch(`${BASE_URL}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return handleResponse(res)
}

export async function detectLanguage(text) {
  const res = await fetch(`${BASE_URL}/detect-lang`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return handleResponse(res)
}

export async function generateQuiz(highlightedFragments, nQuestions = 5) {
  const res = await fetch(`${BASE_URL}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      highlighted_fragments: highlightedFragments,
      n_questions: nQuestions,
    }),
  })
  return handleResponse(res)
}

export async function extractTextFromFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/extract-text`, {
    method: 'POST',
    body: formData,
  })
  return handleResponse(res)
}

export async function exportPptx(synthesis, title) {
  const res = await fetch(`${BASE_URL}/export-pptx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ synthesis, title }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Error al exportar PPTX')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.pptx`
  a.click()
  URL.revokeObjectURL(url)
}
