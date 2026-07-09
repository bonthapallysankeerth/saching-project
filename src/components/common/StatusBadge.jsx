import { STATUS_CONFIG } from '../../utils/constants'

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.missing
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
