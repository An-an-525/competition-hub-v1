/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化聊天时间
 */
export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) return '昨天';

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 生成随机ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * 获取用户名首字母作为头像
 */
export function getInitials(name: string): string {
  return name.charAt(0);
}

/**
 * 获取任务优先级颜色
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: '#10B981',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444',
  };
  return colors[priority] || '#6B7280';
}

/**
 * 获取任务优先级标签
 */
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority] || priority;
}

/**
 * 获取任务状态颜色
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: '#6B7280',
    inProgress: '#3B82F6',
    review: '#F59E0B',
    done: '#10B981',
  };
  return colors[status] || '#6B7280';
}

/**
 * 获取资讯分类标签
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    technology: '技术前沿',
    ai: 'AI动态',
    agent: 'Agent',
    github: 'GitHub',
    policy: '政策法规',
    changsha: '长沙资讯',
    tools: '编程工具',
    architecture: '架构设计',
    prompt: '提示词工程',
    education: '教育资源',
    industry: '行业',
  };
  return labels[category] || category;
}

/**
 * 获取资讯分类颜色
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    technology: '#3B82F6',
    ai: '#8B5CF6',
    agent: '#EC4899',
    github: '#1F2937',
    policy: '#EF4444',
    changsha: '#F59E0B',
    tools: '#10B981',
    architecture: '#6366F1',
    prompt: '#F97316',
    education: '#14B8A6',
    industry: '#6B7280',
  };
  return colors[category] || '#6B7280';
}

/**
 * 获取时间问候语
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

/**
 * 获取星期几
 */
export function getWeekday(): string {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return days[new Date().getDay()];
}

/**
 * 格式化日期为 YYYY年MM月DD日
 */
export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
}
