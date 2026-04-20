import React, { useState, useMemo, useRef } from 'react';
import { Input, Tag, Empty, Modal, Button, Tooltip, message } from 'antd';
import {
  SearchOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  FireOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { mockNews } from '../../mock';
import { formatDate, getCategoryLabel, getCategoryColor } from '../../utils';
import type { NewsCategory, NewsItem } from '../../types';

const categories: { key: NewsCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'technology', label: '技术前沿' },
  { key: 'ai', label: 'AI动态' },
  { key: 'agent', label: 'Agent' },
  { key: 'github', label: 'GitHub' },
  { key: 'policy', label: '政策法规' },
  { key: 'changsha', label: '长沙资讯' },
  { key: 'tools', label: '编程工具' },
  { key: 'architecture', label: '架构设计' },
  { key: 'prompt', label: '提示词工程' },
  { key: 'education', label: '教育资源' },
];

const News: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<NewsCategory | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [likedNews, setLikedNews] = useState<Set<string>>(new Set());
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const filteredNews = useMemo(() => {
    return mockNews.filter((news) => {
      if (activeCategory !== 'all' && news.category !== activeCategory) return false;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        if (!news.title.toLowerCase().includes(kw) && !news.summary.toLowerCase().includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [activeCategory, searchKeyword]);

  const hotNews = useMemo(() => {
    return [...mockNews].sort((a, b) => (b.heat || 0) - (a.heat || 0)).slice(0, 5);
  }, []);

  const categoryCount = useMemo(() => {
    const count: Record<string, number> = { all: mockNews.length };
    mockNews.forEach((n) => {
      count[n.category] = (count[n.category] || 0) + 1;
    });
    return count;
  }, []);

  const relatedNews = useMemo(() => {
    if (!selectedNews) return [];
    return mockNews
      .filter((n) => n.category === selectedNews.category && n.id !== selectedNews.id)
      .slice(0, 3);
  }, [selectedNews]);

  const toggleLike = (newsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedNews((prev) => {
      const next = new Set(prev);
      if (next.has(newsId)) {
        next.delete(newsId);
      } else {
        next.add(newsId);
      }
      return next;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      message.success('资讯已刷新');
    }, 800);
  };

  const openDetail = (news: NewsItem) => {
    setSelectedNews(news);
    setModalOpen(true);
  };

  const handleShare = (_news: NewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    message.success('链接已复制到剪贴板');
  };

  return (
    <div className="news-page">
      {/* 顶部区域 */}
      <div className="news-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>
          资讯推荐
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder="搜索资讯标题/内容..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
          <Tooltip title="刷新资讯">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </div>
      </div>

      {/* 分类标签栏 */}
      <div className="news-categories-wrapper" ref={categoryScrollRef}>
        <div className="news-categories">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            const color = cat.key !== 'all' ? getCategoryColor(cat.key) : '#4F46E5';
            return (
              <div
                key={cat.key}
                className={`news-category-tag ${isActive ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
                style={isActive ? { background: color, borderColor: color, color: '#fff' } : undefined}
              >
                <span>{cat.label}</span>
                <span className="news-category-count">{categoryCount[cat.key] || 0}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 主内容区域：左侧卡片 + 右侧热榜 */}
      <div className="news-content-layout">
        {/* 资讯卡片网格 */}
        <div className="news-main">
          {filteredNews.length === 0 ? (
            <Empty description="暂无相关资讯" style={{ padding: 80 }} />
          ) : (
            <div className="news-grid">
              {filteredNews.map((news) => {
                const catColor = getCategoryColor(news.category);
                const isLiked = likedNews.has(news.id);
                return (
                  <div className="news-card" key={news.id} onClick={() => openDetail(news)}>
                    {news.imageUrl && (
                      <div className="news-card-image">
                        <img
                          src={news.imageUrl}
                          alt={news.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span
                          className="news-card-category-badge"
                          style={{ background: catColor }}
                        >
                          {getCategoryLabel(news.category)}
                        </span>
                      </div>
                    )}
                    <div className="news-card-body">
                      <div className="news-title">{news.title}</div>
                      <div className="news-summary">{news.summary}</div>
                      <div className="news-meta">
                        <span className="news-source">{news.source}</span>
                        <span className="news-time">{formatDate(news.publishDate)}</span>
                      </div>
                      <div className="news-card-actions">
                        <span
                          className={`news-action-btn ${isLiked ? 'liked' : ''}`}
                          onClick={(e) => toggleLike(news.id, e)}
                        >
                          {isLiked ? <HeartFilled /> : <HeartOutlined />}
                          <span>收藏</span>
                        </span>
                        <span
                          className="news-action-btn"
                          onClick={(e) => handleShare(news, e)}
                        >
                          <ShareAltOutlined />
                          <span>分享</span>
                        </span>
                        <span className="news-action-btn news-read-more">
                          <EyeOutlined />
                          <span>阅读更多</span>
                          <RightOutlined style={{ fontSize: 10 }} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 热门资讯侧边栏 */}
        <div className="news-sidebar">
          <div className="news-hot-panel">
            <div className="news-hot-title">
              <FireOutlined style={{ color: '#EF4444', marginRight: 8 }} />
              今日热榜
            </div>
            <div className="news-hot-list">
              {hotNews.map((news, index) => (
                <div
                  key={news.id}
                  className="news-hot-item"
                  onClick={() => openDetail(news)}
                >
                  <span className={`news-hot-rank ${index < 3 ? 'top' : ''}`}>
                    {index + 1}
                  </span>
                  <div className="news-hot-info">
                    <div className="news-hot-title-text">{news.title}</div>
                    <div className="news-hot-heat">
                      <FireOutlined style={{ color: '#F59E0B', fontSize: 12 }} />
                      <span>{((news.heat || 0) / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 资讯详情弹窗 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
        centered
        title={null}
        className="news-detail-modal"
      >
        {selectedNews && (
          <div className="news-detail">
            <div className="news-detail-header">
              <span
                className="news-detail-category"
                style={{ background: getCategoryColor(selectedNews.category) }}
              >
                {getCategoryLabel(selectedNews.category)}
              </span>
              <h2 className="news-detail-title">{selectedNews.title}</h2>
              <div className="news-detail-meta">
                <span>{selectedNews.source}</span>
                <span>{selectedNews.author}</span>
                <span>{formatDate(selectedNews.publishDate)}</span>
                <span>
                  <EyeOutlined style={{ marginRight: 4 }} />
                  {selectedNews.readCount}
                </span>
              </div>
            </div>
            {selectedNews.imageUrl && (
              <div className="news-detail-cover">
                <img src={selectedNews.imageUrl} alt={selectedNews.title} />
              </div>
            )}
            <div className="news-detail-content">{selectedNews.content}</div>
            <div className="news-detail-tags">
              {selectedNews.tags.map((tag) => (
                <Tag key={tag} color="default" style={{ borderRadius: 12 }}>
                  {tag}
                </Tag>
              ))}
            </div>

            {/* 相关推荐 */}
            {relatedNews.length > 0 && (
              <div className="news-detail-related">
                <h4>相关推荐</h4>
                <div className="news-related-list">
                  {relatedNews.map((item) => (
                    <div
                      key={item.id}
                      className="news-related-item"
                      onClick={() => {
                        setSelectedNews(item);
                      }}
                    >
                      <span
                        className="news-related-dot"
                        style={{ background: getCategoryColor(item.category) }}
                      />
                      <span className="news-related-title">{item.title}</span>
                      <span className="news-related-time">
                        {formatDate(item.publishDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default News;
