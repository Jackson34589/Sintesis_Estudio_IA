const COLOR_META = {
  yellow: { label: 'Importante',          emoji: '🟡', bg: 'bg-yellow-50',  border: 'border-yellow-300', text: 'text-yellow-800' },
  red:    { label: 'Crítico para examen', emoji: '🔴', bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800'    },
  blue:   { label: 'Definición / concepto', emoji: '🔵', bg: 'bg-blue-50', border: 'border-blue-300',   text: 'text-blue-800'   },
}

export default function ReviewMode({ highlights, onClose }) {
  const byColor = { yellow: [], red: [], blue: [] }
  for (const h of highlights) {
    if (byColor[h.color]) byColor[h.color].push(h)
  }

  const hasAny = highlights.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">👁️ Modo Repaso</h2>
        <button
          onClick={onClose}
          className="text-sm text-ink-muted hover:text-ink border border-brand-100 hover:bg-brand-50 px-3 py-1 rounded-lg transition-colors"
        >
          Volver a la síntesis
        </button>
      </div>

      {!hasAny ? (
        <div className="text-center py-12 text-ink-muted text-sm">
          <p className="text-3xl mb-3">✏️</p>
          <p>Aún no has resaltado ningún fragmento.</p>
          <p>Vuelve a la síntesis y selecciona los textos importantes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {['red', 'yellow', 'blue'].map((color) => {
            const items = byColor[color]
            if (!items.length) return null
            const meta = COLOR_META[color]
            return (
              <div key={color} className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
                <h3 className={`font-bold text-sm mb-3 ${meta.text}`}>
                  {meta.emoji} {meta.label.toUpperCase()}
                </h3>
                <ul className="space-y-2">
                  {items.map((h) => (
                    <li key={h.id} className={`text-sm leading-relaxed ${meta.text} flex gap-2`}>
                      <span className="mt-1 shrink-0">•</span>
                      <span>{h.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
