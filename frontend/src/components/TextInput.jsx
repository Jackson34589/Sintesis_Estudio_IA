import { useRef, useState } from 'react'
import { extractTextFromFile } from '../services/api'

export default function TextInput({ onSubmit, loading }) {
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
      const ext = file.name.split('.').pop().toUpperCase()
      if (data.pages) {
        setFileError(`✅ ${ext} cargado — ${data.pages} página${data.pages !== 1 ? 's' : ''}`)
      } else {
        setFileError(`✅ Archivo cargado`)
      }
    } catch (err) {
      setFileError('⚠️ ' + err.message)
    } finally {
      setExtracting(false)
      // Reset so the same file can be re-selected
      e.target.value = ''
    }
  }

  const charCount = text.length
  const maxChars = 50000

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          className="w-full h-52 p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed bg-white shadow-sm"
          placeholder="Pega aquí tu texto académico de radiología (inglés o español)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={maxChars}
          disabled={loading || extracting}
        />
        <span className={`absolute bottom-3 right-3 text-xs ${charCount > maxChars * 0.9 ? 'text-red-400' : 'text-slate-400'}`}>
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>

      {/* File error / success message */}
      {fileError && (
        <p className={`text-xs ${fileError.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
          {fileError}
        </p>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {/* File upload button */}
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
          className="flex items-center gap-2 py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-600 text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          {extracting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
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
        <span className="text-xs text-slate-400">.pdf .docx .pptx .txt</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear */}
        {text && (
          <button
            type="button"
            onClick={() => { setText(''); setFileError('') }}
            className="py-2.5 px-4 border border-slate-300 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors text-sm"
          >
            Limpiar
          </button>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || extracting || text.trim().length < 10}
          className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
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
