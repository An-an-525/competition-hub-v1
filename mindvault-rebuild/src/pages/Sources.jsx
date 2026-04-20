import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Globe, Headphones, GraduationCap, Video,
  FileText, Rss, Bookmark, Plus, Search, Sparkles,
  Trash2, ExternalLink
} from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { getSourceTypeIcon, getSourceTypeLabel, formatDate } from '../utils/ai'

const iconMap = {
  BookOpen, Globe, Headphones, GraduationCap, Video, FileText, Rss, Bookmark,
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const typeColors = {
  book: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  website: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  podcast: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  course: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  video: { bg: 'bg-red-500/10', text: 'text-red-400' },
  article: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  blog: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  other: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
}

export default function Sources() {
  const { sources, addSource, deleteSource } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const types = useMemo(() => {
    const t = [...new Set(sources.map(s => s.type))]
    return ['all', ...t]
  }, [sources])

  const filteredSources = useMemo(() => {
    return sources.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || s.type === filterType
      return matchSearch && matchType
    })
  }, [sources, search, filterType])

  const [form, setForm] = useState({ name: '', type: 'website', url: '', description: '', tags: '' })

  const handleAdd = () => {
    if (!form.name.trim()) return
    const tags = form.tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean)
    addSource({ ...form, tags })
    setForm({ name: '', type: 'website', url: '', description: '', tags: '' })
    setModalOpen(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">信息渠道</h1>
          <p className="text-slate-400 text-sm mt-1">共 {sources.length} 个渠道</p>
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>添加渠道</Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} placeholder="搜索渠道..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
                  : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {type === 'all' ? '全部' : getSourceTypeLabel(type)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Sources List */}
      {filteredSources.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={BookOpen}
            title="暂无信息渠道"
            description="添加你常用的学习资源"
            action={<Button icon={Plus} onClick={() => setModalOpen(true)}>添加第一个渠道</Button>}
          />
        </motion.div>
      ) : (
        <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => {
            const Icon = iconMap[getSourceTypeIcon(source.type)] || Bookmark
            const colors = typeColors[source.type] || typeColors.other
            return (
              <motion.div key={source.id} layout>
                <Card className="group h-full">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100 truncate">{source.name}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {source.url && (
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-slate-500 hover:text-primary-400">
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button onClick={() => deleteSource(source.id)} className="p-1 rounded text-slate-500 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <Badge variant="default" className="mt-1">{getSourceTypeLabel(source.type)}</Badge>
                      {source.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{source.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
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
              <h3 className="text-sm font-semibold text-slate-100 mb-1">AI 推荐渠道</h3>
              <p className="text-xs text-slate-400 mb-3">基于你的兴趣和技能，推荐以下学习资源：</p>
              <div className="flex flex-wrap gap-2">
                {['Hacker News', 'Dev.to', 'Frontend Masters', 'System Design Primer'].map(s => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="添加信息渠道">
        <div className="space-y-4">
          <Input label="名称" placeholder="例如：MDN Web Docs" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">类型</label>
            <select
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-primary-500/50 focus:outline-none transition-all"
            >
              {[
                { value: 'book', label: '书籍' },
                { value: 'website', label: '网站' },
                { value: 'podcast', label: '播客' },
                { value: 'course', label: '课程' },
                { value: 'video', label: '视频' },
                { value: 'article', label: '文章' },
                { value: 'blog', label: '博客' },
                { value: 'other', label: '其他' },
              ].map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <Input label="URL" placeholder="https://..." value={form.url} onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">描述</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="简要描述..."
              rows={2}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500/50 focus:outline-none transition-all resize-none"
            />
          </div>
          <Input label="标签（逗号分隔）" placeholder="前端, 文档" value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleAdd}>添加</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
