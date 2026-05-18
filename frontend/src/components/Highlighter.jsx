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
  const containerRef = useRef(null)
  const [floatingBar, setFloatingBar] = useState(null) // { top, left, text } | null

  // --- Selection handling ---

  const showFloatingBar = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const text = selection.toString().trim()
    if (text.length < 3) return
    if (!containerRef.current?.contains(selection.anchorNode)) return

    try {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const barW = 220
      const barH = 52

      // Prefer showing above; fall back to below if near top of screen
      let top = rect.top - barH - 10
      if (top < 56) top = rect.bottom + 10

      let left = rect.left + rect.width / 2 - barW / 2
      left = Math.max(8, Math.min(left, window.innerWidth - barW - 8))

      setFloatingBar({ top, left, text })
    } catch {
      // getBoundingClientRect can fail in some edge cases — ignore
    }
  }

  const applyHighlight = (colorId) => {
    if (!floatingBar?.text) return
    onHighlightsChange([
      ...highlights,
      { id: `h_${Date.now()}`, text: floatingBar.text, color: colorId },
    ])
    window.getSelection()?.removeAllRanges()
    setFloatingBar(null)
  }

  const removeHighlight = (id) => {
    onHighlightsChange(highlights.filter((h) => h.id !== id))
  }

  // Hide floating bar when user taps outside it
  useEffect(() => {
    const hide = (e) => {
      if (!e.target.closest('[data-floating-bar]')) setFloatingBar(null)
    }
    document.addEventListener('pointerdown', hide)
    return () => document.removeEventListener('pointerdown', hide)
  }, [])

  // Remove highlight on click/tap
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onTap = (e) => {
      const mark = e.target.closest('mark[data-id]')
      if (mark) { e.preventDefault(); removeHighlight(mark.getAttribute('data-id')) }
    }
    container.addEventListener('click', onTap)
    return () => container.removeEventListener('click', onTap)
  })

  // --- HTML builder ---

  const buildHtml = () => {
    if (!synthesis) return ''
    let html = synthesis

    // Apply highlights
    for (const hl of [...highlights].reverse()) {
      const regex = new RegExp(`(${escapeRegex(hl.text)})`, 'g')
      html = html.replace(
        regex,
        `<mark class="highlight-${hl.color}" data-id="${hl.id}" title="Toca para quitar">$1</mark>`,
      )
    }

    // Markdown → HTML
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')

    // [IMG:N] markers
    if (docImages.length > 0) {
      const rendered = new Set()
      html = html.replace(/\[IMG:(\d+)\]/g, (_, n) => {
        const idx = parseInt(n) - 1
        if (rendered.has(idx)) return ''
        rendered.add(idx)
        const img = docImages[idx]
        if (!img) return ''
        return `<figure class="synthesis-figure">
          <img src="data:image/png;base64,${img.data}" alt="${img.label}" class="synthesis-img" />
          <figcaption class="synthesis-figcaption">${img.label}</figcaption>
        </figure>`
      })
    }

    return html
  }

  // --- Render ---

  return (
    <div className="space-y-3">

      {/* ── Floating color bar — appears above the selected text ── */}
      {floatingBar && (
        <div
          data-floating-bar
          className="fixed z-50 flex items-center gap-1 bg-white border border-brand-200 rounded-2xl shadow-xl px-2 py-1.5"
          style={{ top: floatingBar.top, left: floatingBar.left, width: 220 }}
        >
          <span className="text-xs text-ink-muted px-1 shrink-0">Resaltar:</span>
          {COLORS.map((c) => (
            <button
              key={c.id}
              // preventDefault on BOTH events keeps the text selection alive
              // until we read it — critical on mobile
              onMouseDown={(e) => { e.preventDefault(); applyHighlight(c.id) }}
              onTouchStart={(e) => { e.preventDefault(); applyHighlight(c.id) }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold active:scale-95 transition-transform ${c.bg}`}
              title={c.label}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}

      {/* ── Sticky status bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-brand-100 rounded-xl px-3 py-2.5 shadow-sm flex flex-wrap gap-2 items-center">
        <span className="text-xs text-ink-muted">
          {floatingBar
            ? '✏️ Elige un color arriba'
            : '📌 Mantén pulsado para seleccionar · luego elige color'}
        </span>
        {highlights.length > 0 && (
          <>
            <span className="text-xs text-ink-muted">
              · {highlights.length} resaltado{highlights.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onHighlightsChange([])}
              className="ml-auto text-xs text-danger/70 hover:text-danger transition-colors"
            >
              Quitar todos
            </button>
          </>
        )}
      </div>

      {/* ── Synthesis content ── */}
      <div
        ref={containerRef}
        id="synthesis-content"
        className="synthesis-content bg-white border border-brand-100 rounded-xl p-5 leading-relaxed min-h-[300px] cursor-text select-text shadow-sm"
        style={{ fontSize: '0.8rem' }}
        onMouseUp={showFloatingBar}
        onTouchEnd={showFloatingBar}
        dangerouslySetInnerHTML={{ __html: buildHtml() }}
      />

      <p className="text-xs text-ink-muted">
        Toca un resaltado para quitarlo.
      </p>
    </div>
  )
}
