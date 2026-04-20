import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-[0_0_24px_rgba(99,102,241,0.4)]',
  secondary: 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20',
  ghost: 'text-slate-400 hover:text-white hover:bg-white/5',
  danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-[0_0_24px_rgba(248,113,113,0.4)]',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-[0_0_24px_rgba(52,211,153,0.4)]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}
      {children}
      {Icon && iconPosition === 'right' && !loading && (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      )}
    </motion.button>
  )
}
