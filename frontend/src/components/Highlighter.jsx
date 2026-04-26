import { useEffect, useRef, useState } from 'react'

const COLORS = [
  { id: 'yellow', label: 'Importante', bg: 'bg-yellow-200', hex: '#fef08a', emoji: '🟡' },
  { id: 'red',    label: 'Crítico',    bg: 'bg-red-200',    hex: '#fca5a5', emoji: '🔴' },
  { id: 'blue',   label: 'Definición', bg: 'bg-blue-200',   hex: '#93c5fd', emoji: '🔵' },
]

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function Highlighter({ synthesis, highlights, onHighlightsChange, docImages = [] }) {
  const [activeColor, setActiveColor] = useState('yellow')
  const containerRef = useRef(null)

  const addHighlight = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const selectedText = selection.toString().trim()
    if (!selectedText || selectedText.length < 3) return

    const newHighlight = {
      id: `h_${Date.now()}`,
      text: selectedText,
      color: activeColor,
    }
    onHighlightsChange([...highlights, newHighlight])
    selection.removeAllRanges()
  }

  const removeHighlight = (id) => {
    onHighlightsChange(highlights.filter((h) => h.id !== id))
  }

  const buildHtml = () => {
    if (!synthesis) return ''
    let html = synthesis

    // 1. Apply highlights first (over raw text, before image substitution)
    const sorted = [...highlights].reverse()
    for (const hl of sorted) {
      const escaped = escapeRegex(hl.text)
      const regex = new RegExp(`(${escaped})`, 'g')
      html = html.replace(
        regex,
        `<mark class="highlight-${hl.color}" data-id="${hl.id}" title="Clic para quitar resaltado">$1</mark>`
      )
    }

    // 2. Markdown formatting
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')

    // 3. Replace [IMG:N] markers with inline images — each index shown only once
    if (docImages.length > 0) {
      const rendered = new Set()
      html = html.replace(/\[IMG:(\d+)\]/g, (_, n) => {
        const idx = parseInt(n) - 1
        if (rendered.has(idx)) return ''   // skip duplicates
        rendered.add(idx)
        const img = docImages[idx]
        if (!img) return ''
        return `
          <figure class="synthesis-figure">
            <img
              src="data:image/png;base64,${img.data}"
              alt="${img.label}"
              class="synthesis-img"
            />
            <figcaption class="synthesis-figcaption">${img.label}</figcaption>
          </figure>`
      })
    }

    return html
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleClick = (e) => {
      const mark = e.target.closest('mark[data-id]')
      if (mark) {
        e.preventDefault()
        removeHighlight(mark.getAttribute('data-id'))
      }
    }
    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  })

  return (
    <div className="space-y-3">
      {/* Color picker — sticky mientras se lee la síntesis */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-brand-100 rounded-xl px-3 py-2 shadow-sm flex gap-2 flex-wrap items-center">
        <span className="text-xs text-ink-muted font-medium">Resaltar:</span>
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveColor(c.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
              activeColor === c.id
                ? 'border-brand-700 shadow-sm scale-105'
                : 'border-transparent hover:border-brand-200'
            } ${c.bg}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
        {highlights.length > 0 && (
          <button
            onClick={() => onHighlightsChange([])}
            className="ml-auto text-xs text-danger/70 hover:text-danger transition-colors"
          >
            Quitar todos
          </button>
        )}
      </div>

      {/* Synthesis with inline images and highlights */}
      <div
        ref={containerRef}
        id="synthesis-content"
        className="synthesis-content bg-white border border-brand-100 rounded-xl p-5 leading-relaxed min-h-[300px] cursor-text select-text shadow-sm"
        style={{ fontSize: '0.8rem' }}
        onMouseUp={addHighlight}
        onTouchEnd={addHighlight}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      <p className="text-xs text-ink-muted">
        Selecciona texto para resaltarlo. Haz clic sobre un resaltado para quitarlo.
      </p>
    </div>
  )
}
