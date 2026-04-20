import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Zap, Lightbulb, Target,
  BookOpen, FolderOpen, Award, RefreshCw, Settings,
  ChevronLeft, ChevronRight, Brain, X
} from 'lucide-react'
import useStore from '../../store/useStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/profile', icon: User, label: '个人画像' },
  { path: '/skills', icon: Zap, label: '技能库' },
  { path: '/thoughts', icon: Lightbulb, label: '想法记录' },
  { path: '/goals', icon: Target, label: '目标管理' },
  { path: '/sources', icon: BookOpen, label: '信息渠道' },
  { path: '/files', icon: FolderOpen, label: '文件管理' },
  { path: '/achievements', icon: Award, label: '成就系统' },
  { path: '/review', icon: RefreshCw, label: '复习回顾' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { settings, toggleSidebar } = useStore()
  const collapsed = settings.sidebarCollapsed
  const location = useLocation()

  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} px-4 h-16 border-b border-white/[0.06]`}>
        {!collapsed || isMobile ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">MindVault</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
        )}

        {isMobile ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={18} />
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </motion.button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? onCloseMobile : undefined}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-200
                ${collapsed && !isMobile ? 'justify-center' : ''}
                ${isActive
                  ? 'text-white bg-primary-500/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/15 to-purple-500/10 border border-primary-500/20"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <item.icon size={18} className="relative z-10 shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="relative z-10">{item.label}</span>
              )}
              {isActive && (!collapsed || isMobile) && (
                <motion.div
                  layoutId="sidebar-dot"
                  className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="rounded-xl bg-gradient-to-br from-primary-500/10 to-purple-500/5 border border-primary-500/10 p-4">
            <p className="text-xs text-slate-400 mb-1">MindVault AI</p>
            <p className="text-xs text-slate-500">智能知识管理助手</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 border-r border-white/[0.06] bg-dark-900/80 backdrop-blur-2xl"
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] border-r border-white/[0.06] bg-dark-900/95 backdrop-blur-2xl lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
