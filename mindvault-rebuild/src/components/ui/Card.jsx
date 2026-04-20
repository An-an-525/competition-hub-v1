import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = true,
  glow = false,
  gradient = false,
  onClick,
  ...props
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : {}}
      className={`
        relative rounded-2xl border border-white/[0.06] p-5
        bg-white/[0.03] backdrop-blur-xl
        transition-all duration-300
        ${hover ? 'hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20' : ''}
        ${glow ? 'hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]' : ''}
        ${gradient ? 'bg-gradient-to-br from-primary-500/10 to-purple-500/5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  )
}
