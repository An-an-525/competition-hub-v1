import { useState, useCallback } from 'react'
import useStore from '../store/useStore'

export function useAI() {
  const { settings, addAIMessage } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (content, context = '') => {
    if (!content.trim()) return

    setLoading(true)
    setError(null)

    addAIMessage({ role: 'user', content })

    try {
      const backendUrl = settings.backendUrl || 'http://localhost:3000'

      const response = await fetch(`${backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {}),
        },
        body: JSON.stringify({
          message: content,
          context,
          provider: settings.aiProvider,
        }),
      })

      if (!response.ok) {
        throw new Error(`AI 服务请求失败: ${response.status}`)
      }

      const data = await response.json()
      addAIMessage({ role: 'assistant', content: data.message || data.content || '收到回复' })
      return data
    } catch (err) {
      const errorMessage = err.message || 'AI 服务连接失败，请检查设置'
      setError(errorMessage)
      addAIMessage({ role: 'assistant', content: `抱歉，${errorMessage}` })
      return null
    } finally {
      setLoading(false)
    }
  }, [settings, addAIMessage])

  const analyzeFile = useCallback(async (fileContent, fileName) => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = settings.backendUrl || 'http://localhost:3000'

      const response = await fetch(`${backendUrl}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {}),
        },
        body: JSON.stringify({
          content: fileContent,
          fileName,
          provider: settings.aiProvider,
        }),
      })

      if (!response.ok) {
        throw new Error(`文件分析失败: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [settings])

  const generateRecommendations = useCallback(async (type) => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = settings.backendUrl || 'http://localhost:3000'

      const response = await fetch(`${backendUrl}/api/ai/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {}),
        },
        body: JSON.stringify({
          type,
          profile: useStore.getState().profile,
          skills: useStore.getState().skills,
          provider: settings.aiProvider,
        }),
      })

      if (!response.ok) {
        throw new Error(`推荐生成失败: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [settings])

  return {
    sendMessage,
    analyzeFile,
    generateRecommendations,
    loading,
    error,
    clearError: () => setError(null),
  }
}
