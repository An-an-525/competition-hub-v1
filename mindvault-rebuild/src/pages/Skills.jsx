import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus, Search, Filter, Sparkles, Trash2, X } from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Progress from '../components/ui/Progress'
import EmptyState from '../components/ui/EmptyState'
import { getProficiencyLabel, getProficiencyColor } from '../utils/ai'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Skills() {
  const { skills, addSkill, deleteSkill } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const categories = useMemo(() => {
    const cats = [...new Set(skills.map(s => s.category))]
    return ['all', ...cats]
  }, [skills])

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'all' || s.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [skills, search, filterCategory])

  const [newSkill, setNewSkill] = useState({ name: '', category: '前端', proficiency: 50 })

  const handleAdd = () => {
    if (!newSkill.name.trim()) return
    addSkill(newSkill)
    setNewSkill({ name: '', category: '前端', proficiency: 50 })
    setModalOpen(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">技能库</h1>
          <p className="text-slate-400 text-sm mt-1">共 {skills.length} 个技能</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>添加技能</Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="搜索技能..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterCategory === cat
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                  : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={Zap}
            title="暂无技能"
            description="开始添加你的技能，追踪你的成长"
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>添加第一个技能</Button>}
          />
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className="relative group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{skill.name}</h3>
                    <Badge variant="default" className="mt-1">{skill.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: getProficiencyColor(skill.proficiency) }}
                    >
                      {skill.proficiency}%
                    </span>
                    <button
                      onClick={() => deleteSkill(skill.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <Progress value={skill.proficiency} showLabel={false} size="md" />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-500">
                    {getProficiencyLabel(skill.proficiency)}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI Recommendations */}
      <motion.div variants={item}>
        <Card gradient glow>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">AI 推荐技能</h3>
              <p className="text-xs text-slate-400 mb-3">基于你的技术栈和行业趋势，推荐你学习以下技能：</p>
              <div className="flex flex-wrap gap-2">
                {['Rust', 'Kubernetes', 'GraphQL', 'WebAssembly', 'AI/ML'].map(s => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="添加技能">
        <div className="space-y-4">
          <Input
            label="技能名称"
            placeholder="例如：React"
            value={newSkill.name}
            onChange={e => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">分类</label>
            <select
              value={newSkill.category}
              onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-primary-500/50 focus:outline-none transition-all"
            >
              {['前端', '后端', 'DevOps', '数据库', '移动端', '设计', '其他'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">
              熟练度: {newSkill.proficiency}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={newSkill.proficiency}
              onChange={e => setNewSkill(prev => ({ ...prev, proficiency: parseInt(e.target.value) }))}
              className="w-full accent-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>添加</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
