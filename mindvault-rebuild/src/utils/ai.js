/**
 * AI 工具函数 - 模拟 AI 响应（当后端不可用时）
 */

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function getGreetingEmoji() {
  const hour = new Date().getHours()
  if (hour < 6) return '🌙'
  if (hour < 9) return '🌅'
  if (hour < 12) return '☀️'
  if (hour < 14) return '🌤️'
  if (hour < 18) return '⛅'
  return '🌙'
}

export function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export function formatFullDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateMockAIResponse(message) {
  const responses = [
    `关于"${message.slice(0, 20)}..."，这是一个很好的问题。让我从几个角度来分析一下...`,
    `我理解你的想法。基于你目前的技能和目标，我建议你可以考虑以下几点...`,
    `这是一个值得深入思考的话题。以下是我的一些见解和建议...`,
    `很好的问题！让我帮你梳理一下思路...`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'high': return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', label: '高' }
    case 'medium': return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', label: '中' }
    case 'low': return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', label: '低' }
    default: return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', label: '普通' }
  }
}

export function getProficiencyLabel(proficiency) {
  if (proficiency >= 90) return '精通'
  if (proficiency >= 70) return '熟练'
  if (proficiency >= 50) return '中等'
  if (proficiency >= 30) return '入门'
  return '初学'
}

export function getProficiencyColor(proficiency) {
  if (proficiency >= 90) return '#34d399'
  if (proficiency >= 70) return '#22d3ee'
  if (proficiency >= 50) return '#6366f1'
  if (proficiency >= 30) return '#fbbf24'
  return '#f87171'
}

export function getSourceTypeIcon(type) {
  const icons = {
    book: 'BookOpen',
    website: 'Globe',
    podcast: 'Headphones',
    course: 'GraduationCap',
    video: 'Video',
    article: 'FileText',
    blog: 'Rss',
    other: 'Bookmark',
  }
  return icons[type] || 'Bookmark'
}

export function getSourceTypeLabel(type) {
  const labels = {
    book: '书籍',
    website: '网站',
    podcast: '播客',
    course: '课程',
    video: '视频',
    article: '文章',
    blog: '博客',
    other: '其他',
  }
  return labels[type] || '其他'
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
