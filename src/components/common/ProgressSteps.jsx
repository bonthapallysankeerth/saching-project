import { Loader2 } from 'lucide-react'
import { STEPS } from '../../utils/constants'

export default function ProgressSteps({ currentStep }) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {STEPS.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
              ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {done ? '✓' : active ? <Loader2 className="w-4 h-4 animate-spin" /> : i + 1}
            </div>
            <span className={`text-sm ${active ? 'text-white font-medium' : done ? 'text-emerald-400' : 'text-slate-500'}`}>
              {step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
