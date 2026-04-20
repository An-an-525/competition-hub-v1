import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Dropdown, Badge, Avatar, Space } from 'antd';
import {
  SearchOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { mockNotifications } from '../../mock';
import { getInitials } from '../../utils';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [searchValue, setSearchValue] = useState('');

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人中心',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '系统设置',
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <div className="layout-header">
      <Space size="middle">
        <span
          className="header-toggle-btn"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
        <Input
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="搜索..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="header-search-input"
          allowClear
        />
      </Space>
      <Space size="middle">
        <Badge count={unreadCount} size="small">
          <span className="header-icon-btn">
            <BellOutlined />
          </span>
        </Badge>
        <Dropdown menu={userMenuItems} placement="bottomRight" trigger={['click']}>
          <Space className="header-user-info">
            <Avatar
              size={36}
              className="header-avatar"
              icon={user ? getInitials(user.name) : <UserOutlined />}
            >
              {user && getInitials(user.name)}
            </Avatar>
            {user && (
              <span className="header-username">{user.name}</span>
            )}
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
};

export default Header;
