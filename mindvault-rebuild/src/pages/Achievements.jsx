import { motion } from 'framer-motion'
import {
  Award, UserPlus, Lightbulb, Target, BookOpen, Flame,
  Crown, Trophy, Brain, Bot, FileCheck, RefreshCw,
  Lock, Unlock
} from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { formatFullDate } from '../utils/ai'

const iconMap = {
  UserPlus, Lightbulb, Target, BookOpen, Flame, Crown, Trophy, Brain, Bot, FileCheck, RefreshCw,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Achievements() {
  const { achievements } = useStore()
  const unlocked = achievements.filter(a => a.unlockedAt)
  const locked = achievements.filter(a => !a.unlockedAt)
  const progress = Math.round((unlocked.length / achievements.length) * 100)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-slate-100">成就系统</h1>
        <p className="text-slate-400 text-sm mt-1">已解锁 {unlocked.length} / {achievements.length} 个成就</p>
      </motion.div>

      {/* Progress Overview */}
      <motion.div variants={item}>
        <Card hover={false} gradient>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center">
                <Trophy size={32} className="text-primary-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-dark-600 border-2 border-primary-500 flex items-center justify-center">
                <span className="text-xs font-bold text-primary-400">{progress}%</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">成就进度</h2>
              <p className="text-sm text-slate-400 mt-1">
                你已经解锁了 {unlocked.length} 个成就，继续努力！
              </p>
              <div className="flex gap-4 mt-3">
                <div>
                  <span className="text-lg font-bold text-emerald-400">{unlocked.length}</span>
                  <span className="text-xs text-slate-500 ml-1">已解锁</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-slate-500">{locked.length}</span>
                  <span className="text-xs text-slate-500 ml-1">未解锁</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Unlocked Achievements */}
      {unlocked.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">已解锁</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Award
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Card className="overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-500" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center shrink-0">
                        <Icon size={22} className="text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">{achievement.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{achievement.description}</p>
                        <p className="text-xs text-slate-500 mt-2">{formatFullDate(achievement.unlockedAt)}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-lg font-semibold text-slate-400 mb-4">未解锁</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Award
              return (
                <motion.div key={achievement.id} whileHover={{ scale: 1.02 }}>
                  <Card className="opacity-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Icon size={22} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-500">{achievement.title}</h3>
                          <Lock size={12} className="text-slate-600" />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{achievement.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
