import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tag, Button, Modal, Form, Input, Progress, Timeline, Avatar, Badge,
  Tooltip, Upload, message, Drawer, Tree, Empty, Select,
} from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  TrophyOutlined,
  FolderOutlined,
  PaperClipOutlined,
  ApartmentOutlined,
  UserSwitchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { mockUsers } from '../../mock';
import { formatDate } from '../../utils';

const avatarColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

const getAvatarColor = (id: string) => {
  const index = parseInt(id.replace('user-', ''), 10) % avatarColors.length;
  return avatarColors[index];
};

const statusLabels: Record<string, { text: string; color: string }> = {
  online: { text: '在线', color: '#10B981' },
  offline: { text: '离线', color: '#6B7280' },
  busy: { text: '忙碌', color: '#EF4444' },
  away: { text: '离开', color: '#F59E0B' },
};

// 技能分类及颜色
const skillCategories: Record<string, { label: string; color: string; skills: string[] }> = {
  programming: {
    label: '编程语言',
    color: '#4F46E5',
    skills: ['React', 'Vue', 'TypeScript', 'JavaScript', 'Java', 'Go', 'Python', 'SQL'],
  },
  framework: {
    label: '框架工具',
    color: '#10B981',
    skills: ['Node.js', 'Spring Boot', 'Kubernetes', 'Docker', 'Webpack', 'Figma', 'Sketch', 'Axure'],
  },
  softskill: {
    label: '软技能',
    color: '#F59E0B',
    skills: ['产品设计', '数据分析', '用户研究', 'SEO', 'SEM', '新媒体运营', '内容营销', '招聘管理', '绩效管理', '培训发展', '劳动法', '组织发展', '动效设计', 'Photoshop', 'Illustrator', 'CSS', 'Redis', 'MySQL'],
  },
};

const getSkillCategory = (skill: string) => {
  for (const [key, cat] of Object.entries(skillCategories)) {
    if (cat.skills.includes(skill)) return { key, ...cat };
  }
  return { key: 'other', label: '其他', color: '#6B7280' };
};

// 模拟项目经历数据
const mockProjects = [
  {
    id: 'proj-1',
    name: '企业协作平台 V2.0',
    role: '技术负责人',
    time: '2024.01 - 至今',
    description: '主导平台架构升级，引入微前端架构，提升系统可维护性和团队协作效率。',
    status: 'active' as const,
  },
  {
    id: 'proj-2',
    name: '智能客服系统',
    role: '前端开发',
    time: '2023.06 - 2023.12',
    description: '负责前端模块开发，实现实时聊天、工单管理和数据看板功能。',
    status: 'completed' as const,
  },
  {
    id: 'proj-3',
    name: '移动端 APP 重构',
    role: '核心开发',
    time: '2023.01 - 2023.05',
    description: '使用 React Native 重构原有移动端应用，提升性能和用户体验。',
    status: 'completed' as const,
  },
  {
    id: 'proj-4',
    name: '数据中台建设',
    role: '技术支持',
    time: '2022.06 - 2022.12',
    description: '参与数据中台搭建，负责前端数据可视化模块开发。',
    status: 'completed' as const,
  },
];

// 模拟工作成果数据
const mockAchievements = [
  {
    id: 'ach-1',
    title: '微前端架构最佳实践文档',
    description: '总结团队微前端落地经验，形成内部技术规范文档。',
    time: '2024-01-10',
    attachment: '微前端架构实践.pdf',
  },
  {
    id: 'ach-2',
    title: '前端性能优化方案',
    description: '通过代码分割、懒加载等手段将首屏加载时间降低60%。',
    time: '2023-11-15',
    attachment: '性能优化报告.docx',
  },
  {
    id: 'ach-3',
    title: '技术分享 - React 18 新特性',
    description: '在团队内部进行 React 18 新特性技术分享，获得好评。',
    time: '2023-09-20',
    attachment: 'React18分享.pptx',
  },
  {
    id: 'ach-4',
    title: '组件库 v1.0 发布',
    description: '主导开发团队通用组件库，统一UI规范，提升开发效率。',
    time: '2023-07-01',
    attachment: '组件库文档.pdf',
  },
];

// 组织架构树数据
const orgTreeData = [
  {
    title: '总裁办',
    key: 'ceo',
    children: [
      {
        title: '技术部',
        key: 'tech',
        children: [
          { title: '张明远 (技术总监)', key: 'user-1', isLeaf: true },
          { title: '赵六 (前端工程师)', key: 'user-4', isLeaf: true },
          { title: '周八 (后端工程师)', key: 'user-6', isLeaf: true },
        ],
      },
      {
        title: '产品部',
        key: 'product',
        children: [
          { title: '李思 (产品经理)', key: 'user-2', isLeaf: true },
        ],
      },
      {
        title: '设计部',
        key: 'design',
        children: [
          { title: '王五 (UI设计师)', key: 'user-3', isLeaf: true },
        ],
      },
      {
        title: '市场部',
        key: 'market',
        children: [
          { title: '孙七 (市场专员)', key: 'user-5', isLeaf: true },
        ],
      },
      {
        title: '人事部',
        key: 'hr',
        children: [
          { title: '吴九 (HR经理)', key: 'user-7', isLeaf: true },
        ],
      },
    ],
  },
];

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuthStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [orgDrawerOpen, setOrgDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const profileUser = id
    ? mockUsers.find((u) => u.id === id)
    : currentUser;

  if (!profileUser) {
    return (
      <div style={{ textAlign: 'center', padding: 100, color: '#94A3B8' }}>
        <Empty description="用户不存在" />
      </div>
    );
  }

  const isSelf = !id || id === currentUser?.id;
  const status = statusLabels[profileUser.status] || statusLabels.offline;
  const avatarColor = getAvatarColor(profileUser.id);

  // 同部门成员
  const teamMembers = mockUsers.filter(
    (u) => u.department === profileUser.department && u.id !== profileUser.id
  );

  // 技能熟练度模拟数据
  const skillProficiency: Record<string, number> = {
    'React': 95, 'TypeScript': 90, 'Node.js': 85, 'Kubernetes': 80, 'Go': 75,
    'Vue': 88, 'CSS': 92, 'Webpack': 78, 'Java': 82, 'Spring Boot': 80,
    'MySQL': 85, 'Redis': 78, 'Docker': 88, 'Figma': 90, 'Sketch': 85,
    'Photoshop': 80, 'Illustrator': 75, 'Axure': 82, '产品设计': 88,
    '数据分析': 85, '用户研究': 80, 'SEO': 75, 'SEM': 78,
    '新媒体运营': 82, '内容营销': 80, '招聘管理': 85,
    '绩效管理': 80, '培训发展': 78, '劳动法': 72, '组织发展': 82,
    '动效设计': 85, 'Python': 70, 'SQL': 76,
  };

  const handleEditProfile = () => {
    form.setFieldsValue({
      name: profileUser.name,
      bio: profileUser.bio,
      email: profileUser.email,
      phone: profileUser.phone,
      skills: profileUser.skills,
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    form.validateFields().then((values) => {
      updateProfile(values);
      message.success('资料更新成功');
      setEditModalOpen(false);
    });
  };

  const handleOrgSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0] as string;
      if (key.startsWith('user-')) {
        navigate(`/profile/${key}`);
        setOrgDrawerOpen(false);
      }
    }
  };

  return (
    <div className="profile-page">
      {/* 个人信息头部区域 */}
      <div className="profile-hero-section">
        <div className="profile-hero-bg" style={{ background: `linear-gradient(135deg, ${avatarColor}22, ${avatarColor}08)` }} />
        <div className="profile-hero-content">
          <div className="profile-avatar-wrapper">
            <Badge
              dot
              color={status.color}
              offset={[-4, 4]}
              style={{ width: 14, height: 14, boxShadow: '0 0 0 3px white' }}
            >
              <div className="profile-avatar-large" style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` }}>
                {profileUser.name.charAt(0)}
              </div>
            </Badge>
          </div>
          <h1 className="profile-name-large">{profileUser.name}</h1>
          <Tag color={avatarColor} className="profile-position-tag">
            {profileUser.position}
          </Tag>
          <div className="profile-dept-info">
            <TeamOutlined style={{ marginRight: 6 }} />
            {profileUser.department}
            <span style={{ margin: '0 12px', color: '#E2E8F0' }}>|</span>
            <CalendarOutlined style={{ marginRight: 6 }} />
            {formatDate(profileUser.joinDate)} 入职
          </div>
          <p className="profile-bio-text">{profileUser.bio}</p>
          <div className="profile-actions">
            {isSelf && (
              <Button type="primary" icon={<EditOutlined />} size="large" onClick={handleEditProfile}>
                编辑资料
              </Button>
            )}
            {!isSelf && (
              <>
                <Button type="primary" icon={<EditOutlined />} size="large">
                  编辑资料
                </Button>
                <Button icon={<MessageOutlined />} size="large" onClick={() => navigate('/chat')}>
                  发消息
                </Button>
              </>
            )}
            <Button icon={<ApartmentOutlined />} size="large" onClick={() => setOrgDrawerOpen(true)}>
              组织架构
            </Button>
          </div>
        </div>
      </div>

      {/* 信息卡片网格区域 */}
      <div className="profile-cards-grid">
        {/* 基本信息 */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3><IdcardOutlined style={{ marginRight: 8, color: '#4F46E5' }} />基本信息</h3>
          </div>
          <div className="profile-card-body">
            <div className="profile-info-list">
              <div className="profile-info-row">
                <div className="profile-info-icon" style={{ background: '#EEF2FF' }}>
                  <PhoneOutlined style={{ color: '#4F46E5' }} />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">联系电话</span>
                  <span className="profile-info-value">{profileUser.phone}</span>
                </div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-icon" style={{ background: '#F0FDF4' }}>
                  <MailOutlined style={{ color: '#10B981' }} />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">电子邮箱</span>
                  <span className="profile-info-value">{profileUser.email}</span>
                </div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-icon" style={{ background: '#FFF7ED' }}>
                  <EnvironmentOutlined style={{ color: '#F59E0B' }} />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">工作地点</span>
                  <span className="profile-info-value">长沙高新区芯城科技园</span>
                </div>
              </div>
              <div className="profile-info-row">
                <div className="profile-info-icon" style={{ background: '#FDF2F8' }}>
                  <IdcardOutlined style={{ color: '#EC4899' }} />
                </div>
                <div className="profile-info-content">
                  <span className="profile-info-label">工号</span>
                  <span className="profile-info-value">{profileUser.id.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 技能标签 */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3><TrophyOutlined style={{ marginRight: 8, color: '#F59E0B' }} />技能标签</h3>
          </div>
          <div className="profile-card-body">
            {/* 技能分类图例 */}
            <div className="skill-category-legend">
              {Object.entries(skillCategories).map(([key, cat]) => (
                <div key={key} className="skill-legend-item">
                  <span className="skill-legend-dot" style={{ background: cat.color }} />
                  <span>{cat.label}</span>
                </div>
              ))}
            </div>
            {/* 技能标签云 */}
            <div className="skill-tags-cloud">
              {profileUser.skills.map((skill) => {
                const cat = getSkillCategory(skill);
                const proficiency = skillProficiency[skill] || Math.floor(Math.random() * 30 + 60);
                return (
                  <Tooltip
                    key={skill}
                    title={
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{skill}</div>
                        <div style={{ fontSize: 12 }}>{cat.label}</div>
                        <div style={{ fontSize: 12 }}>熟练度: {proficiency}%</div>
                      </div>
                    }
                  >
                    <Tag
                      className="skill-tag-item"
                      style={{
                        borderColor: `${cat.color}40`,
                        background: `${cat.color}10`,
                        color: cat.color,
                      }}
                    >
                      {skill}
                    </Tag>
                  </Tooltip>
                );
              })}
            </div>
            {/* 技能熟练度进度条 */}
            <div className="skill-proficiency-bars">
              {profileUser.skills.slice(0, 4).map((skill) => {
                const cat = getSkillCategory(skill);
                const proficiency = skillProficiency[skill] || 70;
                return (
                  <div key={skill} className="skill-bar-item">
                    <div className="skill-bar-header">
                      <span className="skill-bar-name">{skill}</span>
                      <span className="skill-bar-value" style={{ color: cat.color }}>{proficiency}%</span>
                    </div>
                    <Progress
                      percent={proficiency}
                      showInfo={false}
                      strokeColor={cat.color}
                      trailColor={`${cat.color}15`}
                      size="small"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 项目经历 */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3><FolderOutlined style={{ marginRight: 8, color: '#8B5CF6' }} />项目经历</h3>
          </div>
          <div className="profile-card-body">
            <Timeline
              items={mockProjects.map((proj) => ({
                dot: proj.status === 'active'
                  ? <SyncOutlined spin style={{ color: '#4F46E5', fontSize: 14 }} />
                  : <CheckCircleOutlined style={{ color: '#10B981', fontSize: 14 }} />,
                children: (
                  <div className="project-timeline-item">
                    <div className="project-timeline-header">
                      <span className="project-timeline-name">{proj.name}</span>
                      <Tag
                        color={proj.status === 'active' ? 'processing' : 'success'}
                        style={{ marginLeft: 8, fontSize: 11 }}
                      >
                        {proj.status === 'active' ? '进行中' : '已完成'}
                      </Tag>
                    </div>
                    <div className="project-timeline-role">
                      {proj.role} <ClockCircleOutlined style={{ marginLeft: 8, marginRight: 4 }} /> {proj.time}
                    </div>
                    <div className="project-timeline-desc">{proj.description}</div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>

        {/* 工作成果 */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3><TrophyOutlined style={{ marginRight: 8, color: '#10B981' }} />工作成果</h3>
          </div>
          <div className="profile-card-body">
            <div className="achievements-list">
              {mockAchievements.map((ach) => (
                <div key={ach.id} className="achievement-item">
                  <div className="achievement-icon">
                    <TrophyOutlined />
                  </div>
                  <div className="achievement-content">
                    <div className="achievement-title">{ach.title}</div>
                    <div className="achievement-desc">{ach.description}</div>
                    <div className="achievement-footer">
                      <span className="achievement-time">
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatDate(ach.time)}
                      </span>
                      {ach.attachment && (
                        <span className="achievement-attachment">
                          <PaperClipOutlined style={{ marginRight: 4 }} />
                          {ach.attachment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 团队成员 */}
        {!isSelf && teamMembers.length > 0 && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3><UserSwitchOutlined style={{ marginRight: 8, color: '#06B6D4' }} />同部门成员</h3>
              <span className="profile-card-badge">{teamMembers.length}</span>
            </div>
            <div className="profile-card-body">
              <div className="team-members-grid">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="team-member-card"
                    onClick={() => navigate(`/profile/${member.id}`)}
                  >
                    <Badge
                      dot
                      color={statusLabels[member.status]?.color || '#6B7280'}
                      offset={[-2, 30]}
                    >
                      <Avatar
                        size={48}
                        style={{
                          background: `linear-gradient(135deg, ${getAvatarColor(member.id)}, ${getAvatarColor(member.id)}cc)`,
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                    </Badge>
                    <div className="team-member-name">{member.name}</div>
                    <div className="team-member-position">{member.position}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑个人资料"
        open={editModalOpen}
        onOk={handleSaveProfile}
        onCancel={() => setEditModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Upload
              showUploadList={false}
              beforeUpload={() => { message.info('头像上传功能演示'); return false; }}
            >
              <Badge
                dot
                color={status.color}
                offset={[-4, 4]}
              >
                <Avatar
                  size={80}
                  style={{
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                    fontSize: 28,
                    cursor: 'pointer',
                  }}
                >
                  {profileUser.name.charAt(0)}
                </Avatar>
              </Badge>
            </Upload>
            <div style={{ marginTop: 8, fontSize: 13, color: '#94A3B8' }}>点击更换头像</div>
          </div>
          <Form.Item name="name" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={3} placeholder="一句话介绍自己" maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确的邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="skills" label="技能标签">
            <Select
              mode="tags"
              placeholder="输入技能后按回车添加"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
              options={Object.entries(skillCategories).flatMap(([_, cat]) =>
                cat.skills.map((s) => ({ label: `${s} (${cat.label})`, value: s }))
              )}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 组织架构侧边抽屉 */}
      <Drawer
        title="组织架构"
        placement="right"
        width={320}
        open={orgDrawerOpen}
        onClose={() => setOrgDrawerOpen(false)}
      >
        <Tree
          showLine
          showIcon={false}
          defaultExpandAll
          selectedKeys={profileUser ? [profileUser.id] : []}
          onSelect={handleOrgSelect}
          treeData={orgTreeData}
          style={{ marginTop: 8 }}
        />
      </Drawer>
    </div>
  );
};

export default Profile;
