import { useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { exportPptx } from '../services/api'

export default function ExportButton({ synthesis, highlights }) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingPptx, setLoadingPptx] = useState(false)
  const [error, setError] = useState('')

  const handleExportPDF = async () => {
    setLoadingPdf(true)
    setError('')
    try {
      const element = document.getElementById('synthesis-content')
      if (!element) throw new Error('No se encontró el contenido')
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let y = 10
      let remainingHeight = imgHeight
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight)
        remainingHeight -= pageHeight - 20
        if (remainingHeight > 0) {
          pdf.addPage()
          y = -(imgHeight - remainingHeight) - 10
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExportPDF}
          disabled={loadingPdf}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          {loadingPdf ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Exportando PDF...
            </>
          ) : '📄 Exportar PDF'}
        </button>

        <button
          onClick={handleExportPPTX}
          disabled={loadingPptx}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          {loadingPptx ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Exportando PPTX...
            </>
          ) : '📊 Exportar PPTX'}
        </button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {highlights.length > 0 && (
        <p className="text-xs text-slate-400">
          El PDF incluirá los {highlights.length} resaltado{highlights.length !== 1 ? 's' : ''} en color.
        </p>
      )}
    </div>
  )
}
