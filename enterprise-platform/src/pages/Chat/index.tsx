import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input, Button, Badge, Tooltip, Dropdown } from 'antd';
import {
  SendOutlined,
  SmileOutlined,
  PictureOutlined,
  PaperClipOutlined,
  SearchOutlined,
  MoreOutlined,
  TeamOutlined,
  UserOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { mockUsers } from '../../mock';
import { formatChatTime, getInitials } from '../../utils';
import type { Conversation } from '../../types';

const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const getAvatarColor = (id: string) => {
  const index = parseInt(id.replace(/\D/g, ''), 10) % avatarColors.length;
  return avatarColors[index] || avatarColors[0];
};

const getUserName = (userId: string) => {
  const found = mockUsers.find((u) => u.id === userId);
  return found ? found.name : '未知用户';
};

const statusTextMap: Record<string, string> = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
  away: '离开',
};

const statusColorMap: Record<string, string> = {
  online: '#10B981',
  offline: '#94A3B8',
  busy: '#EF4444',
  away: '#F59E0B',
};

const autoReplies = [
  '好的，收到！',
  '我马上处理。',
  '了解，稍后回复你。',
  '没问题，我来跟进。',
  '谢谢提醒！',
  '好的，我看一下。',
  '明白了，我这边确认一下。',
  '可以的，没问题。',
  '收到，辛苦了！',
  '好，我这边安排一下。',
];

const emojiList = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '😅',
  '😢', '😭', '😤', '🤯', '🥳', '😴', '🙄', '👍', '👎', '👏',
  '🙏', '💪', '🎉', '🔥', '❤️', '💯', '✅', '⭐', '🚀', '💡',
];

type TabType = 'all' | 'private' | 'group';

const Chat: React.FC = () => {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    sendMessage,
    getMessagesByConversation,
  } = useChatStore();
  const { user } = useAuthStore();

  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const messages = currentConversation ? getMessagesByConversation(currentConversation.id) : [];

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;
    if (activeTab === 'private') {
      result = result.filter((c) => c.type === 'private');
    } else if (activeTab === 'group') {
      result = result.filter((c) => c.type === 'group');
    }
    if (searchValue.trim()) {
      const keyword = searchValue.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword) ||
          (c.lastMessage?.content.toLowerCase().includes(keyword) ?? false)
      );
    }
    return result;
  }, [conversations, activeTab, searchValue]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || !currentConversation) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    setShowEmoji(false);

    // Simulate auto reply
    const otherParticipants = currentConversation.participants.filter((p) => p !== user?.id);
    if (otherParticipants.length > 0) {
      const replyDelay = 1000 + Math.random() * 2000;
      setTimeout(() => {
        const replyContent = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        const replySender = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
        // Directly add a message from the other user
        const { messages: currentMsgs, currentConversation: conv } = useChatStore.getState();
        if (conv) {
          const newMsg = {
            id: `msg-${Date.now()}`,
            conversationId: conv.id,
            senderId: replySender,
            content: replyContent,
            type: 'text' as const,
            timestamp: new Date().toISOString(),
            read: true,
          };
          useChatStore.setState({
            messages: [...currentMsgs, newMsg],
            conversations: useChatStore.getState().conversations.map((c) =>
              c.id === conv.id ? { ...c, lastMessage: newMsg, updatedAt: newMsg.timestamp } : c
            ),
          });
        }
      }, replyDelay);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const handleSendImage = () => {
    if (!currentConversation) return;
    const sampleImages = [
      'https://picsum.photos/seed/chat1/300/200',
      'https://picsum.photos/seed/chat2/300/200',
      'https://picsum.photos/seed/chat3/300/200',
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    sendMessage(randomImage, 'image');
  };

  const handleConversationClick = (conv: Conversation) => {
    setCurrentConversation(conv);
    setShowEmoji(false);
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') {
      return (
        <div
          className="chat-avatar chat-avatar-group"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #8B5CF6)' }}
        >
          <TeamOutlined style={{ fontSize: 18 }} />
        </div>
      );
    }
    const otherUserId = conv.participants.find((p) => p !== user?.id) || conv.participants[0];
    return (
      <div className="chat-avatar" style={{ background: getAvatarColor(otherUserId) }}>
        {getInitials(getUserName(otherUserId))}
      </div>
    );
  };

  const formatMessageTime = (timestamp: string, prevTimestamp?: string) => {
    const time = new Date(timestamp);
    const prev = prevTimestamp ? new Date(prevTimestamp) : null;
    const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // Show date separator if more than 5 minutes apart
    if (prev) {
      const diff = time.getTime() - prev.getTime();
      if (diff > 5 * 60 * 1000) {
        const dateStr = time.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        return { showSeparator: true, separatorText: dateStr, timeStr };
      }
    }
    return { showSeparator: false, separatorText: '', timeStr };
  };

  // Get other user info for the header
  const getOtherUserInfo = () => {
    if (!currentConversation || currentConversation.type === 'group') return null;
    const otherUserId = currentConversation.participants.find((p) => p !== user?.id);
    if (!otherUserId) return null;
    const otherUser = mockUsers.find((u) => u.id === otherUserId);
    return otherUser;
  };

  const otherUserInfo = getOtherUserInfo();

  return (
    <div className="chat-page">
      {/* Left Panel - Conversation List */}
      <div className="chat-list">
        <div className="chat-list-header">
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>消息</h3>
          <Tooltip title="发起群聊">
            <Button
              type="text"
              icon={<TeamOutlined />}
              style={{ color: '#4F46E5', fontSize: 16 }}
            />
          </Tooltip>
        </div>

        {/* Search */}
        <div className="chat-search">
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="搜索联系人/群组..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ borderRadius: 8, border: 'none', background: '#F1F5F9' }}
          />
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          {([
            { key: 'all', label: '全部消息' },
            { key: 'private', label: '私聊' },
            { key: 'group', label: '群聊' },
          ] as { key: TabType; label: string }[]).map((tab) => (
            <div
              key={tab.key}
              className={`chat-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Conversation List */}
        <div className="chat-list-items">
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <UserOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
              暂无会话
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`chat-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                onClick={() => handleConversationClick(conv)}
              >
                {getConversationAvatar(conv)}
                <div className="chat-info">
                  <div className="chat-name-row">
                    <span className="chat-name">{conv.name}</span>
                    <span className="chat-time">
                      {conv.lastMessage ? formatChatTime(conv.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <div className="chat-last-msg-row">
                    <span className="chat-last-msg">
                      {conv.lastMessage?.type === 'image' ? '[图片]' : conv.lastMessage?.content || '暂无消息'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <Badge
                        count={conv.unreadCount}
                        style={{
                          backgroundColor: '#EF4444',
                          fontSize: 11,
                          height: 18,
                          lineHeight: '18px',
                          minWidth: 18,
                          padding: '0 5px',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className="chat-main">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-main-header">
              <div className="chat-header-left">
                {getConversationAvatar(currentConversation)}
                <div className="chat-header-info">
                  <span className="chat-header-name">{currentConversation.name}</span>
                  {otherUserInfo && (
                    <span className="chat-header-status">
                      <span
                        className="status-dot"
                        style={{ background: statusColorMap[otherUserInfo.status] }}
                      />
                      {statusTextMap[otherUserInfo.status]}
                    </span>
                  )}
                  {!otherUserInfo && currentConversation.type === 'group' && (
                    <span className="chat-header-status">
                      <TeamOutlined style={{ fontSize: 12, marginRight: 4 }} />
                      {currentConversation.participants.length} 人
                    </span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                <Tooltip title="搜索消息">
                  <Button type="text" icon={<SearchOutlined />} style={{ color: '#64748B' }} />
                </Tooltip>
                <Dropdown
                  menu={{
                    items: [
                      { key: '1', label: '聊天设置' },
                      { key: '2', label: '消息免打扰' },
                      { key: '3', label: '清空聊天记录' },
                    ],
                  }}
                  trigger={['click']}
                >
                  <Button type="text" icon={<MoreOutlined />} style={{ color: '#64748B' }} />
                </Dropdown>
              </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;
                const prevMsg = index > 0 ? messages[index - 1] : undefined;
                const { showSeparator, separatorText, timeStr } = formatMessageTime(
                  msg.timestamp,
                  prevMsg?.timestamp
                );

                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="chat-system-message">
                      {msg.content}
                    </div>
                  );
                }

                return (
                  <React.Fragment key={msg.id}>
                    {showSeparator && (
                      <div className="chat-time-separator">
                        <span>{separatorText}</span>
                      </div>
                    )}
                    <div className={`chat-message ${isMine ? 'mine' : ''}`}>
                      {!isMine && (
                        <div
                          className="msg-avatar"
                          style={{ background: getAvatarColor(msg.senderId) }}
                        >
                          {getInitials(getUserName(msg.senderId))}
                        </div>
                      )}
                      <div className="msg-content-wrapper">
                        {!isMine && currentConversation.type === 'group' && (
                          <div className="msg-sender-name">{getUserName(msg.senderId)}</div>
                        )}
                        <div className="msg-bubble">
                          {msg.type === 'image' ? (
                            <img
                              src={msg.content}
                              alt="图片消息"
                              className="msg-image"
                              style={{
                                maxWidth: 240,
                                borderRadius: 8,
                                display: 'block',
                              }}
                            />
                          ) : (
                            <span>{msg.content}</span>
                          )}
                          <span className={`msg-time ${isMine ? 'mine' : ''}`}>{timeStr}</span>
                        </div>
                      </div>
                      {isMine && (
                        <div
                          className="msg-avatar"
                          style={{ background: getAvatarColor(msg.senderId) }}
                        >
                          {getInitials(getUserName(msg.senderId))}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <div className="chat-input-toolbar">
                <div className="emoji-picker-wrapper" ref={emojiRef}>
                  <Tooltip title="表情">
                    <Button
                      type="text"
                      icon={<SmileOutlined />}
                      style={{
                        fontSize: 18,
                        color: showEmoji ? '#4F46E5' : '#64748B',
                      }}
                      onClick={() => setShowEmoji(!showEmoji)}
                    />
                  </Tooltip>
                  {showEmoji && (
                    <div className="emoji-picker">
                      <div className="emoji-grid">
                        {emojiList.map((emoji) => (
                          <span
                            key={emoji}
                            className="emoji-item"
                            onClick={() => handleEmojiClick(emoji)}
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Tooltip title="发送图片">
                  <Button
                    type="text"
                    icon={<PictureOutlined />}
                    style={{ fontSize: 18, color: '#64748B' }}
                    onClick={handleSendImage}
                  />
                </Tooltip>
                <Tooltip title="发送文件">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    style={{ fontSize: 18, color: '#64748B' }}
                  />
                </Tooltip>
              </div>
              <div className="chat-input-row">
                <Input.TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息... (Enter发送, Shift+Enter换行)"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    resize: 'none',
                    fontSize: 14,
                  }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    borderRadius: 8,
                    height: 40,
                    minWidth: 40,
                    padding: '0 16px',
                  }}
                >
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <EllipsisOutlined style={{ fontSize: 48, color: '#CBD5E1' }} />
            </div>
            <div className="chat-empty-text">选择一个对话开始聊天</div>
            <div className="chat-empty-subtext">在左侧选择联系人或群组开始交流</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
