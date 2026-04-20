import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = '暂无数据',
  description = '这里还没有任何内容',
  action,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex flex-col items-center justify-center py-16 px-4
        text-center ${className}
      `}
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <Icon size={32} className="text-slate-500" />
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/5 to-purple-500/5 blur-xl" />
      </div>
      <h3 className="text-base font-medium text-slate-300 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>
      {action}
    </motion.div>
  )
}
