import { create } from 'zustand'

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(`mindvault-${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(`mindvault-${key}`, JSON.stringify(value))
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

const useStore = create((set, get) => ({
  // Profile
  profile: loadFromStorage('profile', {
    name: 'MindVault 用户',
    role: '全栈开发者',
    bio: '热爱技术，持续学习，构建更好的产品。',
    email: 'user@example.com',
    location: '中国',
    github: '',
    techStack: ['React', 'Node.js', 'Python', 'TypeScript'],
    education: [],
    experience: [],
  }),

  updateProfile: (updates) => {
    const profile = { ...get().profile, ...updates }
    saveToStorage('profile', profile)
    set({ profile })
  },

  // Skills
  skills: loadFromStorage('skills', [
    { id: '1', name: 'React', category: '前端', proficiency: 85, createdAt: Date.now() - 86400000 * 30 },
    { id: '2', name: 'Node.js', category: '后端', proficiency: 75, createdAt: Date.now() - 86400000 * 25 },
    { id: '3', name: 'Python', category: '后端', proficiency: 70, createdAt: Date.now() - 86400000 * 20 },
    { id: '4', name: 'TypeScript', category: '前端', proficiency: 80, createdAt: Date.now() - 86400000 * 15 },
    { id: '5', name: 'Docker', category: 'DevOps', proficiency: 60, createdAt: Date.now() - 86400000 * 10 },
    { id: '6', name: 'PostgreSQL', category: '数据库', proficiency: 65, createdAt: Date.now() - 86400000 * 5 },
  ]),

  addSkill: (skill) => {
    const newSkill = { ...skill, id: generateId(), createdAt: Date.now() }
    const skills = [...get().skills, newSkill]
    saveToStorage('skills', skills)
    set({ skills })
  },

  updateSkill: (id, updates) => {
    const skills = get().skills.map(s => s.id === id ? { ...s, ...updates } : s)
    saveToStorage('skills', skills)
    set({ skills })
  },

  deleteSkill: (id) => {
    const skills = get().skills.filter(s => s.id !== id)
    saveToStorage('skills', skills)
    set({ skills })
  },

  // Thoughts
  thoughts: loadFromStorage('thoughts', [
    { id: '1', content: '学习 React Server Components 可以显著提升应用性能', tags: ['React', '性能优化'], createdAt: Date.now() - 86400000 * 2 },
    { id: '2', content: 'AI 辅助编程正在改变开发者的工作方式', tags: ['AI', '开发效率'], createdAt: Date.now() - 86400000 },
    { id: '3', content: '微服务架构适合大型团队，小团队用单体架构更高效', tags: ['架构', '团队管理'], createdAt: Date.now() - 3600000 * 5 },
  ]),

  addThought: (thought) => {
    const newThought = { ...thought, id: generateId(), createdAt: Date.now() }
    const thoughts = [newThought, ...get().thoughts]
    saveToStorage('thoughts', thoughts)
    set({ thoughts })
  },

  deleteThought: (id) => {
    const thoughts = get().thoughts.filter(t => t.id !== id)
    saveToStorage('thoughts', thoughts)
    set({ thoughts })
  },

  // Goals
  goals: loadFromStorage('goals', [
    { id: '1', title: '掌握 Rust 编程', description: '系统学习 Rust 语言，完成至少3个实战项目', priority: 'high', status: 'active', progress: 35, deadline: '2026-06-30', createdAt: Date.now() - 86400000 * 14 },
    { id: '2', title: '通过 AWS 认证', description: '完成 AWS Solutions Architect 认证考试', priority: 'medium', status: 'active', progress: 60, deadline: '2026-05-15', createdAt: Date.now() - 86400000 * 7 },
    { id: '3', title: '开源项目贡献', description: '为至少5个开源项目提交有意义的PR', priority: 'low', status: 'active', progress: 40, deadline: '2026-12-31', createdAt: Date.now() - 86400000 * 3 },
  ]),

  addGoal: (goal) => {
    const newGoal = { ...goal, id: generateId(), createdAt: Date.now(), progress: 0, status: 'active' }
    const goals = [...get().goals, newGoal]
    saveToStorage('goals', goals)
    set({ goals })
  },

  updateGoal: (id, updates) => {
    const goals = get().goals.map(g => g.id === id ? { ...g, ...updates } : g)
    saveToStorage('goals', goals)
    set({ goals })
  },

  deleteGoal: (id) => {
    const goals = get().goals.filter(g => g.id !== id)
    saveToStorage('goals', goals)
    set({ goals })
  },

  // Sources
  sources: loadFromStorage('sources', [
    { id: '1', name: 'MDN Web Docs', type: 'website', url: 'https://developer.mozilla.org', description: '最权威的 Web 技术文档', tags: ['前端', '文档'], createdAt: Date.now() - 86400000 * 30 },
    { id: '2', name: '代码整洁之道', type: 'book', url: '', description: 'Robert C. Martin 的经典著作', tags: ['编程', '最佳实践'], createdAt: Date.now() - 86400000 * 20 },
    { id: '3', name: 'Syntax.fm', type: 'podcast', url: 'https://syntax.fm', description: 'Web 开发主题播客', tags: ['前端', '播客'], createdAt: Date.now() - 86400000 * 10 },
  ]),

  addSource: (source) => {
    const newSource = { ...source, id: generateId(), createdAt: Date.now() }
    const sources = [...get().sources, newSource]
    saveToStorage('sources', sources)
    set({ sources })
  },

  deleteSource: (id) => {
    const sources = get().sources.filter(s => s.id !== id)
    saveToStorage('sources', sources)
    set({ sources })
  },

  // Files
  files: loadFromStorage('files', []),

  addFile: (file) => {
    const newFile = { ...file, id: generateId(), createdAt: Date.now() }
    const files = [newFile, ...get().files]
    saveToStorage('files', files)
    set({ files })
  },

  updateFile: (id, updates) => {
    const files = get().files.map(f => f.id === id ? { ...f, ...updates } : f)
    saveToStorage('files', files)
    set({ files })
  },

  deleteFile: (id) => {
    const files = get().files.filter(f => f.id !== id)
    saveToStorage('files', files)
    set({ files })
  },

  // Achievements
  achievements: loadFromStorage('achievements', [
    { id: '1', title: '初来乍到', description: '完成个人资料设置', icon: 'UserPlus', unlockedAt: Date.now() - 86400000 * 30 },
    { id: '2', title: '想法收集者', description: '记录第一个想法', icon: 'Lightbulb', unlockedAt: Date.now() - 86400000 * 28 },
    { id: '3', title: '技能猎人', description: '添加5个技能', icon: 'Target', unlockedAt: Date.now() - 86400000 * 25 },
    { id: '4', title: '目标设定者', description: '设定第一个目标', icon: 'Flag', unlockedAt: Date.now() - 86400000 * 20 },
    { id: '5', title: '知识源泉', description: '添加第一个信息渠道', icon: 'BookOpen', unlockedAt: Date.now() - 86400000 * 15 },
    { id: '6', title: '连续学习', description: '连续7天访问 MindVault', icon: 'Flame', unlockedAt: null },
    { id: '7', title: '技能大师', description: '掌握10个技能（熟练度>80）', icon: 'Crown', unlockedAt: null },
    { id: '8', title: '目标达成', description: '完成5个目标', icon: 'Trophy', unlockedAt: null },
    { id: '9', title: '思想领袖', description: '记录50个想法', icon: 'Brain', unlockedAt: null },
    { id: '10', title: 'AI伙伴', description: '与AI助手对话10次', icon: 'Bot', unlockedAt: null },
    { id: '11', title: '文件管理师', description: '上传并分析10个文件', icon: 'FileCheck', unlockedAt: null },
    { id: '12', title: '复习达人', description: '完成100次知识复习', icon: 'RefreshCw', unlockedAt: null },
  ]),

  unlockAchievement: (id) => {
    const achievements = get().achievements.map(a =>
      a.id === id && !a.unlockedAt ? { ...a, unlockedAt: Date.now() } : a
    )
    saveToStorage('achievements', achievements)
    set({ achievements })
  },

  // Settings
  settings: loadFromStorage('settings', {
    theme: 'dark',
    aiProvider: 'openai',
    apiKey: '',
    backendUrl: 'http://localhost:3000',
    sidebarCollapsed: false,
  }),

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates }
    saveToStorage('settings', settings)
    set({ settings })
  },

  toggleSidebar: () => {
    const settings = { ...get().settings, sidebarCollapsed: !get().settings.sidebarCollapsed }
    saveToStorage('settings', settings)
    set({ settings })
  },

  // AI Messages
  aiMessages: loadFromStorage('aiMessages', []),

  addAIMessage: (message) => {
    const newMessage = { ...message, id: generateId(), timestamp: Date.now() }
    const aiMessages = [...get().aiMessages, newMessage]
    saveToStorage('aiMessages', aiMessages)
    set({ aiMessages })
  },

  clearAIMessages: () => {
    saveToStorage('aiMessages', [])
    set({ aiMessages: [] })
  },

  // AI Assistant Panel
  aiPanelOpen: false,
  toggleAIPanel: () => set({ aiPanelOpen: !get().aiPanelOpen }),
  closeAIPanel: () => set({ aiPanelOpen: false }),

  // Search
  searchQuery: '',
  searchOpen: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Export / Import
  exportData: () => {
    const data = {
      profile: get().profile,
      skills: get().skills,
      thoughts: get().thoughts,
      goals: get().goals,
      sources: get().sources,
      files: get().files,
      achievements: get().achievements,
      settings: get().settings,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mindvault-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importData: (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (data.profile) { saveToStorage('profile', data.profile); set({ profile: data.profile }) }
      if (data.skills) { saveToStorage('skills', data.skills); set({ skills: data.skills }) }
      if (data.thoughts) { saveToStorage('thoughts', data.thoughts); set({ thoughts: data.thoughts }) }
      if (data.goals) { saveToStorage('goals', data.goals); set({ goals: data.goals }) }
      if (data.sources) { saveToStorage('sources', data.sources); set({ sources: data.sources }) }
      if (data.files) { saveToStorage('files', data.files); set({ files: data.files }) }
      if (data.achievements) { saveToStorage('achievements', data.achievements); set({ achievements: data.achievements }) }
      if (data.settings) { saveToStorage('settings', data.settings); set({ settings: data.settings }) }
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  },
}))

export default useStore
