import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  gradient: string
}

export default function StatsCard({ title, value, icon: Icon, trend, gradient }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
      <p className="text-4xl font-bold text-gray-900 mb-3 tabular-nums break-words max-w-full">
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </p>
      {trend && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`font-semibold tabular-nums ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
          </div>
          <span className="text-gray-500">من الشهر الماضي</span>
        </div>
      )}
    </div>
  )
}
