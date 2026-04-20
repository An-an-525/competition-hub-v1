import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  DashboardOutlined,
  MessageOutlined,
  UnorderedListOutlined,
  UserOutlined,
  FolderOutlined,
  ReadOutlined,
  BankOutlined,
} from '@ant-design/icons';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/chat', icon: <MessageOutlined />, label: '即时通讯' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务看板' },
  { key: '/profile', icon: <UserOutlined />, label: '人物画像' },
  { key: '/files', icon: <FolderOutlined />, label: '资料共享' },
  { key: '/news', icon: <ReadOutlined />, label: '资讯推荐' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  return (
    <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <BankOutlined />
        </div>
        <span className="logo-text">协作平台</span>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.key);
          return (
            <div
              key={item.key}
              className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.key)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          {sidebarCollapsed ? 'v1.0' : 'Enterprise v1.0'}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
