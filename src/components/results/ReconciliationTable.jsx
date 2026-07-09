import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'

export default function ReconciliationTable({ items }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Requested Change</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Matched Diff</th>
              <th className="px-4 py-3 font-medium">Location</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <Fragment key={item.id}>
                <tr
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="border-t border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-slate-500">
                    {expanded === item.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.id}</td>
                  <td className="px-4 py-3 text-white max-w-xs">
                    {item.request_description || <span className="text-slate-500 italic">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                    {item.matched_diff || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.location || '—'}</td>
                </tr>
                {expanded === item.id && (
                  <tr className="bg-slate-800/30">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="pl-8 space-y-1 text-xs">
                        <p className="text-slate-400">
                          <span className="text-slate-500">Confidence:</span>{' '}
                          {(item.confidence * 100).toFixed(0)}%
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-500">Evidence:</span> {item.evidence}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
