import { create } from 'zustand';
import type { Task, TaskStatus, TaskFilter } from '../types';
import { mockTasks } from '../mock';

interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
  setFilter: (filter: Partial<TaskFilter>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: mockTasks,
  filter: {
    keyword: '',
    priority: 'all',
    assigneeId: 'all',
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task
      ),
    }));
  },

  updateTask: (taskId, data) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, ...data, updatedAt: new Date().toISOString() }
          : task
      ),
    }));
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    return tasks.filter((task) => {
      if (filter.keyword && !task.title.includes(filter.keyword) && !task.description.includes(filter.keyword)) {
        return false;
      }
      if (filter.priority !== 'all' && task.priority !== filter.priority) {
        return false;
      }
      if (filter.assigneeId !== 'all' && task.assigneeId !== filter.assigneeId) {
        return false;
      }
      return true;
    });
  },

  getTasksByStatus: (status) => {
    return get().getFilteredTasks().filter((task) => task.status === status);
  },
}));
