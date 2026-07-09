import { useState } from 'react'

export default function DiffViewer({ pageImages }) {
  const [page, setPage] = useState(0)
  const [view, setView] = useState('overlay')

  if (!pageImages || pageImages.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center">
        <p className="text-slate-400 text-sm">No page images available.</p>
        <p className="text-slate-500 text-xs mt-1">Run analysis with real PDFs to see the visual diff.</p>
      </div>
    )
  }

  const current = pageImages[page]
  const views = [
    { key: 'rev_a', label: 'Rev A', src: current.rev_a },
    { key: 'rev_b', label: 'Rev B', src: current.rev_b },
    { key: 'overlay', label: 'Diff Overlay', src: current.diff_overlay },
  ]

  const activeSrc = views.find((v) => v.key === view)?.src

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${view === v.key ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {pageImages.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-xs text-slate-400">Page {page + 1} / {pageImages.length}</span>
            <button
              disabled={page === pageImages.length - 1}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-auto max-h-[500px]">
        {activeSrc ? (
          <img src={`data:image/png;base64,${activeSrc}`} alt={view} className="w-full" />
        ) : (
          <div className="p-12 text-center text-slate-500 text-sm">No image for this view</div>
        )}
      </div>
    </div>
  )
}
