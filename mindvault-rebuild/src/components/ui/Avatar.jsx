import { User } from 'lucide-react'

export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  }

  const initials = name
    ? name.slice(0, 2).toUpperCase()
    : ''

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        rounded-full
        bg-gradient-to-br from-primary-500 to-purple-500
        p-[2px]
        ${className}
      `}
      {...props}
    >
      <div className={`rounded-full bg-dark-600 flex items-center justify-center ${sizes[size]}`}>
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : initials ? (
          <span className="font-semibold text-white">{initials}</span>
        ) : (
          <User className="text-slate-400" size={size === 'sm' ? 14 : size === 'lg' ? 24 : size === 'xl' ? 32 : 18} />
        )}
      </div>
    </div>
  )
}
