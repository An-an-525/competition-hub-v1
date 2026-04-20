import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginParams, RegisterParams } from '../types';
import { mockUsers } from '../mock';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (params: LoginParams) => { success: boolean; message: string };
  register: (params: RegisterParams) => { success: boolean; message: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (params: LoginParams) => {
        const found = mockUsers.find(
          (u) => u.username === params.username && u.password === params.password
        );
        if (found) {
          set({ user: found, isAuthenticated: true });
          return { success: true, message: '登录成功' };
        }
        return { success: false, message: '用户名或密码错误' };
      },

      register: (params: RegisterParams) => {
        const exists = mockUsers.find((u) => u.username === params.username);
        if (exists) {
          return { success: false, message: '用户名已存在' };
        }
        const newUser: User = {
          id: `user-${Date.now()}`,
          username: params.username,
          password: params.password,
          name: params.name,
          avatar: '',
          email: params.email,
          phone: '',
          department: params.department,
          position: params.position || '成员',
          role: 'member',
          bio: '',
          skills: [],
          joinDate: new Date().toISOString(),
          status: 'online',
        };
        mockUsers.push(newUser);
        set({ user: newUser, isAuthenticated: true });
        return { success: true, message: '注册成功' };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
