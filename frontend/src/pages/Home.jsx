import { useState, useRef, useEffect } from 'react'
import TextInput from '../components/TextInput'
import SynthesisOutput from '../components/SynthesisOutput'
import { synthesizeStream } from '../services/api'

function hashText(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash))
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [docImages, setDocImages] = useState([])
  const [streamText, setStreamText] = useState('')
  const [waitingFirst, setWaitingFirst] = useState(false) // true while waiting for first chunk

  // Refs to accumulate streaming state without closure issues
  const acc = useRef({ text: '', meta: null })
  const abortRef = useRef(null)

  // Cancel ongoing stream when component unmounts
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleSubmit = (text) => {
    // Cancel any previous request
    abortRef.current?.abort()

    acc.current = { text: '', meta: null }
    setLoading(true)
    setWaitingFirst(true)
    setError('')
    setResult(null)
    setStreamText('')

    const imageBase64s = docImages.map(img => img.data)
    const textHash = hashText(text)

    abortRef.current = synthesizeStream(text, imageBase64s, {
      onMeta(meta) {
        acc.current.meta = meta
      },
      onChunk(chunk) {
        setWaitingFirst(false)
        acc.current.text += chunk
        setStreamText(acc.current.text)
      },
      onDone() {
        setResult({
          synthesis: acc.current.text,
          detected_language: acc.current.meta?.lang || '—',
          cached: acc.current.meta?.cached || false,
          textHash,
        })
        setStreamText('')
        setLoading(false)
        setWaitingFirst(false)
      },
      onError(err) {
        setError(err.message)
        setLoading(false)
        setWaitingFirst(false)
      },
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-ink">RadioSíntesis AI</h1>
        <p className="text-sm text-ink-muted">
          Sintetiza textos académicos de radiología en español · Resalta · Repasa · Evalúate
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
        <h2 className="text-sm font-semibold text-brand-600 mb-3">📝 Texto a sintetizar</h2>
        <TextInput onSubmit={handleSubmit} loading={loading} onImagesExtracted={setDocImages} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Waiting for server / first chunk */}
      {loading && waitingFirst && (
        <div className="bg-white rounded-2xl border border-brand-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-ink">Conectando con la IA...</p>
              <p className="text-xs text-ink-muted mt-0.5">
                El servidor puede tardar unos segundos en iniciar. La síntesis aparecerá aquí en cuanto comience.
              </p>
            </div>
          </div>
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-brand-50 rounded w-3/4" />
            <div className="h-3 bg-brand-50 rounded w-full" />
            <div className="h-3 bg-brand-50 rounded w-5/6" />
          </div>
        </div>
      )}

      {/* Streaming preview — shows while chunks are arriving */}
      {loading && !waitingFirst && streamText && (
        <div className="bg-white rounded-2xl border border-brand-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
            </span>
            <span className="text-xs font-medium text-brand-600">Generando síntesis...</span>
          </div>
          <div
            className="text-sm text-ink leading-relaxed whitespace-pre-wrap"
            style={{ opacity: 0.85 }}
          >
            {streamText}
          </div>
        </div>
      )}

      {/* Final result */}
      {result && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
          <h2 className="text-sm font-semibold text-brand-600 mb-4">🧠 Síntesis generada</h2>
          <SynthesisOutput
            synthesis={result.synthesis}
            detectedLanguage={result.detected_language}
            cached={result.cached}
            textHash={result.textHash}
            docImages={docImages}
          />
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-ink-muted pb-2">
        RadioSíntesis AI · Powered by Claude Haiku · Los resaltados se guardan en tu navegador
      </p>
    </div>
  )
}
