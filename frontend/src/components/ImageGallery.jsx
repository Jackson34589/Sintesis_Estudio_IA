import { useState } from 'react'

export default function ImageGallery({ images }) {
  const [selected, setSelected] = useState(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Imágenes del documento ({images.length})
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(img)}
              className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-brand-400 transition-all shadow-sm bg-white"
            >
              <img
                src={`data:image/png;base64,${img.data}`}
                alt={img.label}
                className="w-full object-cover h-32 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                {img.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">{selected.label}</span>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] p-2 bg-slate-50">
              <img
                src={`data:image/png;base64,${selected.data}`}
                alt={selected.label}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
