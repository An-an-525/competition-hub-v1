import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { mockConversations, mockMessages } from '../mock';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, type?: Message['type']) => void;
  getMessagesByConversation: (conversationId: string) => Message[];
  markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: mockConversations,
  currentConversation: null,
  messages: mockMessages,

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
    if (conversation) {
      get().markAsRead(conversation.id);
    }
  },

  sendMessage: (content: string, type: Message['type'] = 'text') => {
    const { currentConversation, messages } = get();
    if (!currentConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: currentConversation.id,
      senderId: 'user-1',
      content,
      type,
      timestamp: new Date().toISOString(),
      read: true,
    };

    set({
      messages: [...messages, newMessage],
      conversations: get().conversations.map((conv) =>
        conv.id === currentConversation.id
          ? { ...conv, lastMessage: newMessage, updatedAt: newMessage.timestamp }
          : conv
      ),
    });
  },

  getMessagesByConversation: (conversationId: string) => {
    return get().messages.filter((msg) => msg.conversationId === conversationId);
  },

  markAsRead: (conversationId: string) => {
    set({
      conversations: get().conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    });
  },
}));
