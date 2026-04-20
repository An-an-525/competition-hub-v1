import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Plus, Search, Sparkles, Trash2, Tag, X } from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../utils/ai'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Thoughts() {
  const { thoughts, addThought, deleteThought } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newThought, setNewThought] = useState({ content: '', tags: '' })

  const filteredThoughts = useMemo(() => {
    if (!search) return thoughts
    const q = search.toLowerCase()
    return thoughts.filter(t =>
      t.content.toLowerCase().includes(q) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q))
    )
  }, [thoughts, search])

  const handleAdd = () => {
    if (!newThought.content.trim()) return
    const tags = newThought.tags
      .split(/[,，\s]+/)
      .map(t => t.trim())
      .filter(Boolean)
    addThought({ content: newThought.content, tags })
    setNewThought({ content: '', tags: '' })
    setModalOpen(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">想法记录</h1>
          <p className="text-slate-400 text-sm mt-1">共 {thoughts.length} 条想法</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>记录想法</Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <Input icon={Search} placeholder="搜索想法或标签..." value={search} onChange={e => setSearch(e.target.value)} />
      </motion.div>

      {/* Thoughts List */}
      {filteredThoughts.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={Lightbulb}
            title="还没有想法"
            description="记录你的灵感和思考，让 AI 帮你扩展"
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>记录第一个想法</Button>}
          />
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {filteredThoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              layout
            >
              <Card className="group">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{thought.content}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {thought.tags?.map(tag => (
                        <Badge key={tag} variant="warning">{tag}</Badge>
                      ))}
                      <span className="text-xs text-slate-500 ml-auto">{formatDate(thought.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteThought(thought.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="记录想法">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">想法内容</label>
            <textarea
              value={newThought.content}
              onChange={e => setNewThought(prev => ({ ...prev, content: e.target.value }))}
              placeholder="写下你的想法..."
              rows={5}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:shadow-[0_0_16px_rgba(99,102,241,0.15)] focus:outline-none transition-all resize-none"
              autoFocus
            />
          </div>
          <Input
            label="标签（用逗号或空格分隔）"
            placeholder="React, 性能优化, 架构"
            value={newThought.tags}
            onChange={e => setNewThought(prev => ({ ...prev, tags: e.target.value }))}
            icon={Tag}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>记录</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
