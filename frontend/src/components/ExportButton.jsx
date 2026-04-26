import { useState } from 'react'
import { exportPptx } from '../services/api'

export default function ExportButton({ synthesis, highlights, docImages = [] }) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingPptx, setLoadingPptx] = useState(false)
  const [error, setError] = useState('')

  const handleExportPDF = async () => {
    setLoadingPdf(true)
    setError('')
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const usableW = pageW - margin * 2
      const usablePageH = pageH - margin * 2

      const element = document.getElementById('synthesis-content')
      if (!element) throw new Error('No se encontró el contenido')

      const containerTop = element.getBoundingClientRect().top
      const figureRelBounds = Array.from(element.querySelectorAll('figure.synthesis-figure'))
        .map(fig => {
          const r = fig.getBoundingClientRect()
          return { top: r.top - containerTop, bottom: r.bottom - containerTop }
        })

      const canvas = await html2canvas(element, { scale: 2, useCORS: true })

      const canvasScale  = canvas.height / element.scrollHeight
      const pxPerMm      = canvas.width / usableW
      const pageHeightPx = usablePageH * pxPerMm

      const figureBounds = figureRelBounds.map(b => ({
        top: b.top * canvasScale, bottom: b.bottom * canvasScale,
      }))

      function avoidFigures(srcY, desiredEnd) {
        let sliceEnd = desiredEnd
        let changed = true
        while (changed) {
          changed = false
          for (const fig of figureBounds) {
            if (fig.top > srcY && fig.top < sliceEnd && fig.bottom > sliceEnd) {
              sliceEnd = fig.top
              changed = true
              break
            }
          }
        }
        return sliceEnd > srcY ? sliceEnd : desiredEnd
      }

      const canvasCtx = canvas.getContext('2d')
      function snapToWhiteRow(srcY, sliceEnd, searchPx = 60) {
        const searchFrom = Math.max(srcY + 1, Math.floor(sliceEnd) - searchPx)
        const regionH    = Math.floor(sliceEnd) - searchFrom + 1
        if (regionH <= 0) return sliceEnd

        const { data } = canvasCtx.getImageData(0, searchFrom, canvas.width, regionH)
        const W = canvas.width

        for (let dy = 0; dy <= regionH; dy++) {
          const rowY = Math.floor(sliceEnd) - dy
          if (rowY <= srcY) break
          const rowOffset = (rowY - searchFrom) * W * 4
          let white = 0
          for (let x = 0; x < W; x++) {
            const i = rowOffset + x * 4
            if (data[i] >= 248 && data[i + 1] >= 248 && data[i + 2] >= 248) white++
          }
          if (white / W >= 0.97) return rowY
        }
        return sliceEnd
      }

      let srcY = 0
      let firstPage = true

      while (srcY < canvas.height) {
        if (!firstPage) pdf.addPage()
        firstPage = false

        const desiredEnd = srcY + pageHeightPx

        let sliceEnd
        if (desiredEnd >= canvas.height) {
          sliceEnd = canvas.height
        } else {
          const afterFigures = avoidFigures(srcY, desiredEnd)
          sliceEnd = snapToWhiteRow(srcY, afterFigures)
        }

        const actualH = sliceEnd - srcY
        if (actualH <= 0) break

        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width  = canvas.width
        sliceCanvas.height = actualH
        sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, actualH, 0, 0, canvas.width, actualH)

        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, usableW, actualH / pxPerMm)
        srcY = sliceEnd
      }

      if (docImages.length > 0) {
        pdf.addPage()
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Imágenes del documento', pageW / 2, 20, { align: 'center' })
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${docImages.length} imagen${docImages.length !== 1 ? 'es' : ''} extraída${docImages.length !== 1 ? 's' : ''}`, pageW / 2, 28, { align: 'center' })

        let yPos = 38

        for (let i = 0; i < docImages.length; i++) {
          const img = docImages[i]
          const imgEl = new Image()
          imgEl.src = `data:image/png;base64,${img.data}`
          await new Promise((resolve) => { imgEl.onload = resolve })

          const maxImgW = pageW - margin * 2
          const maxImgH = pageH - margin * 2 - 20
          const ratio = imgEl.naturalWidth / imgEl.naturalHeight
          let drawW = maxImgW
          let drawH = drawW / ratio
          if (drawH > maxImgH) {
            drawH = maxImgH
            drawW = drawH * ratio
          }

          if (yPos + drawH + 10 > pageH - margin) {
            pdf.addPage()
            yPos = margin
          }

          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.text(img.label, margin, yPos)
          yPos += 5

          const xPos = margin + (maxImgW - drawW) / 2
          pdf.addImage(`data:image/png;base64,${img.data}`, 'PNG', xPos, yPos, drawW, drawH)
          yPos += drawH + 10
        }
      }

      pdf.save('sintesis-radiologia.pdf')
    } catch (e) {
      setError('Error al exportar PDF: ' + e.message)
    } finally {
      setLoadingPdf(false)
    }
  }

  const handleExportPPTX = async () => {
    setLoadingPptx(true)
    setError('')
    try {
      await exportPptx(synthesis, 'Síntesis RadioSíntesis AI')
    } catch (e) {
      setError('Error al exportar PPTX: ' + e.message)
    } finally {
      setLoadingPptx(false)
    }
  }

  const spinner = (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExportPDF}
          disabled={loadingPdf}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-surface disabled:text-ink-muted text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          {loadingPdf ? <>{spinner} Exportando PDF...</> : '📄 Exportar PDF'}
        </button>

        <button
          onClick={handleExportPPTX}
          disabled={loadingPptx}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-600 hover:bg-secondary-700 disabled:bg-surface disabled:text-ink-muted text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          {loadingPptx ? <>{spinner} Exportando PPTX...</> : '📊 Exportar PPTX'}
        </button>
      </div>

      {error && <p className="text-danger text-xs">{error}</p>}

      <p className="text-xs text-ink-muted">
        {[
          highlights.length > 0 && `${highlights.length} resaltado${highlights.length !== 1 ? 's' : ''}`,
          docImages.length > 0 && `${docImages.length} imagen${docImages.length !== 1 ? 'es' : ''}`,
        ].filter(Boolean).join(' · ') || 'Síntesis sin resaltados'}
        {' '}incluido{docImages.length !== 1 ? 's' : ''} en el PDF.
      </p>
    </div>
  )
}
