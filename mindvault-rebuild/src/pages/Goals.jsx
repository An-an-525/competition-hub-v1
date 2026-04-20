import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, Search, Sparkles, Trash2, Calendar, Flag, Edit3, Check } from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Progress from '../components/ui/Progress'
import EmptyState from '../components/ui/EmptyState'
import { getPriorityColor, formatDate } from '../utils/ai'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [filter, setFilter] = useState('active')

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', deadline: '',
  })

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (filter === 'active') return g.status === 'active'
      if (filter === 'completed') return g.status === 'completed'
      return true
    })
  }, [goals, filter])

  const handleOpenAdd = () => {
    setEditingGoal(null)
    setForm({ title: '', description: '', priority: 'medium', deadline: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      description: goal.description,
      priority: goal.priority,
      deadline: goal.deadline,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    if (editingGoal) {
      updateGoal(editingGoal.id, form)
    } else {
      addGoal(form)
    }
    setModalOpen(false)
  }

  const toggleComplete = (goal) => {
    updateGoal(goal.id, {
      status: goal.status === 'completed' ? 'active' : 'completed',
      progress: goal.status === 'completed' ? goal.progress : 100,
    })
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">目标管理</h1>
          <p className="text-slate-400 text-sm mt-1">
            {goals.filter(g => g.status === 'active').length} 个进行中 / {goals.filter(g => g.status === 'completed').length} 个已完成
          </p>
        </div>
        <Button icon={Plus} onClick={handleOpenAdd}>添加目标</Button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'active', label: '进行中' },
          { key: 'completed', label: '已完成' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={Target}
            title="暂无目标"
            description="设定目标，让 AI 帮你分析和规划"
            action={<Button icon={Plus} onClick={handleOpenAdd}>设定第一个目标</Button>}
          />
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {filteredGoals.map((goal) => {
            const priority = getPriorityColor(goal.priority)
            return (
              <motion.div key={goal.id} layout>
                <Card className={`group ${goal.status === 'completed' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(goal)}
                      className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        goal.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-white/20 hover:border-primary-500'
                      }`}
                    >
                      {goal.status === 'completed' && <Check size={12} className="text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-base font-semibold ${goal.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                          {goal.title}
                        </h3>
                        <Badge style={{ background: priority.bg, color: priority.text, borderColor: 'transparent' }}>
                          {priority.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{goal.description}</p>
                      <Progress value={goal.progress} size="sm" />
                      <div className="flex items-center gap-3 mt-3">
                        {goal.deadline && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={12} /> {goal.deadline}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{formatDate(goal.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* AI Analysis */}
      <motion.div variants={item}>
        <Card gradient glow>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">AI 目标分析</h3>
              <p className="text-xs text-slate-400">AI 可以帮你分析目标的可行性，制定合理的计划和时间线。</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGoal ? '编辑目标' : '添加目标'}>
        <div className="space-y-4">
          <Input
            label="目标标题"
            placeholder="例如：掌握 React Native"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">描述</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="详细描述你的目标..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:outline-none transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">优先级</label>
              <select
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-primary-500/50 focus:outline-none transition-all"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <Input
              label="截止日期"
              type="date"
              value={form.deadline}
              onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingGoal ? '保存' : '添加'}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
