import { motion } from 'framer-motion'

export default function Progress({
  value = 0,
  max = 100,
  size = 'md',
  showLabel = true,
  color,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const defaultColor = percentage >= 80 ? '#34d399'
    : percentage >= 60 ? '#22d3ee'
    : percentage >= 40 ? '#6366f1'
    : percentage >= 20 ? '#fbbf24'
    : '#f87171'

  const barColor = color || defaultColor

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">进度</span>
          <span className="text-xs font-medium text-slate-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-white/[0.06] overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full`}
          style={{
            background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
            boxShadow: `0 0 12px ${barColor}40`,
          }}
        />
      </div>
    </div>
  )
}
