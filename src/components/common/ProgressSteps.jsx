import { Loader2 } from 'lucide-react'
import { STEPS } from '../../utils/constants'

export default function ProgressSteps({ currentStep }) {
  return (
    <div className="w-full space-y-5">
      {STEPS.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={step} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-500
              ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                active ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white progress-glow' :
                'bg-slate-800 text-slate-500 border border-slate-700'}`}>
              {done ? '✓' : active ? <Loader2 className="w-5 h-5 animate-spin" /> : i + 1}
            </div>
            <div className="flex-1">
              <span className={`text-sm block transition-colors duration-300
                ${active ? 'text-white font-semibold' : done ? 'text-emerald-400' : 'text-slate-500'}`}>
                {step}
              </span>
              {active && (
                <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse w-2/3" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
