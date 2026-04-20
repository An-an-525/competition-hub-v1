import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap, Target, Lightbulb, Award, TrendingUp,
  ArrowRight, Sparkles, Plus, Clock
} from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Progress from '../components/ui/Progress'
import Badge from '../components/ui/Badge'
import { getGreeting, formatDate } from '../utils/ai'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Dashboard() {
  const { profile, skills, thoughts, goals, achievements } = useStore()

  const stats = [
    { label: '技能', value: skills.length, icon: Zap, color: 'from-cyan-500/20 to-blue-500/10', iconColor: 'text-cyan-400', link: '/skills' },
    { label: '目标', value: goals.filter(g => g.status === 'active').length, icon: Target, color: 'from-purple-500/20 to-pink-500/10', iconColor: 'text-purple-400', link: '/goals' },
    { label: '想法', value: thoughts.length, icon: Lightbulb, color: 'from-amber-500/20 to-orange-500/10', iconColor: 'text-amber-400', link: '/thoughts' },
    { label: '成就', value: achievements.filter(a => a.unlockedAt).length, icon: Award, color: 'from-emerald-500/20 to-teal-500/10', iconColor: 'text-emerald-400', link: '/achievements' },
  ]

  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3)
  const recentThoughts = thoughts.slice(0, 4)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-100">
          {getGreeting()}，<span className="gradient-text">{profile.name}</span>
        </h1>
        <p className="text-slate-400 mt-1">欢迎回到 MindVault，继续你的学习之旅</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card hover className={`relative overflow-hidden bg-gradient-to-br ${stat.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-white/5 ${stat.iconColor}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Thoughts */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card hover={false} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">最近想法</h2>
              <Link to="/thoughts" className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>
            {recentThoughts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">还没有记录想法</div>
            ) : (
              <div className="space-y-3">
                {recentThoughts.map((thought) => (
                  <div key={thought.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb size={14} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 line-clamp-2">{thought.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {thought.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                        <span className="text-xs text-slate-500 ml-auto">{formatDate(thought.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Goal Progress */}
        <motion.div variants={item}>
          <Card hover={false} className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">目标进度</h2>
              <Link to="/goals" className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                全部 <ArrowRight size={14} />
              </Link>
            </div>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">还没有设定目标</div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200 truncate">{goal.title}</p>
                      <span className="text-xs text-slate-500">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} showLabel={false} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div variants={item}>
        <Card gradient glow>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={22} className="text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-100 mb-1">AI 智能推荐</h3>
              <p className="text-sm text-slate-400 mb-3">
                基于你的技能和目标，AI 为你推荐以下学习方向：
              </p>
              <div className="flex flex-wrap gap-2">
                {['系统设计', '云原生', '机器学习基础', 'TypeScript 进阶'].map(item => (
                  <Badge key={item} variant="primary">{item}</Badge>
                ))}
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-500 mt-1" />
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '记录想法', icon: Plus, color: 'text-amber-400', bg: 'bg-amber-500/10', link: '/thoughts' },
          { label: '添加技能', icon: Plus, color: 'text-cyan-400', bg: 'bg-cyan-500/10', link: '/skills' },
          { label: '设定目标', icon: Plus, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/goals' },
          { label: '复习知识', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', link: '/review' },
        ].map(action => (
          <Link key={action.label} to={action.link}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
            >
              <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                <action.icon size={16} />
              </div>
              <span className="text-sm font-medium text-slate-300">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </motion.div>
  )
}
