// ==================== 用户相关类型 ====================

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: 'admin' | 'manager' | 'member';
  bio: string;
  skills: string[];
  joinDate: string;
  status: 'online' | 'offline' | 'busy' | 'away';
}

export interface LoginParams {
  username: string;
  password: string;
  remember: boolean;
}

export interface RegisterParams {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  department: string;
  position: string;
}

// ==================== 消息相关类型 ====================

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'private' | 'group';
  avatar?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// ==================== 任务相关类型 ====================

export type TaskStatus = 'todo' | 'inProgress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  reporterId: string;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export interface TaskFilter {
  keyword: string;
  priority: TaskPriority | 'all';
  assigneeId: string | 'all';
}

// ==================== 文件相关类型 ====================

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaderId: string;
  uploadDate: string;
  category: string;
  description: string;
  downloadCount: number;
}

// ==================== 资讯相关类型 ====================

export type NewsCategory =
  | 'technology'
  | 'ai'
  | 'agent'
  | 'github'
  | 'policy'
  | 'changsha'
  | 'tools'
  | 'architecture'
  | 'prompt'
  | 'education'
  | 'industry';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  source: string;
  author: string;
  publishDate: string;
  imageUrl: string;
  tags: string[];
  readCount: number;
  liked: boolean;
  heat?: number;
}

// ==================== 通知相关类型 ====================

export interface Notification {
  id: string;
  type: 'message' | 'task' | 'system' | 'mention';
  title: string;
  content: string;
  timestamp: string;
  read: boolean;
}

// ==================== 全局UI状态类型 ====================

export interface AppState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  searchKeyword: string;
}

// ==================== 仪表盘相关类型 ====================

export interface TimelineItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  actionType: 'task_done' | 'file_upload' | 'message_send' | 'task_create';
  timestamp: string;
}

export interface QuickEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: string;
}
