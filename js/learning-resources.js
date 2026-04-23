/* ============================================
   learning-resources.js — 学习资源模块
   长沙理工大学学科竞赛数智化平台 V1 前端
   ============================================ */

/* --- 常量 --- */
var RESOURCE_CATEGORIES = ['全部', '入门指南', '备赛攻略', '获奖案例', '技能提升', '外部链接'];
var RESOURCE_TYPES = {
  video: { label: '视频', color: 'rgba(239,68,68,0.12)', textColor: '#ef4444', icon: 'play' },
  article: { label: '文章', color: 'rgba(59,130,246,0.12)', textColor: '#3b82f6', icon: 'file-text' },
  case_study: { label: '案例', color: 'rgba(16,185,129,0.12)', textColor: '#10b981', icon: 'trophy' },
  guide: { label: '指南', color: 'rgba(139,92,246,0.12)', textColor: '#8b5cf6', icon: 'graduation-cap' },
  external_link: { label: '外链', color: 'rgba(245,158,11,0.12)', textColor: '#f59e0b', icon: 'link' }
};

/* --- 当前筛选状态 --- */
var _lrCurrentCategory = '全部';
var _lrAllResources = [];

/* ============================================
   1. renderLearningResources() — 主渲染函数
   ============================================ */
async function renderLearningResources() {
  var container = document.getElementById('learningResourcesContent');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">' +
    '<div class="loading-spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>' +
    '加载学习资源...</div>';

  try {
    var res = await fetchWithTimeout(
      HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?is_active=eq.true&order=sort_order.desc,created_at.desc&select=*',
      { headers: HUB_GET_HEADERS }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    _lrAllResources = await res.json();
  } catch (e) {
    console.warn('学习资源加载失败:', e.message);
    _lrAllResources = [];
  }

  // If no data from server, use local CSUST resources
  if(!_lrAllResources || _lrAllResources.length === 0) {
    if(typeof CSUST_LEARNING_RESOURCES !== 'undefined' && CSUST_LEARNING_RESOURCES.length > 0) {
      _lrAllResources = CSUST_LEARNING_RESOURCES;
    }
  }

  // 空状态
  if (!_lrAllResources || _lrAllResources.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">' +
      '<div style="margin-bottom:12px">' + svgIcon('book-open', 48) + '</div>' +
      '<p style="font-size:15px;margin-bottom:4px">暂无学习资源</p>' +
      '<p style="font-size:13px">管理员正在整理中，敬请期待</p></div>';
    return;
  }

  // 重置筛选
  _lrCurrentCategory = '全部';

  var html = '<div style="max-width:800px;margin:0 auto">';

  // --- 推荐资源轮播 ---
  var recommended = _lrAllResources.filter(function(r) { return r.is_recommended; });
  if (recommended.length > 0) {
    html += '<div style="margin-bottom:20px">';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:10px;color:var(--text-primary)">' +
      '<span style="color:var(--accent)">&#9733;</span> 推荐资源</div>';
    html += '<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch" class="lr-carousel">';
    recommended.forEach(function(r) {
      html += _buildRecommendedCard(r);
    });
    html += '</div></div>';
  }

  // --- 分类筛选标签 ---
  html += '<div class="club-filter-bar" id="lrCategoryFilter" style="margin-bottom:16px">';
  RESOURCE_CATEGORIES.forEach(function(cat, i) {
    html += '<button class="club-filter-btn' + (i === 0 ? ' active' : '') + '" onclick="filterLearningResources(\'' + cat + '\')">' + esc(cat) + '</button>';
  });
  html += '</div>';

  // --- 资源卡片网格 ---
  html += '<div id="lrResourceGrid" class="lr-resource-grid">';
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;

  // 渲染卡片
  _renderResourceCards();
}

/* --- 推荐资源横向卡片 --- */
function _buildRecommendedCard(r) {
  var typeInfo = RESOURCE_TYPES[r.resource_type] || RESOURCE_TYPES.article;
  var coverHtml = r.cover_image
    ? '<img src="' + esc(r.cover_image) + '" alt="' + esc(r.title) + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px" loading="lazy" onerror="this.style.display=\'none\'"/>'
    : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + typeInfo.color + ';border-radius:10px">' + svgIcon(typeInfo.icon, 28) + '</div>';

  return '<div style="flex:0 0 200px;scroll-snap-align:start;cursor:pointer" onclick="showResourceDetail(\'' + r.id + '\')">' +
    '<div class="card" style="padding:0;overflow:hidden;border-radius:12px">' +
    '<div style="width:200px;height:120px;overflow:hidden;position:relative">' +
    coverHtml +
    '<span style="position:absolute;top:8px;left:8px;font-size:11px;padding:3px 8px;border-radius:999px;background:' + typeInfo.color + ';color:' + typeInfo.textColor + ';font-weight:500">' + typeInfo.label + '</span>' +
    '</div>' +
    '<div style="padding:10px 12px">' +
    '<div style="font-size:13px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</div>' +
    '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.description || '') + '</div>' +
    '</div></div></div>';
}

/* --- 分类筛选 --- */
function filterLearningResources(category) {
  _lrCurrentCategory = category;
  var buttons = document.querySelectorAll('#lrCategoryFilter .club-filter-btn');
  buttons.forEach(function(b) { b.classList.toggle('active', b.textContent === category); });
  _renderResourceCards();
}

/* --- 渲染资源卡片网格 --- */
function _renderResourceCards() {
  var grid = document.getElementById('lrResourceGrid');
  if (!grid) return;

  var filtered = _lrCurrentCategory === '全部'
    ? _lrAllResources
    : _lrAllResources.filter(function(r) { return r.category === _lrCurrentCategory; });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);grid-column:1/-1">' +
      '<p>该分类下暂无资源</p></div>';
    return;
  }

  var html = '';
  filtered.forEach(function(r) {
    html += _buildResourceCard(r);
  });
  grid.innerHTML = html;
}

/* --- 资源卡片 --- */
function _buildResourceCard(r) {
  var typeInfo = RESOURCE_TYPES[r.resource_type] || RESOURCE_TYPES.article;

  // 封面图或占位图标
  var coverHtml;
  if (r.cover_image) {
    coverHtml = '<div style="width:100%;height:140px;overflow:hidden;border-radius:12px 12px 0 0">' +
      '<img src="' + esc(r.cover_image) + '" alt="' + esc(r.title) + '" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
      '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;background:' + typeInfo.color + ';border-radius:12px 12px 0 0">' + svgIcon(typeInfo.icon, 32) + '</div>' +
      '</div>';
  } else {
    coverHtml = '<div style="width:100%;height:100px;display:flex;align-items:center;justify-content:center;background:' + typeInfo.color + ';border-radius:12px 12px 0 0">' +
      svgIcon(typeInfo.icon, 36) + '</div>';
  }

  // 描述截断为2行
  var desc = r.description || '';
  var shortDesc = desc.length > 80 ? desc.substring(0, 80) + '...' : desc;

  // 浏览量
  var viewCount = r.view_count || 0;
  var viewText = viewCount >= 10000 ? (viewCount / 10000).toFixed(1) + '万' : String(viewCount);

  return '<div class="card lr-resource-card" style="padding:0;overflow:hidden;cursor:pointer;border-radius:12px" onclick="showResourceDetail(\'' + r.id + '\')">' +
    coverHtml +
    '<div style="padding:12px 14px 14px">' +
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap">' +
    '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:' + typeInfo.color + ';color:' + typeInfo.textColor + ';font-weight:500">' + typeInfo.label + '</span>' +
    (r.category ? '<span class="tag-pill" style="font-size:11px">' + esc(r.category) + '</span>' : '') +
    '</div>' +
    '<div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(r.title) + '</div>' +
    (shortDesc ? '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px">' + esc(shortDesc) + '</div>' : '') +
    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-muted)">' +
    (r.author ? '<span>' + svgIcon('users', 12) + ' ' + esc(r.author) + '</span>' : '<span></span>') +
    '<span>' + svgIcon('eye', 12) + ' ' + viewText + '</span>' +
    '</div>' +
    '</div></div>';
}

/* ============================================
   2. showResourceDetail(resourceId) — 资源详情弹窗
   ============================================ */
async function showResourceDetail(resourceId) {
  // 显示加载中
  var loadingHtml = '<div style="text-align:center;padding:40px;color:var(--text-muted)">' +
    '<div class="loading-spinner" style="width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px"></div>加载中...</div>';
  showCompModal(loadingHtml);

  try {
    var res = await fetchWithTimeout(
      HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?id=eq.' + resourceId + '&select=*',
      { headers: HUB_GET_HEADERS }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var resource = data[0];
    if (!resource) {
      showCopyToast('资源不存在', 'error');
      return;
    }

    // 增加浏览量（异步，不阻塞）
    fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?id=eq.' + resourceId, {
      method: 'PATCH',
      headers: HUB_HEADERS,
      body: JSON.stringify({ view_count: (resource.view_count || 0) + 1 })
    }).catch(function() {});

    // 获取相关资源（同分类，排除当前，限制3条）
    var relatedRes = await fetchWithTimeout(
      HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?category=eq.' + encodeURIComponent(resource.category || '') + '&is_active=eq.true&id=neq.' + resourceId + '&order=sort_order.desc,created_at.desc&select=id,title,resource_type,category,cover_image&limit=3',
      { headers: HUB_GET_HEADERS }
    );
    var related = relatedRes.ok ? await relatedRes.json() : [];

    _renderResourceDetailModal(resource, related);
  } catch (e) {
    // Fallback: look up from local CSUST_LEARNING_RESOURCES
    if(typeof CSUST_LEARNING_RESOURCES !== 'undefined' && CSUST_LEARNING_RESOURCES.length > 0) {
      var localResource = CSUST_LEARNING_RESOURCES.find(function(r) { return r.id === resourceId; });
      if(localResource) {
        // Find related from local data
        var localRelated = CSUST_LEARNING_RESOURCES.filter(function(r) {
          return r.id !== resourceId && r.category === localResource.category && r.is_active;
        }).slice(0, 3);
        _renderResourceDetailModal(localResource, localRelated);
        return;
      }
    }
    showCopyToast('加载失败，请重试', 'error');
  }
}

/* --- 渲染资源详情弹窗内容 --- */
function _renderResourceDetailModal(resource, related) {
  var typeInfo = RESOURCE_TYPES[resource.resource_type] || RESOURCE_TYPES.article;

  var html = '<div style="max-width:560px;margin:0 auto">';

  // 标题区
  html += '<div style="margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">' +
    '<span style="font-size:12px;padding:3px 10px;border-radius:999px;background:' + typeInfo.color + ';color:' + typeInfo.textColor + ';font-weight:500">' + typeInfo.label + '</span>' +
    (resource.category ? '<span class="tag-pill">' + esc(resource.category) + '</span>' : '') +
    '</div>';
  html += '<h3 style="font-size:18px;font-weight:700;color:var(--text-primary);line-height:1.4;margin:0">' + esc(resource.title) + '</h3>';
  html += '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;display:flex;gap:12px;flex-wrap:wrap">' +
    (resource.author ? '<span>' + svgIcon('users', 13) + ' ' + esc(resource.author) + '</span>' : '') +
    '<span>' + svgIcon('eye', 13) + ' ' + (resource.view_count || 0) + ' 次浏览</span>' +
    '<span>' + svgIcon('calendar', 13) + ' ' + _formatDate(resource.created_at) + '</span>' +
    '</div>';
  html += '</div>';

  // 分割线
  html += '<div style="height:1px;background:var(--border-subtle);margin:16px 0"></div>';

  // 描述
  if (resource.description) {
    html += '<div style="margin-bottom:16px">';
    html += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:6px">简介</div>';
    html += '<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + esc(resource.description) + '</div>';
    html += '</div>';
  }

  // 根据类型展示内容
  if (resource.resource_type === 'video') {
    html += _renderVideoContent(resource);
  } else if (resource.resource_type === 'external_link') {
    html += _renderExternalLinkContent(resource);
  } else {
    html += _renderTextContent(resource);
  }

  // 标签
  if (resource.tags && resource.tags.length > 0) {
    var tags = typeof resource.tags === 'string' ? resource.tags.split(',') : resource.tags;
    if (Array.isArray(tags) && tags.length > 0) {
      html += '<div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:6px">';
      tags.forEach(function(tag) {
        if (tag && tag.trim()) {
          html += '<span class="tag-pill" style="font-size:11px">' + esc(tag.trim()) + '</span>';
        }
      });
      html += '</div>';
    }
  }

  // 相关资源
  if (related && related.length > 0) {
    html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border-subtle)">';
    html += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px">相关推荐</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    related.forEach(function(r) {
      var rType = RESOURCE_TYPES[r.resource_type] || RESOURCE_TYPES.article;
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;background:var(--bg-secondary);cursor:pointer" onclick="showResourceDetail(\'' + r.id + '\')">';
      if (r.cover_image) {
        html += '<img src="' + esc(r.cover_image) + '" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0" loading="lazy" onerror="this.style.display=\'none\'"/>';
      } else {
        html += '<div style="width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:' + rType.color + ';flex-shrink:0">' + svgIcon(rType.icon, 20) + '</div>';
      }
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + rType.label + (r.category ? ' · ' + esc(r.category) : '') + '</div>';
      html += '</div>';
      html += '<span style="color:var(--text-muted);font-size:14px">&rsaquo;</span>';
      html += '</div>';
    });
    html += '</div></div>';
  }

  html += '</div>';

  // 关闭旧弹窗并打开新弹窗
  var existingOverlay = document.querySelector('[style*="z-index:1000"]');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
    document.body.style.overflow = '';
  }
  showCompModal(html);
}

/* --- 视频类型内容 --- */
function _renderVideoContent(resource) {
  var html = '<div style="margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px">视频内容</div>';

  var videoUrl = resource.content_url || '';
  // 判断是否为可嵌入的视频链接
  var embedUrl = '';
  if (videoUrl.indexOf('bilibili.com') >= 0) {
    // B站视频嵌入
    var bvMatch = videoUrl.match(/BV[a-zA-Z0-9]+/);
    if (bvMatch) {
      embedUrl = 'https://player.bilibili.com/player.html?bvid=' + bvMatch[0] + '&autoplay=0';
    }
  } else if (videoUrl.indexOf('youtube.com') >= 0 || videoUrl.indexOf('youtu.be') >= 0) {
    var ytMatch = videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) {
      embedUrl = 'https://www.youtube.com/embed/' + ytMatch[1];
    }
  }

  if (embedUrl) {
    html += '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#000">';
    html += '<iframe src="' + esc(embedUrl) + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px" allowfullscreen loading="lazy"></iframe>';
    html += '</div>';
  }

  if (videoUrl) {
    html += '<a href="' + esc(videoUrl) + '" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;text-decoration:none">';
    html += svgIcon('link', 14) + ' 前往观看</a>';
  }

  // 正文内容（如果有）
  if (resource.content_text) {
    html += '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + esc(resource.content_text) + '</div>';
  }

  html += '</div>';
  return html;
}

/* --- 外部链接类型内容 --- */
function _renderExternalLinkContent(resource) {
  var html = '<div style="margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px">外部资源</div>';

  if (resource.content_url) {
    html += '<a href="' + esc(resource.content_url) + '" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;padding:12px 24px;font-size:14px">';
    html += svgIcon('link', 16) + ' 前往查看</a>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:8px">将在新标签页中打开</div>';
  }

  if (resource.content_text) {
    html += '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + esc(resource.content_text) + '</div>';
  }

  html += '</div>';
  return html;
}

/* --- 文章/指南/案例类型内容 --- */
function _renderTextContent(resource) {
  var html = '<div style="margin-bottom:16px">';
  html += '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px">正文内容</div>';

  if (resource.content_text) {
    html += '<div style="font-size:14px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;word-break:break-word">' + esc(resource.content_text) + '</div>';
  } else if (resource.content_url) {
    html += '<a href="' + esc(resource.content_url) + '" target="_blank" rel="noopener noreferrer" class="btn-primary" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none">';
    html += svgIcon('link', 14) + ' 查看原文</a>';
  } else {
    html += '<div style="font-size:13px;color:var(--text-muted)">暂无内容</div>';
  }

  html += '</div>';
  return html;
}

/* --- 日期格式化 --- */
function _formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* ============================================
   3. renderCompetitionResources(competitionId) — 竞赛关联资源
   ============================================ */
async function renderCompetitionResources(competitionId) {
  var container = document.getElementById('compResourcesList');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:13px">加载中...</div>';

  try {
    var res = await fetchWithTimeout(
      HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?competition_id=eq.' + competitionId + '&is_active=eq.true&order=sort_order.desc,created_at.desc&select=id,title,resource_type,category,description,author&view_count',
      { headers: HUB_GET_HEADERS }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var resources = await res.json();

    if (!resources || resources.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">暂无相关学习资源</div>';
      return;
    }

    var html = '<div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:8px">学习资源 (' + resources.length + ')</div>';

    resources.forEach(function(r) {
      var typeInfo = RESOURCE_TYPES[r.resource_type] || RESOURCE_TYPES.article;
      var shortDesc = (r.description || '').length > 50 ? r.description.substring(0, 50) + '...' : (r.description || '');

      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:10px;border:1px solid var(--border-subtle);margin-bottom:6px;cursor:pointer;background:var(--bg-card)" onclick="showResourceDetail(\'' + r.id + '\')">';
      html += '<div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:' + typeInfo.color + ';flex-shrink:0">' + svgIcon(typeInfo.icon, 16) + '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="font-size:13px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + typeInfo.label + (shortDesc ? ' · ' + esc(shortDesc) : '') + '</div>';
      html += '</div>';
      html += '<span style="color:var(--text-muted);font-size:14px">&rsaquo;</span>';
      html += '</div>';
    });

    // 查看更多链接
    html += '<div style="text-align:center;margin-top:8px">';
    html += '<button class="btn-secondary" style="font-size:12px;padding:6px 16px" onclick="navigate(\'learning-resources\')">查看更多学习资源</button>';
    html += '</div>';

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">加载失败</div>';
  }
}

/* ============================================
   4. renderAdminLearningResources() — 管理后台
   ============================================ */
async function renderAdminLearningResources() {
  var container = document.getElementById('adminLRContent');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">加载中...</div>';

  try {
    var res = await fetchWithTimeout(
      HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?order=sort_order.desc,created_at.desc&select=*',
      { headers: HUB_GET_HEADERS }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var resources = await res.json();
    _renderAdminResourceList(resources);
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#e74c3c">加载失败</div>';
  }
}

/* --- 管理列表渲染 --- */
function _renderAdminResourceList(resources) {
  var container = document.getElementById('adminLRContent');
  if (!container) return;

  var html = '<div style="max-width:900px;margin:0 auto">';

  // 头部操作栏
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">';
  html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary)">学习资源管理 <span style="color:var(--text-muted);font-weight:400">(' + resources.length + ')</span></div>';
  html += '<button class="btn-primary" style="font-size:13px;padding:8px 16px" onclick="showAdminResourceForm()">+ 添加资源</button>';
  html += '</div>';

  if (resources.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:var(--text-muted)">暂无资源，点击上方按钮添加</div>';
    html += '</div>';
    container.innerHTML = html;
    return;
  }

  // 资源列表
  resources.forEach(function(r) {
    var typeInfo = RESOURCE_TYPES[r.resource_type] || RESOURCE_TYPES.article;
    html += '<div class="card" style="padding:14px;margin-bottom:8px;border:1px solid var(--border-subtle)">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:' + typeInfo.color + ';color:' + typeInfo.textColor + ';font-weight:500">' + typeInfo.label + '</span>';
    if (r.category) html += '<span class="tag-pill" style="font-size:11px">' + esc(r.category) + '</span>';
    if (r.is_recommended) html += '<span style="font-size:11px;color:var(--accent)">&#9733; 推荐</span>';
    if (!r.is_active) html += '<span style="font-size:11px;color:#e74c3c">已停用</span>';
    html += '</div>';
    html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' +
      (r.author ? esc(r.author) + ' · ' : '') +
      '浏览 ' + (r.view_count || 0) +
      ' · 排序 ' + (r.sort_order || 0) +
      '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0">';
    html += '<button class="btn-secondary" style="font-size:12px;padding:6px 12px" onclick="showAdminResourceForm(\'' + r.id + '\')">编辑</button>';
    html += '<button style="font-size:12px;padding:6px 12px;border-radius:8px;border:1px solid rgba(231,76,60,0.3);background:rgba(231,76,60,0.08);color:#e74c3c;cursor:pointer" onclick="deleteAdminResource(\'' + r.id + '\',\'' + esc(r.title).replace(/'/g, "\\'") + '\')">删除</button>';
    html += '</div>';
    html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

/* --- 添加/编辑资源表单弹窗 --- */
async function showAdminResourceForm(resourceId) {
  var isEdit = !!resourceId;
  var resource = null;

  if (isEdit) {
    try {
      var res = await fetchWithTimeout(
        HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?id=eq.' + resourceId + '&select=*',
        { headers: HUB_GET_HEADERS }
      );
      if (res.ok) {
        var data = await res.json();
        resource = data[0] || null;
      }
    } catch (e) { /* ignore */ }
  }

  var r = resource || {};

  var html = '<div style="max-width:560px;margin:0 auto">';
  html += '<h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:16px">' + (isEdit ? '编辑资源' : '添加资源') + '</h3>';

  // 标题
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">标题 *</label>';
  html += '<input type="text" class="form-input" id="lrFormTitle" placeholder="输入资源标题" value="' + esc(r.title || '') + '"/>';
  html += '</div>';

  // 类型 + 分类（一行两列）
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  html += '<div>';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">类型 *</label>';
  html += '<select class="form-input" id="lrFormType">';
  html += '<option value="article"' + ((r.resource_type || '') === 'article' ? ' selected' : '') + '>文章</option>';
  html += '<option value="video"' + ((r.resource_type || '') === 'video' ? ' selected' : '') + '>视频</option>';
  html += '<option value="case_study"' + ((r.resource_type || '') === 'case_study' ? ' selected' : '') + '>案例</option>';
  html += '<option value="guide"' + ((r.resource_type || '') === 'guide' ? ' selected' : '') + '>指南</option>';
  html += '<option value="external_link"' + ((r.resource_type || '') === 'external_link' ? ' selected' : '') + '>外部链接</option>';
  html += '</select></div>';
  html += '<div>';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">分类 *</label>';
  html += '<select class="form-input" id="lrFormCategory">';
  RESOURCE_CATEGORIES.forEach(function(cat) {
    if (cat === '全部') return;
    html += '<option value="' + esc(cat) + '"' + ((r.category || '') === cat ? ' selected' : '') + '>' + esc(cat) + '</option>';
  });
  html += '</select></div>';
  html += '</div>';

  // 作者
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">作者</label>';
  html += '<input type="text" class="form-input" id="lrFormAuthor" placeholder="作者名称（可选）" value="' + esc(r.author || '') + '"/>';
  html += '</div>';

  // 描述
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">简介</label>';
  html += '<textarea class="form-input" id="lrFormDesc" rows="3" placeholder="资源简介（可选）" style="resize:vertical">' + esc(r.description || '') + '</textarea>';
  html += '</div>';

  // 内容URL
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">内容链接</label>';
  html += '<input type="url" class="form-input" id="lrFormUrl" placeholder="视频链接 / 外部链接（可选）" value="' + esc(r.content_url || '') + '"/>';
  html += '</div>';

  // 正文内容
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">正文内容</label>';
  html += '<textarea class="form-input" id="lrFormContent" rows="6" placeholder="文章/指南/案例正文（可选）" style="resize:vertical">' + esc(r.content_text || '') + '</textarea>';
  html += '</div>';

  // 封面图
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">封面图URL</label>';
  html += '<input type="url" class="form-input" id="lrFormCover" placeholder="封面图片链接（可选）" value="' + esc(r.cover_image || '') + '"/>';
  html += '</div>';

  // 标签
  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">标签</label>';
  html += '<input type="text" class="form-input" id="lrFormTags" placeholder="多个标签用逗号分隔（可选）" value="' + esc(typeof r.tags === 'string' ? r.tags : (Array.isArray(r.tags) ? r.tags.join(',') : '')) + '"/>';
  html += '</div>';

  // 排序 + 推荐 + 启用
  html += '<div style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;margin-bottom:16px">';
  html += '<div>';
  html += '<label style="font-size:12px;font-weight:500;color:var(--text-muted);display:block;margin-bottom:4px">排序值</label>';
  html += '<input type="number" class="form-input" id="lrFormSortOrder" value="' + (r.sort_order || 0) + '" style="width:100px"/>';
  html += '</div>';
  html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:var(--text-primary);white-space:nowrap">';
  html += '<input type="checkbox" id="lrFormRecommended"' + (r.is_recommended ? ' checked' : '') + '/> 推荐';
  html += '</label>';
  html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:var(--text-primary);white-space:nowrap">';
  html += '<input type="checkbox" id="lrFormActive"' + (r.is_active !== false ? ' checked' : '') + '/> 启用';
  html += '</label>';
  html += '</div>';

  // 操作按钮
  html += '<div style="display:flex;gap:10px">';
  html += '<button class="btn-primary" style="flex:1" onclick="saveAdminResource(\'' + (resourceId || '') + '\')">' + (isEdit ? '保存修改' : '添加资源') + '</button>';
  html += '<button class="btn-secondary" style="flex:1" onclick="renderAdminLearningResources()">取消</button>';
  html += '</div>';

  html += '</div>';

  // 关闭旧弹窗
  var existingOverlay = document.querySelector('[style*="z-index:1000"]');
  if (existingOverlay) {
    document.body.removeChild(existingOverlay);
    document.body.style.overflow = '';
  }
  showCompModal(html);
}

/* --- 保存资源（新增/编辑） --- */
async function saveAdminResource(resourceId) {
  var title = (document.getElementById('lrFormTitle') || {}).value || '';
  var resourceType = (document.getElementById('lrFormType') || {}).value || 'article';
  var category = (document.getElementById('lrFormCategory') || {}).value || '';
  var author = (document.getElementById('lrFormAuthor') || {}).value || '';
  var description = (document.getElementById('lrFormDesc') || {}).value || '';
  var contentUrl = (document.getElementById('lrFormUrl') || {}).value || '';
  var contentText = (document.getElementById('lrFormContent') || {}).value || '';
  var coverImage = (document.getElementById('lrFormCover') || {}).value || '';
  var tagsStr = (document.getElementById('lrFormTags') || {}).value || '';
  var sortOrder = parseInt((document.getElementById('lrFormSortOrder') || {}).value) || 0;
  var isRecommended = (document.getElementById('lrFormRecommended') || {}).checked || false;
  var isActive = (document.getElementById('lrFormActive') || {}).checked !== false;

  // 校验
  if (!title.trim()) {
    showCopyToast('请输入资源标题', 'error');
    return;
  }
  if (!category) {
    showCopyToast('请选择分类', 'error');
    return;
  }

  var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];

  var payload = {
    title: title.trim(),
    resource_type: resourceType,
    category: category,
    author: author.trim() || null,
    description: description.trim() || null,
    content_url: contentUrl.trim() || null,
    content_text: contentText.trim() || null,
    cover_image: coverImage.trim() || null,
    tags: tags,
    sort_order: sortOrder,
    is_recommended: isRecommended,
    is_active: isActive
  };

  var isEdit = !!resourceId;
  var url, method;

  if (isEdit) {
    url = HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?id=eq.' + resourceId;
    method = 'PATCH';
  } else {
    url = HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources';
    method = 'POST';
  }

  try {
    var res = await fetchWithTimeout(url, {
      method: method,
      headers: HUB_HEADERS,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showCopyToast(isEdit ? '资源已更新' : '资源已添加', 'success');
      // 关闭弹窗并刷新列表
      var existingOverlay = document.querySelector('[style*="z-index:1000"]');
      if (existingOverlay) {
        document.body.removeChild(existingOverlay);
        document.body.style.overflow = '';
      }
      renderAdminLearningResources();
    } else {
      var errData = await res.json().catch(function() { return {}; });
      showCopyToast('保存失败：' + (errData.message || '未知错误'), 'error');
    }
  } catch (e) {
    showCopyToast('网络错误，请重试', 'error');
  }
}

/* --- 删除资源 --- */
function deleteAdminResource(resourceId, title) {
  showConfirm('确定要删除资源"' + title + '"吗？此操作不可撤销。', async function() {
    try {
      var res = await fetchWithTimeout(
        HUB_URL + '/functions/v1/competition-api/rest/v1/learning_resources?id=eq.' + resourceId,
        { method: 'DELETE', headers: HUB_HEADERS }
      );
      if (res.ok) {
        showCopyToast('已删除', 'success');
        renderAdminLearningResources();
      } else {
        showCopyToast('删除失败', 'error');
      }
    } catch (e) {
      showCopyToast('网络错误', 'error');
    }
  });
}
