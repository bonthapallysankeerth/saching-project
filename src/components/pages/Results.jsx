import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import SummaryCards from '../results/SummaryCards'
import ReconciliationTable from '../results/ReconciliationTable'
import DiffViewer from '../results/DiffViewer'

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('drawcheck_result')
    if (stored) {
      setResult(JSON.parse(stored))
    } else {
      navigate('/')
    }
  }, [navigate])

  if (!result) return null

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> New Analysis
        </button>
        {result.demo_mode && (
          <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Reconciliation Report</h1>
        <p className="text-slate-400 text-sm mt-1">
          {result.summary.total_requested} requested changes · {result.summary.total_diffs} detected diffs
        </p>
      </div>

      <SummaryCards summary={result.summary} />

      {result.processing_notes?.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-1">
          {result.processing_notes.map((note, i) => (
            <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
              {note}
            </p>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Reconciliation Details</h2>
        <ReconciliationTable items={result.reconciliation} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Visual Diff</h2>
        <DiffViewer pageImages={result.page_images} />
      </div>

      {result.detected_diffs?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">All Detected Changes</h2>
          <div className="grid gap-2">
            {result.detected_diffs.map((diff) => (
              <div key={diff.id} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3 text-sm">
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{diff.change_type}</span>
                <span className="text-white flex-1">{diff.description}</span>
                <span className="text-slate-500 text-xs">{diff.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
