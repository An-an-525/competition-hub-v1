import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Bot, User, Trash2 } from 'lucide-react'
import useStore from '../../store/useStore'
import { useAI } from '../../hooks/useAI'
import { generateMockAIResponse } from '../../utils/ai'

export default function AIAssistant() {
  const { aiPanelOpen, toggleAIPanel, closeAIPanel, aiMessages, clearAIMessages } = useStore()
  const { sendMessage, loading } = useAI()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const message = input
    setInput('')

    // Try real AI first, fall back to mock
    const result = await sendMessage(message)
    if (!result) {
      // Add mock response
      useStore.getState().addAIMessage({
        role: 'assistant',
        content: generateMockAIResponse(message),
      })
    }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!aiPanelOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAIPanel}
            className="fixed bottom-20 lg:bottom-8 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 shadow-lg shadow-primary-500/25 flex items-center justify-center text-white hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
          >
            <MessageSquare size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 lg:bottom-8 right-6 z-40 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-160px)] rounded-2xl border border-white/[0.08] bg-dark-600/95 backdrop-blur-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">AI 助手</h3>
                  <p className="text-xs text-emerald-400">在线</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {aiMessages.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={clearAIMessages}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors"
                    title="清空对话"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeAIPanel}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {aiMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/10 flex items-center justify-center mb-4">
                    <Bot size={28} className="text-primary-400" />
                  </div>
                  <p className="text-sm text-slate-300 mb-1">你好，我是 MindVault AI 助手</p>
                  <p className="text-xs text-slate-500">有什么可以帮助你的吗？</p>
                </div>
              ) : (
                aiMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary-500/15 text-slate-200 rounded-br-md'
                        : 'bg-white/[0.03] text-slate-300 rounded-bl-md border border-white/[0.06]'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] focus-within:border-primary-500/30 transition-all">
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="rounded-lg p-1.5 text-primary-400 hover:bg-primary-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
