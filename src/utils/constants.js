export const STATUS_CONFIG = {
  implemented: {
    label: 'Implemented',
    icon: '✅',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  missing: {
    label: 'Missing',
    icon: '⚠️',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  partial: {
    label: 'Partial',
    icon: '🔁',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  unauthorized: {
    label: 'Unauthorized',
    icon: '🚩',
    color: 'bg-red-500/15 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
  },
}

export const STEPS = [
  'Rendering PDFs',
  'Detecting visual changes',
  'Parsing change request',
  'Reconciling results',
]
