import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import AIAssistant from './AIAssistant'
import useStore from '../../store/useStore'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useStore()
  const sidebarWidth = settings.sidebarCollapsed ? 72 : 260

  return (
    <div className="min-h-screen bg-dark-900 bg-grid">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div
        className="transition-all duration-300"
        style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : 0 }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <BottomNav />
      <AIAssistant />
    </div>
  )
}
