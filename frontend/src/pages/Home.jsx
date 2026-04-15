import { useState } from 'react'
import TextInput from '../components/TextInput'
import SynthesisOutput from '../components/SynthesisOutput'
import { synthesize } from '../services/api'

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

  const handleSubmit = async (text) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const imageBase64s = docImages.map(img => img.data)
      const data = await synthesize(text, imageBase64s)
      setResult({ ...data, textHash: hashText(text) })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">RadioSíntesis AI</h1>
        <p className="text-sm text-slate-500">
          Sintetiza textos académicos de radiología en español · Resalta · Repasa · Evalúate
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">📝 Texto a sintetizar</h2>
        <TextInput onSubmit={handleSubmit} loading={loading} onImagesExtracted={setDocImages} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <p className="text-xs text-slate-400 text-center pt-2">
            La IA está sintetizando tu texto... puede tardar unos segundos.
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-600 mb-4">🧠 Síntesis generada</h2>
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
      <p className="text-center text-xs text-slate-400">
        RadioSíntesis AI · Powered by Claude Haiku · Los resaltados se guardan en tu navegador
      </p>
    </div>
  )
}
