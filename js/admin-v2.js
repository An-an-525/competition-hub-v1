/* Admin Review System v2 */

/* 搜索防抖 */
var _adminSearchTimer = null;
function debouncedAdminSearch() {
  if (_adminSearchTimer) clearTimeout(_adminSearchTimer);
  _adminSearchTimer = setTimeout(function() {
    _adminSearchTimer = null;
    loadAdminApplications();
  }, 300);
}

/* 全局管理员权限范围 */
var adminScope = {
  role: null,           // 'super_admin' | 'competition_admin' | 'college_admin'
  competitionIds: [],   // competition_admin 管理的竞赛 ID 列表
  college: null,        // college_admin 所属学院
  rawRoles: []          // 原始角色数据
};

/**
 * 获取当前管理员权限范围
 * 从 user_roles 表查询角色，并设置 adminScope
 */
async function fetchAdminScope() {
  var user = getCurrentUser();
  if (!user) return;

  try {
    var res = await fetch(
      HUB_URL + '/functions/v1/competition-api/rest/v1/user_roles?user_id=eq.' + user.id + '&is_active=eq.true&select=*,roles(role_name,permissions),competitions(competition_id,name)',
      { headers: HUB_GET_HEADERS }
    );
    if (!res.ok) {
      adminScope.role = null; // 查询失败时不授予任何权限
      return;
    }
    var roles = await res.json();
    adminScope.rawRoles = roles;

    // 确定最高权限角色
    var hasSuper = false, hasComp = false, hasCollege = false;
    var compIds = [];
    var collegeName = null;

    for (var i = 0; i < roles.length; i++) {
      var r = roles[i];
      var roleName = (r.roles && r.roles.role_name) || '';
      if (roleName === 'super_admin') hasSuper = true;
      if (roleName === 'competition_admin') {
        hasComp = true;
        if (r.competitions && r.competitions.competition_id) {
          compIds.push(r.competitions.competition_id);
        }
      }
      if (roleName === 'college_admin') {
        hasCollege = true;
        // college_admin 的学院信息可从 profiles 或 role metadata 获取
        if (r.college) collegeName = r.college;
      }
    }

    if (hasSuper) {
      adminScope.role = 'super_admin';
    } else if (hasComp) {
      adminScope.role = 'competition_admin';
      adminScope.competitionIds = compIds;
    } else if (hasCollege) {
      adminScope.role = 'college_admin';
      adminScope.college = collegeName;
    } else {
      // 有 user_roles 记录但无匹配角色，不授予任何权限
      adminScope.role = null;
    }
  } catch (e) {
    console.error('fetchAdminScope error:', e);
    adminScope.role = null;
  }
}

/**
 * 切换管理员标签页
 */
function switchAdminTab(tabName) {
  // 更新标签激活状态
  var tabs = document.querySelectorAll('.admin-tab-btn');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].style.background = 'var(--bg-card)';
    tabs[i].style.color = 'var(--text-secondary)';
    tabs[i].style.borderBottom = '2px solid transparent';
  }
  var activeTab = document.getElementById('adminTab_' + tabName);
  if (activeTab) {
    activeTab.style.background = 'var(--bg-card)';
    activeTab.style.color = 'var(--accent)';
    activeTab.style.borderBottom = '2px solid var(--accent)';
  }

  // 渲染对应内容
  var contentEl = document.getElementById('adminTabContent');
  if (!contentEl) return;

  switch (tabName) {
    case 'applications':
      renderAdminApplicationsTab();
      break;
    case 'enterprises':
      renderAdminEnterprises();
      break;
    case 'resources':
      renderAdminResources();
      break;
    case 'dashboard':
      renderAdminDashboard();
      break;
    default:
      renderAdminApplicationsTab();
  }
}

/**
 * 渲染报名审核标签页内容（从原 renderAdminV2 的主体逻辑提取）
 */
function renderAdminApplicationsTab() {
  var contentEl = document.getElementById('adminTabContent');
  if (!contentEl) return;

  var html = '';
  // 统计卡片
  html += '<div id="adminStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:24px"></div>';

  // 筛选栏
  html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
  html += '<select id="adminFilterStatus" onchange="loadAdminApplications()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px"><option value="">全部状态</option><option value="submitted">待审核</option><option value="under_review">审核中</option><option value="approved">已通过</option><option value="rejected">已驳回</option><option value="request_changes">需补充</option></select>';
  html += '<select id="adminFilterType" onchange="loadAdminApplications()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px"><option value="">全部类型</option><option value="individual">个人</option><option value="team">团队</option></select>';
  html += '<input type="text" id="adminSearchName" placeholder="搜索竞赛名..." oninput="debouncedAdminSearch()" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px;min-width:150px">';
  html += '</div>';

  // 报名列表
  html += '<div id="adminAppList"></div>';

  contentEl.innerHTML = html;
  loadAdminStats();
  loadAdminApplications();
}

async function renderAdminV2() {
  var container = document.getElementById('adminContent') || document.getElementById('page-admin');
  if (!container) return;
  if (!isAdmin()) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">无权限访问</div>';
    return;
  }

  // 加载中状态
  container.innerHTML = '<div style="max-width:900px;margin:0 auto;padding:20px;text-align:center;color:var(--text-muted)">加载权限信息...</div>';

  // 获取管理员权限范围
  await fetchAdminScope();

  var html = '<div style="max-width:900px;margin:0 auto;padding:20px">';
  html += '<h3 style="margin-bottom:20px">审核管理</h3>';

  // 标签页导航
  html += '<div style="display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid var(--border-subtle);padding-bottom:0">';

  if (adminScope.role === 'super_admin') {
    // super_admin: 全部标签
    html += '<button id="adminTab_applications" class="admin-tab-btn" onclick="switchAdminTab(\'applications\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--accent);border-bottom:2px solid var(--accent);cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">报名审核</button>';
    html += '<button id="adminTab_enterprises" class="admin-tab-btn" onclick="switchAdminTab(\'enterprises\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--text-secondary);border-bottom:2px solid transparent;cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">企业管理</button>';
    html += '<button id="adminTab_resources" class="admin-tab-btn" onclick="switchAdminTab(\'resources\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--text-secondary);border-bottom:2px solid transparent;cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">学习资源</button>';
    html += '<button id="adminTab_dashboard" class="admin-tab-btn" onclick="switchAdminTab(\'dashboard\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--text-secondary);border-bottom:2px solid transparent;cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">全局看板</button>';
  } else if (adminScope.role === 'competition_admin') {
    // competition_admin: 仅显示其管理的竞赛
    html += '<button id="adminTab_applications" class="admin-tab-btn" onclick="switchAdminTab(\'applications\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--accent);border-bottom:2px solid var(--accent);cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">我的赛事审核</button>';
  } else if (adminScope.role === 'college_admin') {
    // college_admin: 仅显示本院
    html += '<button id="adminTab_applications" class="admin-tab-btn" onclick="switchAdminTab(\'applications\')" style="padding:10px 16px;border:none;background:var(--bg-card);color:var(--accent);border-bottom:2px solid var(--accent);cursor:pointer;font-size:13px;font-weight:500;border-radius:8px 8px 0 0">本院报名审核</button>';
  }

  html += '</div>';

  // 标签页内容容器
  html += '<div id="adminTabContent"></div>';
  html += '</div>';

  container.innerHTML = html;

  // 默认显示报名审核标签
  switchAdminTab('applications');
}

async function loadAdminStats() {
  var el = document.getElementById('adminStats');
  if (!el) return;

  var counts = { total: 0, pending: 0, approved: 0, rejected: 0 };
  var statuses = ['submitted', 'under_review', 'approved', 'rejected', 'request_changes'];

  // 并行请求所有状态计数
  var promises = statuses.map(function(status) {
    return fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?status=eq.' + status + '&select=id', { headers: HUB_GET_HEADERS })
      .then(function(res) { return res.ok ? res.json() : []; })
      .then(function(data) { return { status: status, count: data.length }; })
      .catch(function() { return { status: status, count: 0 }; });
  });
  var results = await Promise.all(promises);
  results.forEach(function(r) {
    counts.total += r.count;
    if (r.status === 'submitted' || r.status === 'under_review') counts.pending += r.count;
    if (r.status === 'approved') counts.approved += r.count;
    if (r.status === 'rejected') counts.rejected += r.count;
  });

  el.innerHTML = '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--text-primary)">' + counts.total + '</div><div style="font-size:12px;color:var(--text-muted)">总报名</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#FFC84A">' + counts.pending + '</div><div style="font-size:12px;color:var(--text-muted)">待审核</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#2ecc71">' + counts.approved + '</div><div style="font-size:12px;color:var(--text-muted)">已通过</div></div>' +
    '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#e74c3c">' + counts.rejected + '</div><div style="font-size:12px;color:var(--text-muted)">已驳回</div></div>';
}

async function loadAdminApplications() {
  var el = document.getElementById('adminAppList');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">加载中...</div>';

  var statusFilter = document.getElementById('adminFilterStatus') ? document.getElementById('adminFilterStatus').value : '';
  var typeFilter = document.getElementById('adminFilterType') ? document.getElementById('adminFilterType').value : '';
  var searchName = document.getElementById('adminSearchName') ? document.getElementById('adminSearchName').value.trim() : '';

  var url = HUB_URL + '/functions/v1/competition-api/rest/v1/applications?select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)&order=created_at.desc&limit=50';

  // 根据管理员权限范围过滤
  if (adminScope.role === 'competition_admin' && adminScope.competitionIds.length > 0) {
    var compFilter = adminScope.competitionIds.map(function(id) { return 'competition_id.eq.' + id; }).join(',');
    url = HUB_URL + '/functions/v1/competition-api/rest/v1/applications?select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)&or=(' + compFilter + ')&order=created_at.desc&limit=50';
  } else if (adminScope.role === 'college_admin' && adminScope.college) {
    // college_admin 通过 profiles 的 college 字段过滤
    // 先查询该院学生 ID 列表，再过滤报名
    try {
      var profileRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/profiles?college=eq.' + encodeURIComponent(adminScope.college) + '&select=user_id', { headers: HUB_GET_HEADERS });
      if (profileRes.ok) {
        var profiles = await profileRes.json();
        var userIds = profiles.map(function(p) { return 'applicant_user_id.eq.' + p.user_id; });
        if (userIds.length > 0) {
          var userFilter = userIds.join(',');
          url = HUB_URL + '/functions/v1/competition-api/rest/v1/applications?select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)&or=(' + userFilter + ')&order=created_at.desc&limit=50';
        } else {
          el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">本院暂无报名记录</div>';
          return;
        }
      }
    } catch (e) {
      console.error('college_admin filter error:', e);
    }
  }

  var res = await fetch(url, { headers: HUB_GET_HEADERS });
  if (!res.ok) { el.innerHTML = '<p style="color:#e74c3c">加载失败</p>'; return; }
  var apps = await res.json();

  // 客户端筛选
  if (statusFilter) apps = apps.filter(function(a) { return a.status === statusFilter; });
  if (typeFilter) apps = apps.filter(function(a) { return a.type === typeFilter; });
  if (searchName) apps = apps.filter(function(a) { return (a.competitions || {}).name && a.competitions.name.indexOf(searchName) >= 0; });

  if (apps.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">暂无报名记录</div>';
    return;
  }

  var html = '';
  apps.forEach(function(app) {
    var comp = app.competitions || {};
    var profile = app.profiles || {};
    var statusBg = { draft: 'rgba(255,255,255,0.06)', submitted: 'rgba(255,200,74,0.1)', under_review: 'rgba(6,182,212,0.1)', approved: 'rgba(46,204,113,0.1)', rejected: 'rgba(231,76,60,0.1)', request_changes: 'rgba(251,191,36,0.1)' };
    var statusColor = { draft: 'var(--text-muted)', submitted: '#FFC84A', under_review: '#06b6d4', approved: '#2ecc71', rejected: '#e74c3c', request_changes: '#f59e0b' };
    var statusText = { draft: '草稿', submitted: '待审核', under_review: '审核中', approved: '已通过', rejected: '已驳回', request_changes: '需补充' };

    html += '<div class="card" style="padding:16px;margin-bottom:8px;cursor:pointer" onclick="showAdminAppDetail(\'' + app.id + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-weight:600;font-size:14px">' + esc(comp.name || '未知竞赛') + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(profile.name || '') + ' | ' + esc(profile.student_id || '') + ' | ' + esc(profile.college || '') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + (app.type === 'team' ? '团队' : '个人') + ' · ' + new Date(app.created_at).toLocaleDateString() + '</div>';
    html += '</div>';
    html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + (statusBg[app.status] || '') + ';color:' + (statusColor[app.status] || '') + ';white-space:nowrap">' + (statusText[app.status] || app.status) + '</span>';
    html += '</div></div>';
  });
  el.innerHTML = html;
}

async function showAdminAppDetail(applicationId) {
  // 获取报名
  var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?id=eq.' + applicationId + '&select=*,competitions(name,level,category),profiles!applications_applicant_user_id_fkey(name,student_id,college)', { headers: HUB_GET_HEADERS });
  if (!res.ok) { showCopyToast('加载失败', 'error'); return; }
  var apps = await res.json();
  var app = apps[0];
  if (!app) return;

  // 获取审核记录
  var revRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_reviews?application_id=eq.' + applicationId + '&select=*,profiles!application_reviews_reviewer_user_id_fkey(name)&order=created_at.desc', { headers: HUB_GET_HEADERS });
  if (!revRes.ok) { var reviews = []; } else { var reviews = await revRes.json(); }

  // 获取材料
  var filesRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_files?application_id=eq.' + applicationId + '&status=eq.uploaded&order=uploaded_at.desc', { headers: HUB_GET_HEADERS });
  if (!filesRes.ok) { var files = []; } else { var files = await filesRes.json(); }

  var comp = app.competitions || {};
  var profile = app.profiles || {};

  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="renderAdminV2()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">&larr;</button>';
  html += '<h3 style="flex:1">' + esc(comp.name || '报名详情') + '</h3>';
  html += '</div>';

  // 申请人信息
  html += '<div class="card" style="padding:16px;margin-bottom:12px">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">申请人信息</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">';
  html += '<div><span style="color:var(--text-muted)">姓名：</span>' + esc(profile.name || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">学号：</span>' + esc(profile.student_id || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">学院：</span>' + esc(profile.college || '') + '</div>';
  html += '<div><span style="color:var(--text-muted)">类型：</span>' + (app.type === 'team' ? '团队' : '个人') + '</div>';
  html += '</div></div>';

  // 表单数据
  var data = app.data || {};
  if (Object.keys(data).length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">报名信息</div>';
    Object.keys(data).forEach(function(key) {
      if (data[key]) {
        html += '<div style="font-size:13px;margin-bottom:6px"><span style="color:var(--text-muted)">' + esc(key) + '：</span>' + esc(data[key]) + '</div>';
      }
    });
    html += '</div>';
  }

  // 材料
  if (files.length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">提交材料</div>';
    files.forEach(function(f) {
      html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">' + esc(f.file_name) + ' <span style="color:var(--text-muted)">(' + (f.file_size / 1024).toFixed(1) + 'KB)</span></div>';
    });
    html += '</div>';
  }

  // 审核记录
  if (reviews.length > 0) {
    html += '<div class="card" style="padding:16px;margin-bottom:12px">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--accent)">审核记录</div>';
    reviews.forEach(function(r) {
      var actionText = { approve: '通过', reject: '驳回', request_changes: '要求补充' };
      var actionColor = { approve: '#2ecc71', reject: '#e74c3c', request_changes: '#f59e0b' };
      html += '<div style="font-size:12px;margin-bottom:8px;padding:8px;border-radius:6px;background:var(--bg-secondary)">';
      html += '<div style="display:flex;justify-content:space-between"><span style="color:' + (actionColor[r.action] || '') + ';font-weight:500">' + (actionText[r.action] || r.action) + '</span><span style="color:var(--text-muted)">' + (r.profiles ? esc(r.profiles.name) : '') + ' · ' + new Date(r.created_at).toLocaleString() + '</span></div>';
      if (r.comment) html += '<div style="margin-top:4px;color:var(--text-secondary)">' + esc(r.comment) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // 审核操作
  if (app.status === 'submitted' || app.status === 'under_review' || app.status === 'request_changes') {
    html += '<div style="margin-top:16px">';
    html += '<textarea id="reviewComment" placeholder="审核意见（可选）" rows="2" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-family:inherit;margin-bottom:12px"></textarea>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn-primary" style="flex:1" onclick="reviewApplication(\'' + applicationId + '\',\'approve\')">通过</button>';
    html += '<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(251,191,36,0.3);background:rgba(251,191,36,0.08);color:#f59e0b;cursor:pointer;font-weight:500" onclick="reviewApplication(\'' + applicationId + '\',\'request_changes\')">要求补充</button>';
    html += '<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(231,76,60,0.3);background:rgba(231,76,60,0.08);color:#e74c3c;cursor:pointer;font-weight:500" onclick="reviewApplication(\'' + applicationId + '\',\'reject\')">驳回</button>';
    html += '</div></div>';
  }

  html += '</div>';
  showCompModal(html);
}

async function reviewApplication(applicationId, action) {
  var comment = document.getElementById('reviewComment');
  var commentText = comment ? comment.value.trim() : '';

  if (action === 'reject' && !commentText) {
    showCopyToast('驳回时请填写原因', 'error');
    return;
  }

  var user = getCurrentUser();
  var newStatus = { approve: 'approved', reject: 'rejected', request_changes: 'request_changes' };

  // 写入审核记录
  var revRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_reviews', {
    method: 'POST',
    headers: HUB_HEADERS,
    body: JSON.stringify({
      application_id: applicationId,
      reviewer_user_id: user.id,
      action: action,
      comment: commentText
    })
  });

  if (!revRes.ok) { showCopyToast('审核操作失败', 'error'); return; }

  // 更新报名状态
  var appRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?id=eq.' + applicationId, {
    method: 'PATCH',
    headers: HUB_HEADERS,
    body: JSON.stringify({ status: newStatus[action] })
  });

  if (appRes.ok) {
    showCopyToast('审核完成：' + { approve: '已通过', reject: '已驳回', request_changes: '已要求补充' }[action], 'success');
    showAdminAppDetail(applicationId);
  } else {
    showCopyToast('状态更新失败', 'error');
  }
}

/* ========== 企业管理 ========== */

/**
 * 渲染企业管理标签页
 */
async function renderAdminEnterprises() {
  var contentEl = document.getElementById('adminTabContent');
  if (!contentEl) return;

  contentEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">加载企业列表...</div>';

  var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/enterprises?select=*&order=created_at.desc', { headers: HUB_GET_HEADERS });
  if (!res.ok) {
    contentEl.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c">加载企业列表失败</div>';
    return;
  }
  var enterprises = await res.json();

  var html = '';

  // 顶部操作栏
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<div style="font-size:14px;color:var(--text-muted)">共 ' + enterprises.length + ' 家企业</div>';
  html += '<button class="btn-primary" style="font-size:13px;padding:8px 16px" onclick="showEnterpriseForm()">添加企业</button>';
  html += '</div>';

  if (enterprises.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:var(--text-muted)">暂无企业记录，点击上方按钮添加</div>';
    contentEl.innerHTML = html;
    return;
  }

  // 企业卡片列表
  for (var i = 0; i < enterprises.length; i++) {
    var ent = enterprises[i];
    var coopTypes = ent.cooperation_type || [];
    if (typeof coopTypes === 'string') {
      try { coopTypes = JSON.parse(coopTypes); } catch (e) { coopTypes = []; }
    }

    var coopLabels = { '实习': '实习', '校招': '校招', '竞赛赞助': '竞赛赞助', '产学研': '产学研' };
    var tagsHtml = '';
    for (var j = 0; j < coopTypes.length; j++) {
      var tagColor = { '实习': '#06b6d4', '校招': '#2ecc71', '竞赛赞助': '#FFC84A', '产学研': '#a78bfa' };
      tagsHtml += '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:' + (tagColor[coopTypes[j]] || 'var(--bg-secondary)') + ';color:#fff;margin-right:4px">' + esc(coopLabels[coopTypes[j]] || coopTypes[j]) + '</span>';
    }

    var statusBadge = ent.is_active !== false
      ? '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(46,204,113,0.1);color:#2ecc71">活跃</span>'
      : '<span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(231,76,60,0.1);color:#e74c3c">停用</span>';

    html += '<div class="card" style="padding:16px;margin-bottom:8px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="display:flex;align-items:center;gap:8px">';
    html += '<span style="font-weight:600;font-size:14px">' + esc(ent.enterprise_name || '未知企业') + '</span>';
    html += statusBadge;
    html += '</div>';
    if (ent.industry) {
      html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">行业：' + esc(ent.industry) + '</div>';
    }
    if (tagsHtml) {
      html += '<div style="margin-top:6px">' + tagsHtml + '</div>';
    }
    if (ent.description) {
      html += '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:500px">' + esc(ent.description) + '</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;gap:6px;flex-shrink:0;margin-left:12px">';
    html += '<button style="padding:6px 12px;border-radius:6px;border:1px solid var(--border-subtle);background:var(--bg-secondary);color:var(--text-primary);cursor:pointer;font-size:12px" onclick="showEnterpriseForm(\'' + ent.id + '\')">编辑</button>';
    html += '<button style="padding:6px 12px;border-radius:6px;border:1px solid rgba(231,76,60,0.3);background:rgba(231,76,60,0.06);color:#e74c3c;cursor:pointer;font-size:12px" onclick="deleteEnterprise(\'' + ent.id + '\')">删除</button>';
    html += '</div>';
    html += '</div></div>';
  }

  contentEl.innerHTML = html;
}

/**
 * 显示企业添加/编辑表单弹窗
 * @param {string|null} enterpriseId - 编辑时传入企业 ID，新增时为 null
 */
async function showEnterpriseForm(enterpriseId) {
  var isEdit = !!enterpriseId;
  var ent = {};

  if (isEdit) {
    var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/enterprises?id=eq.' + enterpriseId + '&select=*', { headers: HUB_GET_HEADERS });
    if (res.ok) {
      var data = await res.json();
      ent = data[0] || {};
    }
  }

  var coopTypes = ent.cooperation_type || [];
  if (typeof coopTypes === 'string') {
    try { coopTypes = JSON.parse(coopTypes); } catch (e) { coopTypes = []; }
  }

  var allCoopTypes = ['实习', '校招', '竞赛赞助', '产学研'];

  var html = '<div style="max-width:500px;margin:0 auto;padding:20px">';
  html += '<h3 style="margin-bottom:20px">' + (isEdit ? '编辑企业' : '添加企业') + '</h3>';

  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">企业名称 *</label>';
  html += '<input type="text" id="entName" value="' + esc(ent.enterprise_name || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px" placeholder="请输入企业名称">';
  html += '</div>';

  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">所属行业</label>';
  html += '<input type="text" id="entIndustry" value="' + esc(ent.industry || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px" placeholder="如：互联网、制造业、金融">';
  html += '</div>';

  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">企业描述</label>';
  html += '<textarea id="entDesc" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px;font-family:inherit" placeholder="简要描述企业信息">' + esc(ent.description || '') + '</textarea>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  html += '<div>';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">联系人</label>';
  html += '<input type="text" id="entContact" value="' + esc(ent.contact_person || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px" placeholder="联系人姓名">';
  html += '</div>';
  html += '<div>';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">联系电话</label>';
  html += '<input type="text" id="entPhone" value="' + esc(ent.contact_phone || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px" placeholder="联系电话">';
  html += '</div>';
  html += '</div>';

  html += '<div style="margin-bottom:12px">';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:4px">网站地址</label>';
  html += '<input type="text" id="entWebsite" value="' + esc(ent.website_url || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-size:13px" placeholder="https://example.com">';
  html += '</div>';

  html += '<div style="margin-bottom:16px">';
  html += '<label style="font-size:13px;color:var(--text-muted);display:block;margin-bottom:6px">合作类型</label>';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  for (var i = 0; i < allCoopTypes.length; i++) {
    var checked = coopTypes.indexOf(allCoopTypes[i]) >= 0 ? 'checked' : '';
    html += '<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">';
    html += '<input type="checkbox" class="entCoopType" value="' + allCoopTypes[i] + '" ' + checked + ' style="accent-color:var(--accent)">';
    html += allCoopTypes[i];
    html += '</label>';
  }
  html += '</div></div>';

  html += '<div style="margin-bottom:16px">';
  html += '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">';
  html += '<input type="checkbox" id="entActive" ' + (ent.is_active !== false ? 'checked' : '') + ' style="accent-color:var(--accent)">';
  html += '启用（活跃状态）';
  html += '</label></div>';

  html += '<div style="display:flex;gap:8px">';
  html += '<button class="btn-primary" style="flex:1" onclick="saveEnterprise(\'' + (enterpriseId || '') + '\')">' + (isEdit ? '保存修改' : '添加企业') + '</button>';
  html += '<button style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:13px" onclick="renderAdminEnterprises()">取消</button>';
  html += '</div>';

  html += '</div>';
  showCompModal(html);
}

/**
 * 保存企业（新增或编辑）
 */
async function saveEnterprise(enterpriseId) {
  var name = document.getElementById('entName').value.trim();
  if (!name) {
    showCopyToast('请输入企业名称', 'error');
    return;
  }

  var coopCheckboxes = document.querySelectorAll('.entCoopType:checked');
  var coopTypes = [];
  for (var i = 0; i < coopCheckboxes.length; i++) {
    coopTypes.push(coopCheckboxes[i].value);
  }

  var payload = {
    enterprise_name: name,
    industry: document.getElementById('entIndustry').value.trim(),
    description: document.getElementById('entDesc').value.trim(),
    contact_person: document.getElementById('entContact').value.trim(),
    contact_phone: document.getElementById('entPhone').value.trim(),
    website_url: document.getElementById('entWebsite').value.trim(),
    cooperation_type: coopTypes,
    is_active: document.getElementById('entActive').checked
  };

  var url, method;
  if (enterpriseId) {
    url = HUB_URL + '/functions/v1/competition-api/rest/v1/enterprises?id=eq.' + enterpriseId;
    method = 'PATCH';
  } else {
    url = HUB_URL + '/functions/v1/competition-api/rest/v1/enterprises';
    method = 'POST';
  }

  var res = await fetch(url, {
    method: method,
    headers: HUB_HEADERS,
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    showCopyToast(enterpriseId ? '企业信息已更新' : '企业添加成功', 'success');
    renderAdminEnterprises();
  } else {
    var errData = await res.json().catch(function() { return {}; });
    showCopyToast('保存失败：' + (errData.message || '未知错误'), 'error');
  }
}

/**
 * 删除企业
 */
async function deleteEnterprise(enterpriseId) {
  showConfirm('确定要删除该企业吗？此操作不可撤销。', async function() {
    var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/enterprises?id=eq.' + enterpriseId, {
      method: 'DELETE',
      headers: HUB_HEADERS
    });
    if (res.ok) {
      showCopyToast('企业已删除', 'success');
      renderAdminEnterprises();
    } else {
      showCopyToast('删除失败', 'error');
    }
  });
}

/* ========== 学习资源管理 ========== */

/**
 * 渲染学习资源标签页
 */
function renderAdminResources() {
  var contentEl = document.getElementById('adminTabContent');
  if (!contentEl) return;

  // 尝试调用 learning-resources.js 模块中的渲染函数
  if (typeof renderAdminLearningResources === 'function') {
    renderAdminLearningResources();
    return;
  }

  // 回退：显示提示信息
  var html = '<div style="text-align:center;padding:60px 20px">';
  html += '<div style="font-size:48px;margin-bottom:16px;opacity:0.3">&#128218;</div>';
  html += '<div style="font-size:16px;font-weight:500;color:var(--text-primary);margin-bottom:8px">学习资源管理</div>';
  html += '<div style="font-size:13px;color:var(--text-muted)">学习资源管理请访问学习资源页面</div>';
  html += '</div>';

  contentEl.innerHTML = html;
}

/* ========== 全局看板（super_admin） ========== */

/**
 * 渲染超级管理员全局看板
 */
async function renderAdminDashboard() {
  var contentEl = document.getElementById('adminTabContent');
  if (!contentEl) return;

  contentEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">加载全局看板...</div>';

  var html = '';

  // 尝试从 competition_admin_dashboard 视图获取统计数据
  try {
    var dashRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/competition_admin_dashboard?select=*', { headers: HUB_GET_HEADERS });
    if (dashRes.ok) {
      var dashData = await dashRes.json();

      // 汇总统计
      var totalComps = dashData.length;
      var totalApps = 0;
      var totalApproved = 0;
      var totalPending = 0;
      var collegeMap = {};

      for (var i = 0; i < dashData.length; i++) {
        var row = dashData[i];
        totalApps += (row.total_applications || 0);
        totalApproved += (row.approved_applications || 0);
        totalPending += (row.pending_applications || 0);

        // 按学院统计
        if (row.college) {
          if (!collegeMap[row.college]) {
            collegeMap[row.college] = { apps: 0, approved: 0 };
          }
          collegeMap[row.college].apps += (row.total_applications || 0);
          collegeMap[row.college].approved += (row.approved_applications || 0);
        }
      }

      // 顶部统计卡片
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:24px">';
      html += '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--text-primary)">' + totalComps + '</div><div style="font-size:12px;color:var(--text-muted)">竞赛总数</div></div>';
      html += '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:var(--text-primary)">' + totalApps + '</div><div style="font-size:12px;color:var(--text-muted)">报名总数</div></div>';
      html += '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#2ecc71">' + totalApproved + '</div><div style="font-size:12px;color:var(--text-muted)">已通过</div></div>';
      html += '<div class="card" style="padding:16px;text-align:center"><div style="font-size:24px;font-weight:800;color:#FFC84A">' + totalPending + '</div><div style="font-size:12px;color:var(--text-muted)">待审核</div></div>';
      html += '</div>';

      // 学院参与排名
      var colleges = Object.keys(collegeMap).sort(function(a, b) { return collegeMap[b].apps - collegeMap[a].apps; });

      if (colleges.length > 0) {
        html += '<div class="card" style="padding:16px">';
        html += '<div style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-primary)">学院参与排名</div>';

        var maxApps = collegeMap[colleges[0]].apps || 1;
        for (var j = 0; j < Math.min(colleges.length, 10); j++) {
          var cName = colleges[j];
          var cData = collegeMap[cName];
          var barWidth = Math.max(4, Math.round((cData.apps / maxApps) * 100));
          var rank = j + 1;
          var rankColor = rank <= 3 ? '#FFC84A' : 'var(--text-muted)';

          html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
          html += '<span style="font-size:13px;font-weight:700;color:' + rankColor + ';width:24px;text-align:center">' + rank + '</span>';
          html += '<span style="font-size:13px;color:var(--text-primary);width:100px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(cName) + '</span>';
          html += '<div style="flex:1;height:20px;background:var(--bg-secondary);border-radius:4px;overflow:hidden">';
          html += '<div style="height:100%;width:' + barWidth + '%;background:linear-gradient(90deg,var(--accent),#06b6d4);border-radius:4px;transition:width 0.3s"></div>';
          html += '</div>';
          html += '<span style="font-size:12px;color:var(--text-muted);width:60px;text-align:right">' + cData.apps + ' 报名</span>';
          html += '</div>';
        }

        html += '</div>';
      }
    } else {
      // dashboard 视图不可用，显示基本统计
      html += await buildFallbackDashboard();
    }
  } catch (e) {
    console.error('renderAdminDashboard error:', e);
    html += await buildFallbackDashboard();
  }

  contentEl.innerHTML = html;
}

/**
 * 回退看板：当 competition_admin_dashboard 视图不可用时
 */
async function buildFallbackDashboard() {
  var html = '<div class="card" style="padding:16px;margin-bottom:16px">';
  html += '<div style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--text-primary)">全局概览</div>';

  // 获取基本统计
  var compRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/competitions?select=id', { headers: HUB_GET_HEADERS });
  var compCount = compRes.ok ? (await compRes.json()).length : 0;

  var appRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?select=id,status', { headers: HUB_GET_HEADERS });
  var apps = appRes.ok ? await appRes.json() : [];
  var pendingCount = apps.filter(function(a) { return a.status === 'submitted' || a.status === 'under_review'; }).length;
  var approvedCount = apps.filter(function(a) { return a.status === 'approved'; }).length;

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">';
  html += '<div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:8px"><div style="font-size:20px;font-weight:800;color:var(--text-primary)">' + compCount + '</div><div style="font-size:11px;color:var(--text-muted)">竞赛总数</div></div>';
  html += '<div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:8px"><div style="font-size:20px;font-weight:800;color:var(--text-primary)">' + apps.length + '</div><div style="font-size:11px;color:var(--text-muted)">报名总数</div></div>';
  html += '<div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:8px"><div style="font-size:20px;font-weight:800;color:#2ecc71">' + approvedCount + '</div><div style="font-size:11px;color:var(--text-muted)">已通过</div></div>';
  html += '<div style="text-align:center;padding:12px;background:var(--bg-secondary);border-radius:8px"><div style="font-size:20px;font-weight:800;color:#FFC84A">' + pendingCount + '</div><div style="font-size:11px;color:var(--text-muted)">待审核</div></div>';
  html += '</div>';
  html += '</div>';

  html += '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">提示：创建 competition_admin_dashboard 视图以查看更详细的学院排名数据</div>';

  return html;
}
