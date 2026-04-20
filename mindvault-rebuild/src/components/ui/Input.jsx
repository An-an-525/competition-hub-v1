import { useState } from 'react'

export default function Input({
  label,
  type = 'text',
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            focused ? 'text-primary-400' : 'text-slate-500'
          }`}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`
            w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm
            px-4 py-2.5 text-sm text-slate-100
            placeholder:text-slate-500
            transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_16px_rgba(248,113,113,0.15)]'
              : 'border-white/[0.06] focus:border-primary-500/50 focus:shadow-[0_0_16px_rgba(99,102,241,0.15)]'
            }
            focus:outline-none
          `}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
