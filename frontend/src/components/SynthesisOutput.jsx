import { useState } from 'react'
import Highlighter from './Highlighter'
import ReviewMode from './ReviewMode'
import QuizPanel from './QuizPanel'
import ExportButton from './ExportButton'
import ImageGallery from './ImageGallery'

export default function SynthesisOutput({ synthesis, detectedLanguage, cached, textHash, docImages = [] }) {
  const [highlights, setHighlights] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('highlights') || '{}')
      return stored[textHash] || []
    } catch {
      return []
    }
  })
  const [view, setView] = useState('synthesis') // 'synthesis' | 'review' | 'quiz'

  const updateHighlights = (newHighlights) => {
    setHighlights(newHighlights)
    try {
      const stored = JSON.parse(localStorage.getItem('highlights') || '{}')
      stored[textHash] = newHighlights
      localStorage.setItem('highlights', JSON.stringify(stored))
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            🌐 Detectado: {detectedLanguage}
          </span>
          {cached && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ⚡ Desde caché
            </span>
          )}
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            ✏️ {highlights.length} resaltado{highlights.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action tabs */}
        <div className="flex gap-1">
          {[
            { id: 'synthesis', label: '📄 Síntesis' },
            { id: 'review',    label: '👁️ Repaso' },
            { id: 'quiz',      label: '❓ Quiz' },
            ...(docImages.length > 0 ? [{ id: 'images', label: `🖼️ Imágenes (${docImages.length})` }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                view === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {view === 'synthesis' && (
        <>
          <Highlighter
            synthesis={synthesis}
            highlights={highlights}
            onHighlightsChange={updateHighlights}
            docImages={docImages}
          />
          <ExportButton synthesis={synthesis} highlights={highlights} docImages={docImages} />
        </>
      )}
      {view === 'review' && (
        <ReviewMode highlights={highlights} onClose={() => setView('synthesis')} />
      )}
      {view === 'quiz' && (
        <QuizPanel highlights={highlights} onClose={() => setView('synthesis')} />
      )}
      {view === 'images' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-700">🖼️ Imágenes del documento</h2>
            <button
              onClick={() => setView('synthesis')}
              className="text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
          <ImageGallery images={docImages} />
        </div>
      )}
    </div>
  )
}
