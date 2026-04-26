import { useRef, useState } from 'react'
import { extractTextFromFile } from '../services/api'

export default function TextInput({ onSubmit, loading, onImagesExtracted }) {
  const [text, setText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (text.trim().length < 10) return
    onSubmit(text.trim())
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')
    setExtracting(true)
    try {
      const data = await extractTextFromFile(file)
      setText(data.text)
      if (data.images?.length > 0) {
        onImagesExtracted?.(data.images)
      }
      const ext = file.name.split('.').pop().toUpperCase()
      const imgCount = data.images?.length ?? 0
      const imgLabel = imgCount > 0
        ? ` · ${imgCount} imagen${imgCount !== 1 ? 'es' : ''} radiológica${imgCount !== 1 ? 's' : ''} detectada${imgCount !== 1 ? 's' : ''}`
        : ''
      if (data.pages) {
        setFileError(`✅ ${ext} cargado — ${data.pages} página${data.pages !== 1 ? 's' : ''}${imgLabel}`)
      } else {
        setFileError(`✅ Archivo cargado${imgLabel}`)
      }
    } catch (err) {
      setFileError('⚠️ ' + err.message)
    } finally {
      setExtracting(false)
      e.target.value = ''
    }
  }

  const charCount = text.length
  const maxChars = 200000

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          className="w-full h-52 p-4 border border-brand-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed bg-white shadow-sm text-ink placeholder-ink-muted"
          placeholder="Pega aquí tu texto académico de radiología (inglés o español)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200000}
          disabled={loading || extracting}
        />
        <span className={`absolute bottom-3 right-3 text-xs ${charCount > maxChars * 0.9 ? 'text-danger' : 'text-ink-muted'}`}>
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>

      {fileError && (
        <p className={`text-xs ${fileError.startsWith('✅') ? 'text-success' : 'text-danger'}`}>
          {fileError}
        </p>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx,.pptx"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || extracting}
          className="flex items-center gap-2 py-2.5 px-4 border border-secondary-100 bg-white hover:bg-secondary-50 disabled:bg-surface disabled:cursor-not-allowed text-secondary-600 text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          {extracting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-secondary-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Cargando archivo...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Cargar archivo
            </>
          )}
        </button>
        <span className="text-xs text-ink-muted">.pdf .docx .pptx .txt</span>

        <div className="flex-1" />

        {text && (
          <button
            type="button"
            onClick={() => { setText(''); setFileError('') }}
            className="py-2.5 px-4 border border-brand-100 rounded-xl text-ink-muted hover:bg-brand-50 transition-colors text-sm"
          >
            Limpiar
          </button>
        )}

        <button
          type="submit"
          disabled={loading || extracting || text.trim().length < 10}
          className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-surface disabled:text-ink-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Sintetizando...
            </span>
          ) : (
            'Sintetizar texto'
          )}
        </button>
      </div>
    </form>
  )
}
