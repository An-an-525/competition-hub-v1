import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Lightbulb, Target, Brain
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '首页' },
  { path: '/thoughts', icon: Lightbulb, label: '想法' },
  { path: '/goals', icon: Target, label: '目标' },
  { path: '/review', icon: Brain, label: '复习' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-white/[0.06] bg-dark-900/80 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl
              text-xs font-medium transition-colors
              ${isActive ? 'text-primary-400' : 'text-slate-500'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottomnav-active"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary-500"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <item.icon size={20} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
