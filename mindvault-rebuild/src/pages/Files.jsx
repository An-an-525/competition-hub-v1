import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FolderOpen, Upload, FileText, Image, FileCode, File,
  Trash2, Download, Eye, Sparkles, X, AlertCircle
} from 'lucide-react'
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { formatDate, truncateText } from '../utils/ai'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

const getFileIcon = (type) => {
  switch (type) {
    case 'image': return Image
    case 'code': return FileCode
    case 'text': return FileText
    default: return File
  }
}

const getFileType = (file) => {
  if (file.type?.startsWith('image/')) return 'image'
  if (file.type?.includes('javascript') || file.type?.includes('json') || file.name?.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|go|rs)$/)) return 'code'
  if (file.type?.includes('text') || file.name?.match(/\.(md|txt|csv)$/)) return 'text'
  return 'document'
}

export default function Files() {
  const { files, addFile, updateFile, deleteFile } = useStore()
  const [dragOver, setDragOver] = useState(false)
  const [viewFile, setViewFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleFiles = useCallback((fileList) => {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const type = getFileType(file)
        addFile({
          name: file.name,
          content: e.target.result,
          type,
          size: file.size,
          analysis: null,
        })
      }
      reader.readAsText(file)
    })
  }, [addFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-slate-100">文件管理</h1>
        <p className="text-slate-400 text-sm mt-1">共 {files.length} 个文件</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div variants={item}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
            transition-all duration-300
            ${dragOver
              ? 'border-primary-500 bg-primary-500/5'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-primary-400" />
          </div>
          <h3 className="text-base font-medium text-slate-200 mb-1">
            {dragOver ? '释放文件以上传' : '拖拽文件到此处'}
          </h3>
          <p className="text-sm text-slate-500">或点击选择文件</p>
        </div>
      </motion.div>

      {/* Files List */}
      {files.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={FolderOpen}
            title="暂无文件"
            description="上传文件，AI 将自动分析内容"
          />
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {files.map((file) => {
            const Icon = getFileIcon(file.type)
            return (
              <motion.div key={file.id} layout>
                <Card className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-slate-200 truncate">{file.name}</h3>
                        {file.size && (
                          <span className="text-xs text-slate-500">{formatSize(file.size)}</span>
                        )}
                        {file.analysis && (
                          <Badge variant="success">已分析</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(file.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setViewFile(file)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      {!file.analysis && (
                        <button
                          onClick={() => updateFile(file.id, {
                            analysis: 'AI 分析结果：该文件包含有价值的技术内容。建议将其中的关键知识点整理到技能库中。\n\n关键要点：\n1. 文件结构清晰\n2. 代码质量良好\n3. 建议深入学习相关技术'
                          })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="AI 分析"
                        >
                          <Sparkles size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteFile(file.id)}
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

      {/* View File Modal */}
      <Modal open={!!viewFile} onClose={() => setViewFile(null)} title={viewFile?.name || '文件详情'} maxWidth="max-w-2xl">
        {viewFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">{viewFile.type}</Badge>
              {viewFile.size && <Badge variant="default">{formatSize(viewFile.size)}</Badge>}
            </div>

            {/* File Content Preview */}
            <div className="rounded-xl bg-dark-900 border border-white/[0.06] p-4 max-h-60 overflow-y-auto">
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                {truncateText(viewFile.content, 2000)}
              </pre>
            </div>

            {/* AI Analysis */}
            {viewFile.analysis ? (
              <div className="rounded-xl bg-gradient-to-br from-primary-500/5 to-purple-500/5 border border-primary-500/10 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-primary-400" />
                  <span className="text-sm font-medium text-slate-200">AI 分析结果</span>
                </div>
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{viewFile.analysis}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Button icon={Sparkles} onClick={() => {
                  updateFile(viewFile.id, {
                    analysis: 'AI 分析结果：该文件包含有价值的技术内容。建议将其中的关键知识点整理到技能库中。'
                  })
                  setViewFile({ ...viewFile, analysis: 'AI 分析结果：该文件包含有价值的技术内容。建议将其中的关键知识点整理到技能库中。' })
                }}>
                  AI 分析
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
