import { STATUS_CONFIG } from '../../utils/constants'

export default function SummaryCards({ summary }) {
  const cards = [
    { key: 'implemented', count: summary.implemented },
    { key: 'missing', count: summary.missing },
    { key: 'partial', count: summary.partial },
    { key: 'unauthorized', count: summary.unauthorized },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, count }) => {
        const config = STATUS_CONFIG[key]
        return (
          <div key={key} className={`rounded-xl border p-4 ${config.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{config.icon}</span>
              <span className="text-3xl font-bold">{count}</span>
            </div>
            <p className="text-sm font-medium mt-2">{config.label}</p>
          </div>
        )
      })}
    </div>
  )
}
