import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, RotateCcw } from 'lucide-react'
import SummaryCards from '../results/SummaryCards'
import ReconciliationTable from '../results/ReconciliationTable'
import DiffViewer from '../results/DiffViewer'

export default function Results() {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('drawcheck_result')
    if (stored) {
      setResult(JSON.parse(stored))
      setTimeout(() => setRevealed(true), 100)
    } else {
      navigate('/workspace')
    }
  }, [navigate])

  if (!result) return null

  const total = result.summary.implemented + result.summary.missing + result.summary.partial + result.summary.unauthorized
  const score = total > 0 ? Math.round((result.summary.implemented / Math.max(result.summary.total_requested, 1)) * 100) : 0

  return (
    <div className={`max-w-6xl mx-auto space-y-8 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/workspace')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors glass px-4 py-2 rounded-xl hover:border-blue-500/30"
        >
          <ArrowLeft className="w-4 h-4" /> New Analysis
        </button>
        <div className="flex items-center gap-2">
          {result.demo_mode && (
            <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-full font-medium">
              Demo Mode
            </span>
          )}
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 text-xs glass px-3 py-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-run
          </button>
        </div>
      </div>

      {/* Report header */}
      <div className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <p className="text-xs font-mono text-blue-400 mb-2">RECONCILIATION REPORT</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Analysis Complete
          </h1>
          <p className="text-slate-400">
            {result.summary.total_requested} requested changes · {result.summary.total_diffs} detected diffs
          </p>
          {result.summary.total_requested > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm font-mono text-emerald-400">{score}% match rate</span>
            </div>
          )}
        </div>
      </div>

      <SummaryCards summary={result.summary} />

      {result.processing_notes?.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-2">
          {result.processing_notes.map((note, i) => (
            <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
              {note}
            </p>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Reconciliation Details
        </h2>
        <ReconciliationTable items={result.reconciliation} />
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Visual Diff
        </h2>
        <DiffViewer pageImages={result.page_images} />
      </div>

      {result.detected_diffs?.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">All Detected Changes</h2>
          <div className="grid gap-2">
            {result.detected_diffs.map((diff, i) => (
              <div
                key={diff.id}
                className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl px-4 py-3 text-sm hover:border-blue-500/20 transition-colors stagger-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-lg font-mono border border-blue-500/20">{diff.change_type}</span>
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
