const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = err.detail
    const message = Array.isArray(detail)
      ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
      : typeof detail === 'string'
        ? detail
        : JSON.stringify(detail)
    throw new Error(message || 'Error desconocido')
  }
  return res.json()
}

function makeAbortController(timeoutMs) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return { controller, clear: () => clearTimeout(id) }
}

// Non-streaming fallback (kept for compatibility)
export async function synthesize(text, images = []) {
  const { controller, clear } = makeAbortController(120_000)
  try {
    const res = await fetch(`${BASE_URL}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, images }),
      signal: controller.signal,
    })
    return handleResponse(res)
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('La síntesis tardó demasiado. Intenta con un texto más corto.')
    throw err
  } finally {
    clear()
  }
}

/**
 * Streaming synthesis via SSE.
 * Calls onChunk(text) for each partial token, onMeta({lang, cached}) once at start,
 * onDone() when complete, onError(Error) on failure.
 * Returns an AbortController so the caller can cancel.
 */
export function synthesizeStream(text, images = [], { onChunk, onMeta, onDone, onError } = {}) {
  const { controller, clear } = makeAbortController(180_000) // 3-min hard limit

  async function run() {
    try {
      const res = await fetch(`${BASE_URL}/synthesize/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, images }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || 'Error al sintetizar')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() // hold incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let data
          try { data = JSON.parse(line.slice(6)) } catch { continue }

          if (data.error) throw new Error(data.error)
          if (data.lang !== undefined) onMeta?.({ lang: data.lang, cached: data.cached })
          if (data.chunk) onChunk?.(data.chunk)
          if (data.done) onDone?.()
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        onError?.(new Error('La síntesis tardó demasiado. El servidor puede estar iniciando — espera un momento e intenta de nuevo.'))
      } else {
        onError?.(err)
      }
    } finally {
      clear()
    }
  }

  run()
  return controller
}

export async function detectLanguage(text) {
  const { controller, clear } = makeAbortController(15_000)
  try {
    const res = await fetch(`${BASE_URL}/detect-lang`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })
    return handleResponse(res)
  } finally {
    clear()
  }
}

export async function generateQuiz(highlightedFragments, nQuestions = 5) {
  const { controller, clear } = makeAbortController(60_000)
  try {
    const res = await fetch(`${BASE_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        highlighted_fragments: highlightedFragments,
        n_questions: nQuestions,
      }),
      signal: controller.signal,
    })
    return handleResponse(res)
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('El quiz tardó demasiado. Intenta con menos fragmentos resaltados.')
    throw err
  } finally {
    clear()
  }
}

export async function extractTextFromFile(file) {
  // PDFs grandes con muchas páginas pueden tardar varios minutos
  const { controller, clear } = makeAbortController(300_000) // 5 min
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE_URL}/extract-text`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
    return handleResponse(res)
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('La extracción del archivo tardó demasiado. El archivo puede tener demasiadas páginas.')
    throw err
  } finally {
    clear()
  }
}

export async function exportPptx(synthesis, title) {
  const { controller, clear } = makeAbortController(60_000)
  try {
    const res = await fetch(`${BASE_URL}/export-pptx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ synthesis, title }),
      signal: controller.signal,
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
  } finally {
    clear()
  }
}
