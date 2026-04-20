const variants = {
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/20',
  secondary: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  danger: 'bg-red-500/15 text-red-300 border-red-500/20',
  info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  pink: 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  default: 'bg-white/5 text-slate-400 border-white/10',
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
        text-xs font-medium border
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
