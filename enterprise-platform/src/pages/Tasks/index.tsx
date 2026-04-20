import React, { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Table,
  Tooltip,
  Progress,
  Popconfirm,
  DatePicker,
  Space,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HolderOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../../store/useTaskStore';
import { mockUsers } from '../../mock';
import { getPriorityColor, getInitials } from '../../utils';
import type { Task, TaskStatus, TaskPriority } from '../../types';

// ==================== Constants ====================

const statusColumns: { id: TaskStatus; title: string; color: string; icon: React.ReactNode }[] = [
  { id: 'todo', title: '待办', color: '#6B7280', icon: <InboxOutlined /> },
  { id: 'inProgress', title: '进行中', color: '#3B82F6', icon: <ClockCircleOutlined /> },
  { id: 'review', title: '审核中', color: '#F59E0B', icon: <ExclamationCircleOutlined /> },
  { id: 'done', title: '已完成', color: '#10B981', icon: <CheckCircleOutlined /> },
];

const priorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const priorityColors: Record<TaskPriority, string> = {
  low: '#10B981',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

const tagColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];

const allTags = ['前端', '后端', '设计', 'UI', '重构', 'WebSocket', '数据库', '文档', '移动端', '测试', '管理', '人事', '培训', '市场', '视频'];

const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const getAvatarColor = (id: string) => {
  const index = parseInt(id.replace(/\D/g, ''), 10) % avatarColors.length;
  return avatarColors[index] || avatarColors[0];
};

type ViewMode = 'board' | 'list';

// ==================== Sortable Task Card ====================

interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = mockUsers.find((u) => u.id === task.assigneeId);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card"
    >
      <div className="task-card-priority-bar" style={{ background: priorityColors[task.priority] }} />
      <div className="task-card-content">
        <div className="task-card-header">
          <span className="task-title">{task.title}</span>
          <span
            className="task-drag-handle"
            {...attributes}
            {...listeners}
          >
            <HolderOutlined style={{ color: '#CBD5E1', cursor: 'grab' }} />
          </span>
        </div>
        {task.description && (
          <div className="task-desc">{task.description}</div>
        )}
        <div className="task-tags">
          <Tag
            color={getPriorityColor(task.priority)}
            style={{ fontSize: 11, margin: 0, padding: '0 6px', borderRadius: 4, lineHeight: '20px' }}
          >
            {priorityLabels[task.priority]}
          </Tag>
          {task.tags.slice(0, 3).map((tag) => (
            <span
              className="task-tag"
              key={tag}
              style={{ background: tagColors[allTags.indexOf(tag) % tagColors.length] + '18', color: tagColors[allTags.indexOf(tag) % tagColors.length] }}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="task-card-footer">
          <div className="task-card-meta">
            {assignee && (
              <div className="task-assignee-info">
                <div
                  className="task-assignee"
                  style={{ background: getAvatarColor(task.assigneeId) }}
                  title={assignee.name}
                >
                  {getInitials(assignee.name)}
                </div>
                <span className="task-assignee-name">{assignee.name}</span>
              </div>
            )}
            {task.dueDate && (
              <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
                {isOverdue && <WarningOutlined style={{ fontSize: 11, marginRight: 3 }} />}
                {task.dueDate}
              </span>
            )}
          </div>
          <div className="task-card-actions">
            <Tooltip title="编辑">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(task)} style={{ color: '#64748B' }} />
            </Tooltip>
            <Popconfirm
              title="确定删除此任务？"
              onConfirm={() => onDelete(task.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#EF4444' }} />
              </Tooltip>
            </Popconfirm>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Tasks Component ====================

const Tasks: React.FC = () => {
  const {
    tasks,
    filter,
    setFilter,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    getFilteredTasks,
    getTasksByStatus,
  } = useTaskStore();

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'inProgress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    return { total, inProgress, done, overdue };
  }, [tasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled by DndContext collision detection
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    // Find which column the task was dropped into
    let targetStatus: TaskStatus | null = null;

    for (const column of statusColumns) {
      const columnTasks = getTasksByStatus(column.id);
      if (columnTasks.some((t) => t.id === overId)) {
        targetStatus = column.id;
        break;
      }
    }

    // Check if dropped on a column itself
    if (!targetStatus) {
      for (const column of statusColumns) {
        if (column.id === overId) {
          targetStatus = column.id;
          break;
        }
      }
    }

    if (targetStatus) {
      const task = tasks.find((t) => t.id === activeTaskId);
      if (task && task.status !== targetStatus) {
        updateTaskStatus(activeTaskId, targetStatus);
        message.success(`任务已移至"${statusColumns.find((c) => c.id === targetStatus)?.title}"`);
      }
    }
  };

  // Modal handlers
  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate ? undefined : undefined,
        tags: task.tags,
      });
    } else {
      setEditingTask(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const taskData = {
        title: values.title,
        description: values.description || '',
        priority: values.priority,
        assigneeId: values.assigneeId,
        reporterId: 'user-1',
        tags: values.tags || [],
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : '',
      };

      if (editingTask) {
        updateTask(editingTask.id, taskData);
        message.success('任务更新成功');
      } else {
        addTask({ ...taskData, status: 'todo' });
        message.success('任务创建成功');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingTask(null);
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    message.success('任务已删除');
  };

  // Find the active task for drag overlay
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  // Table columns for list view
  const tableColumns = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Task) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: priorityColors[record.priority], flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </div>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assigneeId',
      key: 'assigneeId',
      width: 120,
      render: (assigneeId: string) => {
        const assignee = mockUsers.find((u) => u.id === assigneeId);
        return assignee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: getAvatarColor(assigneeId),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {getInitials(assignee.name)}
            </div>
            <span>{assignee.name}</span>
          </div>
        ) : '-';
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: TaskPriority) => (
        <Tag color={getPriorityColor(priority)} style={{ margin: 0 }}>
          {priorityLabels[priority]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const col = statusColumns.find((c) => c.id === status);
        return (
          <Tag
            style={{
              margin: 0,
              background: col ? col.color + '18' : '#F1F5F9',
              color: col ? col.color : '#6B7280',
              border: 'none',
              borderRadius: 4,
            }}
          >
            {col?.title || status}
          </Tag>
        );
      },
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (dueDate: string, record: Task) => {
        if (!dueDate) return '-';
        const isOverdue = new Date(dueDate) < new Date() && record.status !== 'done';
        return (
          <span style={{ color: isOverdue ? '#EF4444' : '#64748B' }}>
            {isOverdue && <WarningOutlined style={{ fontSize: 11, marginRight: 4 }} />}
            {dueDate}
          </span>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 11,
                padding: '1px 8px',
                borderRadius: 4,
                background: tagColors[allTags.indexOf(tag) % tagColors.length] + '18',
                color: tagColors[allTags.indexOf(tag) % tagColors.length],
              }}
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && <span style={{ fontSize: 11, color: '#94A3B8' }}>+{tags.length - 3}</span>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Task) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Tooltip title="查看">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm
            title="确定删除此任务？"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#EF4444' }} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredTasks = getFilteredTasks();

  return (
    <div className="tasks-page">
      {/* Statistics Panel */}
      <div className="tasks-stats">
        <div className="tasks-stat-card">
          <div className="tasks-stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
            <InboxOutlined style={{ fontSize: 22 }} />
          </div>
          <div className="tasks-stat-info">
            <div className="tasks-stat-value">{stats.total}</div>
            <div className="tasks-stat-label">总任务数</div>
          </div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
            <ClockCircleOutlined style={{ fontSize: 22 }} />
          </div>
          <div className="tasks-stat-info">
            <div className="tasks-stat-value">{stats.inProgress}</div>
            <div className="tasks-stat-label">进行中</div>
          </div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
            <CheckCircleOutlined style={{ fontSize: 22 }} />
          </div>
          <div className="tasks-stat-info">
            <div className="tasks-stat-value">{stats.done}</div>
            <div className="tasks-stat-label">已完成</div>
          </div>
        </div>
        <div className="tasks-stat-card">
          <div className="tasks-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            <WarningOutlined style={{ fontSize: 22 }} />
          </div>
          <div className="tasks-stat-info">
            <div className="tasks-stat-value">{stats.overdue}</div>
            <div className="tasks-stat-label">逾期任务</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="tasks-progress-section">
        <div className="tasks-progress-header">
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>整体进度</span>
          <span style={{ fontSize: 14, color: '#4F46E5', fontWeight: 600 }}>{completionRate}%</span>
        </div>
        <Progress
          percent={completionRate}
          showInfo={false}
          strokeColor="#4F46E5"
          trailColor="#E2E8F0"
          size="small"
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Toolbar */}
      <div className="tasks-toolbar">
        <div className="tasks-toolbar-left">
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="搜索任务..."
            value={filter.keyword}
            onChange={(e) => setFilter({ keyword: e.target.value })}
            style={{ width: 220, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={filter.priority}
            onChange={(value) => setFilter({ priority: value })}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部优先级' },
              { value: 'urgent', label: '紧急' },
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
          />
          <Select
            value={filter.assigneeId}
            onChange={(value) => setFilter({ assigneeId: value })}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部成员' },
              ...mockUsers.map((u) => ({ value: u.id, label: u.name })),
            ]}
          />
        </div>
        <div className="tasks-toolbar-right">
          <div className="tasks-view-switch">
            <Button
              type={viewMode === 'board' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('board')}
              style={{ borderRadius: '8px 0 0 8px' }}
              size="small"
            >
              看板
            </Button>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: '0 8px 8px 0' }}
              size="small"
            >
              列表
            </Button>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{ borderRadius: 8 }}
          >
            新建任务
          </Button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="task-board">
            {statusColumns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <div className="task-column" key={column.id}>
                  <div className="task-column-header">
                    <div className="task-column-title">
                      <span
                        className="task-column-dot"
                        style={{ background: column.color }}
                      />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{column.title}</span>
                    </div>
                    <span className="column-count">{columnTasks.length}</span>
                  </div>
                  <SortableContext
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="task-column-body">
                      {columnTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleOpenModal}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <div
                    className="task-column-add"
                    onClick={() => {
                      form.resetFields();
                      setEditingTask(null);
                      form.setFieldsValue({ priority: 'medium' });
                      setIsModalOpen(true);
                    }}
                  >
                    <PlusOutlined style={{ fontSize: 12, marginRight: 4 }} />
                    添加任务
                  </div>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="task-card task-card-dragging">
                <div className="task-card-priority-bar" style={{ background: priorityColors[activeTask.priority] }} />
                <div className="task-card-content">
                  <div className="task-title">{activeTask.title}</div>
                  <div className="task-tags">
                    <Tag
                      color={getPriorityColor(activeTask.priority)}
                      style={{ fontSize: 11, margin: 0, padding: '0 6px', borderRadius: 4, lineHeight: '20px' }}
                    >
                      {priorityLabels[activeTask.priority]}
                    </Tag>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="tasks-list-view">
          <Table
            dataSource={filteredTasks}
            columns={tableColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个任务` }}
            style={{ background: 'white', borderRadius: 12 }}
            rowClassName="task-table-row"
          />
        </div>
      )}

      {/* Create/Edit Task Modal */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingTask ? '保存' : '创建'}
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select
                placeholder="选择优先级"
                options={[
                  { value: 'low', label: '低' },
                  { value: 'medium', label: '中' },
                  { value: 'high', label: '高' },
                  { value: 'urgent', label: '紧急' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="assigneeId"
              label="负责人"
              rules={[{ required: true, message: '请选择负责人' }]}
            >
              <Select
                placeholder="选择负责人"
                options={mockUsers.map((u) => ({ value: u.id, label: `${u.name} - ${u.department}` }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="dueDate" label="截止日期">
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择截止日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="multiple"
              placeholder="选择标签"
              options={allTags.map((tag) => ({ value: tag, label: tag }))}
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
