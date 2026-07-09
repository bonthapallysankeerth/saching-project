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
      {cards.map(({ key, count }, i) => {
        const config = STATUS_CONFIG[key]
        return (
          <div
            key={key}
            className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.03] cursor-default stagger-in ${config.color}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-3xl">{config.icon}</span>
              <span className="text-4xl font-extrabold tabular-nums">{count}</span>
            </div>
            <p className="text-sm font-semibold">{config.label}</p>
          </div>
        )
      })}
    </div>
  )
}
