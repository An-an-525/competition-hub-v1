import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Key, Globe, Moon, Sun, Download, Upload, Trash2, Info, Shield, Database, Server, Bot } from 'lucide-react';
import useStore from '../store/useStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Settings() {
  const { settings, updateSettings, exportData, importData } = useStore()
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = importData(ev.target.result)
      setImportStatus(result)
      setTimeout(() => setImportStatus(null), 3000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可撤销。')) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mindvault-')) {
          localStorage.removeItem(key)
        }
      })
      window.location.reload()
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-slate-100">设置</h1>
        <p className="text-slate-400 text-sm mt-1">管理应用配置和数据</p>
      </motion.div>

      {/* AI Configuration */}
      <motion.div variants={item}>
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Bot size={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">AI 配置</h2>
              <p className="text-xs text-slate-500">配置 AI 服务提供商</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">AI 提供商</label>
              <select
                value={settings.aiProvider}
                onChange={e => updateSettings({ aiProvider: e.target.value })}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 focus:border-primary-500/50 focus:outline-none transition-all"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="local">本地模型</option>
              </select>
            </div>

            <Input
              label="API Key"
              type="password"
              placeholder="sk-..."
              value={settings.apiKey}
              onChange={e => updateSettings({ apiKey: e.target.value })}
              icon={Key}
            />

            <Input
              label="后端 URL"
              placeholder="http://localhost:3000"
              value={settings.backendUrl}
              onChange={e => updateSettings({ backendUrl: e.target.value })}
              icon={Server}
            />
          </div>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div variants={item}>
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              {settings.theme === 'dark' ? <Moon size={18} className="text-purple-400" /> : <Sun size={18} className="text-amber-400" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">主题</h2>
              <p className="text-xs text-slate-500">选择你喜欢的主题</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'dark', label: '深色模式', icon: Moon, desc: '护眼暗色主题' },
              { value: 'light', label: '浅色模式', icon: Sun, desc: '明亮清爽主题' },
            ].map(theme => (
              <button
                key={theme.value}
                onClick={() => updateSettings({ theme: theme.value })}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  settings.theme === theme.value
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <theme.icon size={20} className={settings.theme === theme.value ? 'text-primary-400' : 'text-slate-500'} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${settings.theme === theme.value ? 'text-primary-300' : 'text-slate-300'}`}>
                    {theme.label}
                  </p>
                  <p className="text-xs text-slate-500">{theme.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={item}>
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Database size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">数据管理</h2>
              <p className="text-xs text-slate-500">导出、导入或清除数据</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Download size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-200">导出数据</p>
                  <p className="text-xs text-slate-500">下载所有数据为 JSON 文件</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={exportData}>导出</Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Upload size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm text-slate-200">导入数据</p>
                  <p className="text-xs text-slate-500">从 JSON 文件恢复数据</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>导入</Button>
              </div>
            </div>
            {importStatus && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-sm ${
                  importStatus.success
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {importStatus.success ? '数据导入成功！' : `导入失败：${importStatus.error}`}
              </motion.div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-3">
                <Trash2 size={16} className="text-red-400" />
                <div>
                  <p className="text-sm text-red-400">清除所有数据</p>
                  <p className="text-xs text-slate-500">此操作不可撤销</p>
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={handleClearData}>清除</Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div variants={item}>
        <Card hover={false}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Info size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">关于</h2>
              <p className="text-xs text-slate-500">MindVault AI</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">版本</span>
              <Badge variant="primary">1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">技术栈</span>
              <span className="text-slate-300">React + Vite + Tailwind CSS</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">AI 引擎</span>
              <span className="text-slate-300">OpenAI / Anthropic / Google</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
