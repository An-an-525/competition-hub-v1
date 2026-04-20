import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckSquareOutlined,
  MessageOutlined,
  FileOutlined,
  ReadOutlined,
  UserOutlined,
  BarChartOutlined,
  FolderOutlined,
  CarryOutOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  RightOutlined,
  FireOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Progress, message } from 'antd';
import {
  mockDashboardStats,
  mockTaskTrendData,
  mockTaskStatusData,
  mockTimeline,
  mockQuickEntries,
  mockTasks,
  mockNews,
  mockUsers,
} from '../../mock';
import {
  getGreeting,
  getWeekday,
  formatDate,
  formatDateFull,
  getPriorityColor,
  getPriorityLabel,
  getCategoryLabel,
  getCategoryColor,
  getInitials,
} from '../../utils';
import { useAuthStore } from '../../store/useAuthStore';

const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const actionTypeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  task_done: { color: '#10B981', icon: <CheckCircleOutlined />, label: '完成任务' },
  file_upload: { color: '#3B82F6', icon: <FileOutlined />, label: '上传文件' },
  message_send: { color: '#8B5CF6', icon: <MessageOutlined />, label: '发送消息' },
  task_create: { color: '#F59E0B', icon: <CarryOutOutlined />, label: '创建任务' },
};

const quickEntryIcons: Record<string, React.ReactNode> = {
  'check-square': <CheckSquareOutlined />,
  message: <MessageOutlined />,
  folder: <FolderOutlined />,
  read: <ReadOutlined />,
  user: <UserOutlined />,
  'bar-chart': <BarChartOutlined />,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [completedTodoIds, setCompletedTodoIds] = useState<Set<string>>(new Set());

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

  const todoTasks = useMemo(() => {
    return mockTasks.filter((t) => t.status === 'todo' || t.status === 'inProgress');
  }, []);

  const latestNews = useMemo(() => {
    return mockNews.slice(0, 4);
  }, []);

  const onlineCount = useMemo(() => {
    return mockUsers.filter((u) => u.status === 'online').length;
  }, []);

  const markTodoDone = (taskId: string) => {
    setCompletedTodoIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    message.success('任务已标记完成');
  };

  return (
    <div className="dashboard-page">
      {/* 欢迎区域 */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-left">
          <h2 className="dashboard-greeting">
            {getGreeting()}，{user?.name || '用户'}
          </h2>
          <p className="dashboard-date">
            {dateStr} {getWeekday()}
          </p>
        </div>
        <div className="dashboard-welcome-stats">
          <div className="welcome-stat-item">
            <BellOutlined style={{ color: '#4F46E5' }} />
            <span className="welcome-stat-value">{todoTasks.length}</span>
            <span className="welcome-stat-label">待办任务</span>
          </div>
          <div className="welcome-stat-divider" />
          <div className="welcome-stat-item">
            <MessageOutlined style={{ color: '#EF4444' }} />
            <span className="welcome-stat-value">5</span>
            <span className="welcome-stat-label">未读消息</span>
          </div>
          <div className="welcome-stat-divider" />
          <div className="welcome-stat-item">
            <CheckCircleOutlined style={{ color: '#10B981' }} />
            <span className="welcome-stat-value">12</span>
            <span className="welcome-stat-label">本周完成</span>
          </div>
        </div>
      </div>

      {/* 数据概览卡片 */}
      <div className="dashboard-stats">
        <div className="stat-card stat-card-gradient-1">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon-1">
              <CarryOutOutlined />
            </div>
            <span className="stat-trend up">
              <ArrowUpOutlined /> 12%
            </span>
          </div>
          <div className="stat-value">{mockDashboardStats.totalTasks}</div>
          <div className="stat-label">总任务数</div>
          <div className="stat-sub">较上周增加 28 项</div>
        </div>
        <div className="stat-card stat-card-gradient-2">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon-2">
              <ClockCircleOutlined />
            </div>
            <span className="stat-trend up">
              <ArrowUpOutlined /> 8%
            </span>
          </div>
          <div className="stat-value">{mockDashboardStats.totalTasks - mockDashboardStats.completedTasks}</div>
          <div className="stat-label">进行中任务</div>
          <Progress
            percent={Math.round((mockDashboardStats.completedTasks / mockDashboardStats.totalTasks) * 100)}
            showInfo={false}
            strokeColor="#10B981"
            trailColor="rgba(255,255,255,0.2)"
            size="small"
            style={{ marginTop: 8 }}
          />
        </div>
        <div className="stat-card stat-card-gradient-3">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon-3">
              <CheckCircleOutlined />
            </div>
            <span className="stat-trend up">
              <ArrowUpOutlined /> 15%
            </span>
          </div>
          <div className="stat-value">{mockDashboardStats.completedTasks}</div>
          <div className="stat-label">已完成任务</div>
          <div className="stat-sub">
            完成率 {Math.round((mockDashboardStats.completedTasks / mockDashboardStats.totalTasks) * 100)}%
          </div>
        </div>
        <div className="stat-card stat-card-gradient-4">
          <div className="stat-card-header">
            <div className="stat-icon stat-icon-4">
              <TeamOutlined />
            </div>
            <span className="stat-trend up">
              <ArrowUpOutlined /> 5%
            </span>
          </div>
          <div className="stat-value">{onlineCount}</div>
          <div className="stat-label">团队成员在线</div>
          <div className="stat-sub">
            在线率 {Math.round((onlineCount / mockUsers.length) * 100)}%
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>近7天任务完成趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTaskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                name="完成任务"
                stroke="#4F46E5"
                strokeWidth={2.5}
                dot={{ fill: '#4F46E5', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="新建任务"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>任务状态分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockTaskStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {mockTaskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: 'none',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: '#64748B', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 中间区域：时间线 + 待办任务 */}
      <div className="dashboard-middle">
        {/* 最新动态时间线 */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <FireOutlined style={{ color: '#F59E0B', marginRight: 8 }} />
            最新动态
          </div>
          <div className="timeline-list">
            {mockTimeline.map((item) => {
              const config = actionTypeConfig[item.actionType];
              const colorIdx = mockUsers.findIndex((u) => u.id === item.userId);
              return (
                <div className="timeline-item" key={item.id}>
                  <div
                    className="timeline-avatar"
                    style={{ background: avatarColors[colorIdx >= 0 ? colorIdx % avatarColors.length : 0] }}
                  >
                    {getInitials(item.userName)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-action">
                      <span className="timeline-name">{item.userName}</span>
                      <span className="timeline-desc">{item.action}</span>
                    </div>
                    <div className="timeline-footer">
                      <span
                        className="timeline-type-tag"
                        style={{ background: config.color + '15', color: config.color }}
                      >
                        {config.icon} {config.label}
                      </span>
                      <span className="timeline-time">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 待办任务列表 */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <ClockCircleOutlined style={{ color: '#4F46E5', marginRight: 8 }} />
            待办任务
          </div>
          <div className="todo-list">
            {todoTasks.slice(0, 5).map((task) => {
              const isDone = completedTodoIds.has(task.id);
              return (
                <div
                  className={`todo-item ${isDone ? 'done' : ''}`}
                  key={task.id}
                >
                  <div
                    className={`todo-checkbox ${isDone ? 'checked' : ''}`}
                    onClick={() => !isDone && markTodoDone(task.id)}
                  >
                    {isDone && <CheckCircleOutlined />}
                  </div>
                  <div className="todo-info">
                    <div className="todo-title">{task.title}</div>
                    <div className="todo-meta">
                      <span
                        className="todo-priority"
                        style={{
                          color: getPriorityColor(task.priority),
                          background: getPriorityColor(task.priority) + '15',
                        }}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="todo-due">
                        截止 {formatDateFull(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部区域：快捷入口 + 最新资讯 */}
      <div className="dashboard-bottom">
        {/* 快捷入口 */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">
            <RightOutlined style={{ color: '#4F46E5', marginRight: 8, fontSize: 12 }} />
            快捷入口
          </div>
          <div className="quick-entries">
            {mockQuickEntries.map((entry) => (
              <div
                className="quick-entry-card"
                key={entry.id}
                onClick={() => navigate(entry.path)}
              >
                <div
                  className="quick-entry-icon"
                  style={{ background: entry.color + '15', color: entry.color }}
                >
                  {quickEntryIcons[entry.icon] || <CarryOutOutlined />}
                </div>
                <div className="quick-entry-name">{entry.name}</div>
                <div className="quick-entry-desc">{entry.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 最新资讯推荐 */}
        <div className="dashboard-card">
          <div
            className="dashboard-card-title clickable"
            onClick={() => navigate('/news')}
          >
            <ReadOutlined style={{ color: '#8B5CF6', marginRight: 8 }} />
            最新资讯
            <RightOutlined style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8' }} />
          </div>
          <div className="latest-news-list">
            {latestNews.map((news) => (
              <div
                className="latest-news-item"
                key={news.id}
                onClick={() => navigate('/news')}
              >
                <span
                  className="latest-news-category"
                  style={{ background: getCategoryColor(news.category) + '15', color: getCategoryColor(news.category) }}
                >
                  {getCategoryLabel(news.category)}
                </span>
                <span className="latest-news-title">{news.title}</span>
                <span className="latest-news-time">{formatDate(news.publishDate)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
