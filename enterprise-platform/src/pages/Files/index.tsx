import React, { useState, useMemo } from 'react';
import {
  Table, Input, Select, Button, Tag, message, Modal, Upload, Drawer,
  Tooltip, Progress, Avatar, Space, Segmented, Empty, List,
} from 'antd';
import type { UploadProps } from 'antd';
import {
  SearchOutlined, DownloadOutlined, AppstoreOutlined,
  UnorderedListOutlined, EyeOutlined, ShareAltOutlined, DeleteOutlined,
  FileOutlined, CloudUploadOutlined, InboxOutlined,
  FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  FilePptOutlined, FileImageOutlined, FileTextOutlined, FileZipOutlined,
  FolderOutlined, CloudServerOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { mockFiles, mockUsers } from '../../mock';
import { formatFileSize, formatDate } from '../../utils';
import type { FileItem } from '../../types';

const { Dragger } = Upload;

// 文件类型图标和颜色映射
const fileTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pdf: { icon: <FilePdfOutlined />, color: '#EF4444', label: 'PDF' },
  docx: { icon: <FileWordOutlined />, color: '#3B82F6', label: 'Word' },
  doc: { icon: <FileWordOutlined />, color: '#3B82F6', label: 'Word' },
  xlsx: { icon: <FileExcelOutlined />, color: '#10B981', label: 'Excel' },
  xls: { icon: <FileExcelOutlined />, color: '#10B981', label: 'Excel' },
  pptx: { icon: <FilePptOutlined />, color: '#F59E0B', label: 'PPT' },
  ppt: { icon: <FilePptOutlined />, color: '#F59E0B', label: 'PPT' },
  png: { icon: <FileImageOutlined />, color: '#8B5CF6', label: '图片' },
  jpg: { icon: <FileImageOutlined />, color: '#8B5CF6', label: '图片' },
  jpeg: { icon: <FileImageOutlined />, color: '#8B5CF6', label: '图片' },
  gif: { icon: <FileImageOutlined />, color: '#8B5CF6', label: '图片' },
  svg: { icon: <FileImageOutlined />, color: '#8B5CF6', label: '图片' },
  zip: { icon: <FileZipOutlined />, color: '#F97316', label: '压缩包' },
  rar: { icon: <FileZipOutlined />, color: '#F97316', label: '压缩包' },
  sketch: { icon: <FileImageOutlined />, color: '#F59E0B', label: 'Sketch' },
  txt: { icon: <FileTextOutlined />, color: '#6B7280', label: '文本' },
  md: { icon: <FileTextOutlined />, color: '#6B7280', label: 'Markdown' },
};

const getFileTypeConfig = (type: string) => {
  return fileTypeConfig[type] || { icon: <FileOutlined />, color: '#6B7280', label: type.toUpperCase() };
};

// 模拟版本历史
const mockVersionHistory = [
  { version: 'v2.0', time: '2024-01-15 10:30', uploader: '张明远', size: '2.0 MB' },
  { version: 'v1.1', time: '2024-01-10 14:20', uploader: '张明远', size: '1.8 MB' },
  { version: 'v1.0', time: '2024-01-05 09:00', uploader: '张明远', size: '1.5 MB' },
];

const Files: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('time');
  const [viewMode, setViewMode] = useState<string>('list');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const categories = Array.from(new Set(mockFiles.map((f) => f.category)));
  const fileTypes = Array.from(new Set(mockFiles.map((f) => f.type)));

  // 统计数据
  const totalStorage = 10 * 1024 * 1024 * 1024; // 10GB
  const usedStorage = mockFiles.reduce((sum, f) => sum + f.size, 0);
  const storagePercent = Math.round((usedStorage / totalStorage) * 100);

  // 文件类型分布统计
  const fileTypeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    mockFiles.forEach((f) => {
      const config = getFileTypeConfig(f.type);
      dist[config.label] = (dist[config.label] || 0) + 1;
    });
    return Object.entries(dist).map(([name, count]) => ({ name, count }));
  }, []);

  const typeColorMap: Record<string, string> = {
    PDF: '#EF4444', Word: '#3B82F6', Excel: '#10B981', PPT: '#F59E0B',
    '图片': '#8B5CF6', '压缩包': '#F97316', Sketch: '#F59E0B', '文本': '#6B7280',
  };

  // 最近上传
  const recentFiles = [...mockFiles].sort((a, b) =>
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  ).slice(0, 3);

  // 筛选和排序
  const filteredFiles = useMemo(() => {
    let result = mockFiles.filter((file) => {
      if (searchKeyword && !file.name.includes(searchKeyword) && !file.description.includes(searchKeyword)) {
        return false;
      }
      if (categoryFilter !== 'all' && file.category !== categoryFilter) {
        return false;
      }
      if (typeFilter !== 'all' && file.type !== typeFilter) {
        return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return b.size - a.size;
        case 'time':
        default: return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
    });

    return result;
  }, [searchKeyword, categoryFilter, typeFilter, sortBy]);

  const getUploaderName = (id: string) => {
    return mockUsers.find((u) => u.id === id)?.name || '未知';
  };

  const getUploaderAvatar = (id: string) => {
    const user = mockUsers.find((u) => u.id === id);
    if (!user) return '#6B7280';
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
    const index = parseInt(id.replace('user-', ''), 10) % colors.length;
    return colors[index];
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setDetailDrawerOpen(true);
  };

  const handleShare = (file: FileItem) => {
    message.success(`已生成「${file.name}」的分享链接`);
  };

  const handleDelete = (file: FileItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件「${file.name}」吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => message.success('文件已删除'),
    });
  };

  const handleUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setUploading(false);
          setTimeout(() => {
            message.success('文件上传成功');
            setUploadModalOpen(false);
            setUploadProgress(0);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: () => { handleUpload(); return false; },
  };

  // 列表视图列定义
  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => {
        const config = getFileTypeConfig(record.type);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => handlePreview(record)}>
            <div className="file-type-icon" style={{ background: `${config.color}12`, color: config.color }}>
              {config.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.description}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '上传者',
      dataIndex: 'uploaderId',
      key: 'uploaderId',
      width: 120,
      render: (id: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} style={{ background: getUploaderAvatar(id), fontSize: 11 }}>
            {getUploaderName(id).charAt(0)}
          </Avatar>
          <span>{getUploaderName(id)}</span>
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <Tag style={{ borderRadius: 4, background: '#F1F5F9', border: 'none', color: '#64748B' }}>{category}</Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      sorter: (a: FileItem, b: FileItem) => a.size - b.size,
      render: (size: number) => <span style={{ color: '#64748B' }}>{formatFileSize(size)}</span>,
    },
    {
      title: '上传时间',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 140,
      sorter: (a: FileItem, b: FileItem) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      render: (date: string) => <span style={{ color: '#64748B' }}>{formatDate(date)}</span>,
    },
    {
      title: '下载',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ color: '#94A3B8', fontSize: 13 }}>{count}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: FileItem) => (
        <Space size={4}>
          <Tooltip title="预览">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)} />
          </Tooltip>
          <Tooltip title="下载">
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => message.success('文件下载中...')} />
          </Tooltip>
          <Tooltip title="分享">
            <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={() => handleShare(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="files-page">
      {/* 顶部标题和统计 */}
      <div className="files-page-header">
        <div>
          <h2 className="files-page-title">资料共享</h2>
          <p className="files-page-subtitle">团队文件管理中心，支持上传、预览、分享和协作</p>
        </div>
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          size="large"
          onClick={() => setUploadModalOpen(true)}
          style={{ borderRadius: 10, height: 44, fontSize: 15, paddingLeft: 24, paddingRight: 24 }}
        >
          上传文件
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="files-stats-grid">
        <div className="files-stat-card">
          <div className="files-stat-icon" style={{ background: '#EEF2FF' }}>
            <CloudServerOutlined style={{ color: '#4F46E5', fontSize: 20 }} />
          </div>
          <div className="files-stat-info">
            <div className="files-stat-value">{formatFileSize(usedStorage)}</div>
            <div className="files-stat-label">已使用空间</div>
          </div>
          <div className="files-stat-extra">
            <Progress
              type="circle"
              percent={storagePercent}
              size={48}
              strokeColor="#4F46E5"
              trailColor="#EEF2FF"
              format={(p) => <span style={{ fontSize: 11, color: '#4F46E5' }}>{p}%</span>}
            />
          </div>
        </div>

        <div className="files-stat-card">
          <div className="files-stat-icon" style={{ background: '#F0FDF4' }}>
            <FolderOutlined style={{ color: '#10B981', fontSize: 20 }} />
          </div>
          <div className="files-stat-info">
            <div className="files-stat-value">{mockFiles.length}</div>
            <div className="files-stat-label">文件总数</div>
          </div>
          <div className="files-stat-type-bars">
            {fileTypeDistribution.slice(0, 3).map((item) => (
              <div key={item.name} className="files-type-bar-mini">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: typeColorMap[item.name] || '#6B7280', display: 'inline-block', marginRight: 4 }} />
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{item.name} {item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="files-stat-card">
          <div className="files-stat-icon" style={{ background: '#FFF7ED' }}>
            <BarChartOutlined style={{ color: '#F59E0B', fontSize: 20 }} />
          </div>
          <div className="files-stat-info">
            <div className="files-stat-value">{mockFiles.reduce((s, f) => s + f.downloadCount, 0)}</div>
            <div className="files-stat-label">总下载次数</div>
          </div>
          <div className="files-stat-recent">
            <span style={{ fontSize: 11, color: '#94A3B8' }}>最近上传:</span>
            {recentFiles[0] && (
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {recentFiles[0].name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="files-toolbar">
        <div className="files-toolbar-left">
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="搜索文件名..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 260, borderRadius: 8 }}
            allowClear
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 140 }}
            placeholder="文件分类"
            options={[
              { value: 'all', label: '全部分类' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
            placeholder="文件类型"
            options={[
              { value: 'all', label: '全部类型' },
              ...fileTypes.map((t) => {
                const config = getFileTypeConfig(t);
                return { value: t, label: config.label };
              }),
            ]}
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 120 }}
            options={[
              { value: 'time', label: '按时间排序' },
              { value: 'name', label: '按名称排序' },
              { value: 'size', label: '按大小排序' },
            ]}
          />
        </div>
        <div className="files-toolbar-right">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as string)}
            options={[
              { value: 'list', icon: <UnorderedListOutlined /> },
              { value: 'grid', icon: <AppstoreOutlined /> },
            ]}
          />
        </div>
      </div>

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="files-table-wrapper">
          <Table
            dataSource={filteredFiles}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个文件` }}
            rowClassName="files-table-row"
          />
        </div>
      )}

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="files-grid-view">
          {filteredFiles.length === 0 ? (
            <Empty description="没有找到匹配的文件" style={{ padding: 60 }} />
          ) : (
            filteredFiles.map((file) => {
              const config = getFileTypeConfig(file.type);
              return (
                <div
                  key={file.id}
                  className="files-grid-card"
                  onClick={() => handlePreview(file)}
                >
                  <div className="files-grid-card-icon" style={{ background: `${config.color}10`, color: config.color, fontSize: 36 }}>
                    {config.icon}
                  </div>
                  <div className="files-grid-card-info">
                    <div className="files-grid-card-name">{file.name}</div>
                    <div className="files-grid-card-meta">
                      <span>{getUploaderName(file.uploaderId)}</span>
                      <span style={{ margin: '0 6px', color: '#E2E8F0' }}>|</span>
                      <span>{formatFileSize(file.size)}</span>
                      <span style={{ margin: '0 6px', color: '#E2E8F0' }}>|</span>
                      <span>{formatDate(file.uploadDate)}</span>
                    </div>
                  </div>
                  <div className="files-grid-card-actions">
                    <Tooltip title="下载">
                      <Button type="text" size="small" icon={<DownloadOutlined />} onClick={(e) => { e.stopPropagation(); message.success('文件下载中...'); }} />
                    </Tooltip>
                    <Tooltip title="分享">
                      <Button type="text" size="small" icon={<ShareAltOutlined />} onClick={(e) => { e.stopPropagation(); handleShare(file); }} />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDelete(file); }} />
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 上传文件弹窗 */}
      <Modal
        title="上传文件"
        open={uploadModalOpen}
        onCancel={() => { if (!uploading) setUploadModalOpen(false); }}
        footer={null}
        width={560}
        destroyOnClose
        closable={!uploading}
      >
        <div style={{ padding: '8px 0' }}>
          <Dragger
            {...uploadProps}
            style={{ padding: '40px 20px' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#4F46E5', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 500, color: '#1E293B' }}>
              拖拽文件到此处，或 <span style={{ color: '#4F46E5' }}>点击上传</span>
            </p>
            <p className="ant-upload-hint" style={{ color: '#94A3B8' }}>
              支持批量上传，单文件最大 100MB
            </p>
          </Dragger>

          {uploading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#1E293B', fontWeight: 500 }}>上传进度</span>
                <span style={{ color: '#4F46E5', fontWeight: 500 }}>{Math.min(Math.round(uploadProgress), 100)}%</span>
              </div>
              <Progress
                percent={Math.min(Math.round(uploadProgress), 100)}
                strokeColor="#4F46E5"
                trailColor="#EEF2FF"
                size="default"
              />
            </div>
          )}

          {!uploading && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#64748B' }}>文件分类</span>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择文件分类"
                  options={categories.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <span style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#64748B' }}>标签</span>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder="输入标签后按回车添加"
                  tokenSeparators={[',']}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 文件详情侧边抽屉 */}
      <Drawer
        title="文件详情"
        placement="right"
        width={480}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={
          selectedFile && (
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => message.success('文件下载中...')}>下载</Button>
              <Button icon={<ShareAltOutlined />} onClick={() => handleShare(selectedFile)}>分享</Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => { handleDelete(selectedFile); setDetailDrawerOpen(false); }}>删除</Button>
            </Space>
          )
        }
      >
        {selectedFile && (() => {
          const config = getFileTypeConfig(selectedFile.type);
          return (
            <div className="file-detail-content">
              {/* 文件预览区域 */}
              <div className="file-detail-preview" style={{ background: `${config.color}08`, borderColor: `${config.color}20` }}>
                <div style={{ color: config.color, fontSize: 64 }}>
                  {config.icon}
                </div>
                <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: '#1E293B', textAlign: 'center' }}>
                  {selectedFile.name}
                </div>
                <Tag style={{ marginTop: 8, borderRadius: 4, background: `${config.color}15`, border: `1px solid ${config.color}30`, color: config.color }}>
                  {config.label}
                </Tag>
              </div>

              {/* 文件信息 */}
              <div className="file-detail-info">
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>文件信息</h4>
                <div className="file-detail-info-list">
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">文件名称</span>
                    <span className="file-detail-info-value">{selectedFile.name}</span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">文件大小</span>
                    <span className="file-detail-info-value">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">文件类型</span>
                    <span className="file-detail-info-value">
                      <Tag color={config.color} style={{ borderRadius: 4 }}>{config.label}</Tag>
                    </span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">上传者</span>
                    <span className="file-detail-info-value">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={22} style={{ background: getUploaderAvatar(selectedFile.uploaderId), fontSize: 10 }}>
                          {getUploaderName(selectedFile.uploaderId).charAt(0)}
                        </Avatar>
                        {getUploaderName(selectedFile.uploaderId)}
                      </div>
                    </span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">上传时间</span>
                    <span className="file-detail-info-value">{formatDate(selectedFile.uploadDate)}</span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">下载次数</span>
                    <span className="file-detail-info-value">{selectedFile.downloadCount} 次</span>
                  </div>
                  <div className="file-detail-info-row">
                    <span className="file-detail-info-label">文件描述</span>
                    <span className="file-detail-info-value">{selectedFile.description}</span>
                  </div>
                </div>
              </div>

              {/* 版本历史 */}
              <div className="file-detail-versions">
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>版本历史</h4>
                <List
                  size="small"
                  dataSource={mockVersionHistory}
                  renderItem={(item) => (
                    <List.Item className="version-history-item">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>{item.version}</Tag>
                          <span style={{ marginLeft: 8, fontSize: 13, color: '#64748B' }}>{item.uploader}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>
                          {item.time} <span style={{ marginLeft: 8 }}>{item.size}</span>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default Files;
