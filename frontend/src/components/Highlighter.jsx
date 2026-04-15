import { useEffect, useRef, useState } from 'react'

const COLORS = [
  { id: 'yellow', label: 'Importante', bg: 'bg-yellow-200', hex: '#fef08a', emoji: '🟡' },
  { id: 'red',    label: 'Crítico',    bg: 'bg-red-200',    hex: '#fca5a5', emoji: '🔴' },
  { id: 'blue',   label: 'Definición', bg: 'bg-blue-200',   hex: '#93c5fd', emoji: '🔵' },
]

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function Highlighter({ synthesis, highlights, onHighlightsChange }) {
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

  // Build HTML with highlights applied
  const buildHtml = () => {
    if (!synthesis) return ''
    let html = synthesis

    // Apply highlights in reverse order to avoid offset conflicts
    const sorted = [...highlights].reverse()
    for (const hl of sorted) {
      const escaped = escapeRegex(hl.text)
      const regex = new RegExp(`(${escaped})`, 'g')
      html = html.replace(
        regex,
        `<mark class="highlight-${hl.color}" data-id="${hl.id}" title="Clic para quitar resaltado">$1</mark>`
      )
    }

    // Basic markdown-like formatting
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')

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
      {/* Color picker */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-slate-500 font-medium">Resaltar con:</span>
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveColor(c.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
              activeColor === c.id
                ? 'border-slate-700 shadow-sm scale-105'
                : 'border-transparent hover:border-slate-300'
            } ${c.bg}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
        {highlights.length > 0 && (
          <button
            onClick={() => onHighlightsChange([])}
            className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Quitar todos
          </button>
        )}
      </div>

      {/* Synthesis with highlights */}
      <div
        ref={containerRef}
        id="synthesis-content"
        className="synthesis-content bg-white border border-slate-200 rounded-xl p-5 text-sm leading-relaxed min-h-[300px] cursor-text select-text shadow-sm"
        onMouseUp={addHighlight}
        onTouchEnd={addHighlight}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      <p className="text-xs text-slate-400">
        Selecciona texto para resaltarlo. Haz clic sobre un resaltado para quitarlo.
      </p>
    </div>
  )
}
