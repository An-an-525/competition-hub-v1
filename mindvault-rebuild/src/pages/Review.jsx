import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Brain, ChevronLeft, ChevronRight,
  RotateCcw, Check, X, Sparkles, Clock, BarChart3
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

// Mock review cards for demonstration
const mockCards = [
  {
    id: '1',
    front: '什么是 React Server Components？',
    back: 'React Server Components (RSC) 是一种允许组件在服务端渲染的 React 组件类型。它们可以减少客户端 JavaScript 包大小，直接访问后端资源，并保持客户端的交互性。RSC 不会发送到客户端，只渲染其输出。',
    category: 'React',
    difficulty: 'medium',
    lastReview: Date.now() - 86400000 * 2,
    nextReview: Date.now(),
    reviewCount: 3,
  },
  {
    id: '2',
    front: '解释 JavaScript 中的事件循环（Event Loop）',
    back: '事件循环是 JavaScript 实现异步的核心机制。它持续检查调用栈是否为空，如果为空则从任务队列中取出下一个任务执行。微任务（Promise.then、MutationObserver）优先于宏任务（setTimeout、setInterval）执行。',
    category: 'JavaScript',
    difficulty: 'hard',
    lastReview: Date.now() - 86400000 * 5,
    nextReview: Date.now() - 86400000,
    reviewCount: 7,
  },
  {
    id: '3',
    front: 'CSS Grid 和 Flexbox 的主要区别是什么？',
    back: 'Flexbox 是一维布局系统（行或列），适合组件内部布局。CSS Grid 是二维布局系统（行和列同时），适合页面整体布局。Grid 可以定义行列轨道和区域，而 Flexbox 主要处理单一方向上的元素排列。',
    category: 'CSS',
    difficulty: 'easy',
    lastReview: Date.now() - 86400000,
    nextReview: Date.now() + 86400000,
    reviewCount: 12,
  },
  {
    id: '4',
    front: '什么是闭包（Closure）？',
    back: '闭包是指一个函数能够记住并访问它被创建时所在的词法作用域，即使该函数在其词法作用域之外执行。闭包常用于数据封装、创建私有变量、函数工厂和回调函数等场景。',
    category: 'JavaScript',
    difficulty: 'medium',
    lastReview: Date.now() - 86400000 * 3,
    nextReview: Date.now() - 86400000 * 2,
    reviewCount: 5,
  },
  {
    id: '5',
    front: 'RESTful API 的设计原则有哪些？',
    back: 'RESTful API 设计原则：1) 使用 HTTP 方法语义化（GET/POST/PUT/DELETE）；2) 资源用名词表示，用 URL 路径标识；3) 使用合适的 HTTP 状态码；4) 支持分页、过滤和排序；5) 版本控制；6) 无状态设计。',
    category: 'API 设计',
    difficulty: 'easy',
    lastReview: Date.now() - 86400000 * 4,
    nextReview: Date.now() - 86400000 * 3,
    reviewCount: 8,
  },
]

const difficultyConfig = {
  easy: { label: '简单', variant: 'success' },
  medium: { label: '中等', variant: 'warning' },
  hard: { label: '困难', variant: 'danger' },
}

export default function Review() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState([])
  const [showStats, setShowStats] = useState(false)

  const currentCard = mockCards[currentIndex]
  const isFinished = currentIndex >= mockCards.length

  const stats = useMemo(() => ({
    total: mockCards.length,
    reviewed: reviewed.length,
    correct: reviewed.filter(r => r.correct).length,
    incorrect: reviewed.filter(r => !r.correct).length,
  }), [reviewed])

  const handleReview = (correct) => {
    setReviewed(prev => [...prev, { cardId: currentCard.id, correct }])
    setFlipped(false)
    setCurrentIndex(prev => prev + 1)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setFlipped(false)
    setReviewed([])
    setShowStats(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">复习回顾</h1>
          <p className="text-slate-400 text-sm mt-1">间隔重复，巩固记忆</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={BarChart3}
            variant="secondary"
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            统计
          </Button>
          <Button
            icon={RotateCcw}
            variant="ghost"
            size="sm"
            onClick={handleRestart}
          >
            重新开始
          </Button>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{Math.min(currentIndex + 1, mockCards.length)} / {mockCards.length}</span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
              animate={{ width: `${(Math.min(currentIndex, mockCards.length) / mockCards.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card hover={false}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
                  <p className="text-xs text-slate-500">总卡片</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.correct}</p>
                  <p className="text-xs text-slate-500">已掌握</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{stats.incorrect}</p>
                  <p className="text-xs text-slate-500">需复习</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flashcard */}
      {isFinished ? (
        <motion.div variants={item}>
          <Card hover={false} className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">复习完成！</h2>
            <p className="text-sm text-slate-400 mb-2">
              本次复习了 {stats.reviewed} 张卡片
            </p>
            <p className="text-sm text-slate-400 mb-6">
              掌握 <span className="text-emerald-400 font-medium">{stats.correct}</span> 个，
              需复习 <span className="text-red-400 font-medium">{stats.incorrect}</span> 个
            </p>
            <Button icon={RefreshCw} onClick={handleRestart}>再复习一次</Button>
          </Card>
        </motion.div>
      ) : currentCard ? (
        <motion.div variants={item}>
          <div className="perspective-1000">
            <motion.div
              className="relative cursor-pointer"
              onClick={() => setFlipped(!flipped)}
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <Card hover={false} className="min-h-[280px]" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <Badge variant={difficultyConfig[currentCard.difficulty]?.variant || 'default'} className="mb-4">
                      {difficultyConfig[currentCard.difficulty]?.label || '未知'}
                    </Badge>
                    <Badge variant="default" className="mb-6">{currentCard.category}</Badge>
                    <h3 className="text-lg font-semibold text-slate-100 leading-relaxed px-4">
                      {currentCard.front}
                    </h3>
                    <p className="text-xs text-slate-500 mt-8">点击翻转查看答案</p>
                  </div>
                </Card>

                {/* Back */}
                <Card
                  hover={false}
                  className="absolute inset-0 min-h-[280px]"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="flex flex-col h-full py-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain size={16} className="text-primary-400" />
                      <span className="text-sm font-medium text-slate-300">答案</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed flex-1 px-2">
                      {currentCard.back}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleReview(false) }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                      >
                        <X size={16} /> 不熟悉
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); handleReview(true) }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check size={16} /> 已掌握
                      </motion.button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <EmptyState
            icon={RefreshCw}
            title="暂无复习卡片"
            description="开始添加知识和想法，AI 会自动生成复习卡片"
          />
        </motion.div>
      )}

      {/* AI Tip */}
      <motion.div variants={item}>
        <Card gradient glow>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">AI 驱动复习</h3>
              <p className="text-xs text-slate-400">
                MindVault 使用间隔重复算法优化你的复习计划。AI 会根据你的掌握程度自动调整复习频率，确保你高效记忆每个知识点。
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
