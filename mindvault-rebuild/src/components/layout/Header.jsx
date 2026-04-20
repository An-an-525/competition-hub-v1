import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, Bell, Command } from 'lucide-react'
import useStore from '../../store/useStore'

export default function Header({ onMenuClick }) {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen])

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-white/[0.06] bg-dark-900/60 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </motion.button>

          {/* Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:border-white/[0.12] hover:text-slate-400 transition-all text-sm min-w-[200px] lg:min-w-[300px]"
          >
            <Search size={14} />
            <span>搜索...</span>
            <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-slate-600">
              <Command size={12} />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
          </motion.button>
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && mounted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 p-4 border-b border-white/[0.06] bg-dark-900/95 backdrop-blur-2xl"
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] focus-within:border-primary-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all">
                <Search size={18} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索技能、想法、目标..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                  autoFocus
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-500 border border-white/[0.06]">
                  ESC
                </kbd>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
