/* Registration System v2 - Applications, Reviews, Files */

// ==========================================
// 0. 防重复提交锁
// ==========================================

var _submitLock = false;

// ==========================================
// 1. 报名入口
// ==========================================

async function startApplication(compId) {
  try {
    if (!isLoggedIn()) {
      showConfirm('报名需要先登录，是否前往登录？', function() { navigate('auth'); });
      return;
    }
    // 显示加载提示
    showCopyToast('正在检查报名状态...', 'info');
    // 检查是否已有草稿
    await checkExistingDraft(compId);
  } catch (error) {
    console.error('startApplication error:', error);
    showCopyToast('操作失败，请重试', 'error');
  }
}

// ==========================================
// 2. 检查已有报名
// ==========================================

async function checkExistingDraft(compId) {
  var user = getCurrentUser();
  var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?competition_id=eq.' + compId + '&applicant_user_id=eq.' + user.id + '&select=id,status,type,created_at', { headers: HUB_HEADERS });
  if (!res.ok) { showCopyToast('查询失败', 'error'); return; }
  var existing = await res.json();
  if (existing.length > 0) {
    var app = existing[0];
    if (app.status === 'draft') {
      showConfirm('你有未完成的报名，是否继续编辑？', function() { showApplicationForm(compId, app.id); });
    } else {
      showCopyToast('你已报名此竞赛（' + getStatusText(app.status) + '）', 'info');
    }
    return;
  }
  // 显示竞赛信息，进入分级报名流程
  showCompetitionLevelInfo(compId);
}

// ==========================================
// 3. 竞赛信息展示（分级报名流程）
// ==========================================

async function showCompetitionLevelInfo(compId) {
  try {
    showCopyToast('正在加载竞赛信息...', 'info');
    var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/competitions?competition_id=eq.' + compId + '&select=name,school_level_info,registration_notes,related_links,level,registration_start,registration_end', { headers: HUB_HEADERS });
    if (!res.ok) { showCopyToast('加载竞赛信息失败', 'error'); return; }
    var comps = await res.json();
    if (comps.length === 0) { showCopyToast('未找到竞赛信息', 'error'); return; }
    var comp = comps[0];

    var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';

    // 竞赛名称标题
    html += '<h3 style="margin-bottom:20px;text-align:center">' + esc(comp.name || '竞赛报名') + '</h3>';

    // 流程图：校赛报名 → 校赛 → 省赛报名 → 省赛 → 国赛报名 → 国赛
    html += '<div style="margin-bottom:24px;padding:16px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border-subtle)">';
    html += '<div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text-secondary)">竞赛晋级流程</div>';
    html += '<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;font-size:12px">';
    var flowSteps = [
      { label: '校赛报名', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
      { label: '校赛', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
      { label: '省赛报名', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
      { label: '省赛', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
      { label: '国赛报名', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
      { label: '国赛', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    ];
    flowSteps.forEach(function(step, idx) {
      html += '<span style="padding:6px 12px;border-radius:8px;background:' + step.bg + ';color:' + step.color + ';font-weight:500;white-space:nowrap">' + step.label + '</span>';
      if (idx < flowSteps.length - 1) {
        html += '<span style="color:var(--text-muted);font-size:16px">&rarr;</span>';
      }
    });
    html += '</div></div>';

    // 校赛级别信息
    if (comp.school_level_info) {
      var info = typeof comp.school_level_info === 'string' ? (function(){try{return JSON.parse(comp.school_level_info)}catch(e){console.warn('JSON.parse school_level_info failed:',e);return comp.school_level_info}})() : comp.school_level_info;
      html += '<div style="margin-bottom:16px;padding:16px;border-radius:12px;background:var(--bg-card);border:1px solid var(--border-subtle)">';
      html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-secondary)">校赛信息</div>';
      if (info.organizer) {
        html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px"><span style="color:var(--text-muted)">主办方：</span>' + esc(info.organizer) + '</div>';
      }
      if (info.contact) {
        html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px"><span style="color:var(--text-muted)">联系方式：</span>' + esc(info.contact) + '</div>';
      }
      if (info.location) {
        html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px"><span style="color:var(--text-muted)">地点：</span>' + esc(info.location) + '</div>';
      }
      if (info.notice_url) {
        html += '<div style="font-size:12px;margin-top:8px"><a href="' + esc(info.notice_url) + '" target="_blank" style="color:var(--accent);text-decoration:none;font-weight:500">查看校赛通知 &rarr;</a></div>';
      }
      html += '</div>';
    }

    // 报名须知
    if (comp.registration_notes) {
      html += '<div style="margin-bottom:16px;padding:14px 16px;border-radius:10px;background:rgba(255,200,74,0.08);border:1px solid rgba(255,200,74,0.2)">';
      html += '<div style="font-size:13px;font-weight:600;margin-bottom:6px;color:#FFC84A">报名须知</div>';
      html += '<div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">' + esc(comp.registration_notes) + '</div>';
      html += '</div>';
    }

    // 相关链接
    if (comp.related_links) {
      var links = typeof comp.related_links === 'string' ? (function(){try{return JSON.parse(comp.related_links)}catch(e){console.warn('JSON.parse related_links failed:',e);return null}})() : comp.related_links;
      if (Array.isArray(links) && links.length > 0) {
        html += '<div style="margin-bottom:16px">';
        html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-secondary)">相关链接</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        links.forEach(function(link) {
          var url = typeof link === 'string' ? link : link.url;
          var label = typeof link === 'string' ? link : (link.label || link.url);
          html += '<a href="' + esc(url) + '" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:8px;background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--accent);font-size:12px;text-decoration:none;font-weight:500">' + esc(label) + ' &nearr;</a>';
        });
        html += '</div></div>';
      }
    }

    // 报名时间
    if (comp.registration_start || comp.registration_end) {
      html += '<div style="margin-bottom:20px;padding:12px 16px;border-radius:10px;background:var(--bg-card);border:1px solid var(--border-subtle);font-size:12px;color:var(--text-secondary)">';
      if (comp.registration_start) {
        html += '<div style="margin-bottom:4px"><span style="color:var(--text-muted)">报名开始：</span>' + new Date(comp.registration_start).toLocaleString() + '</div>';
      }
      if (comp.registration_end) {
        html += '<div><span style="color:var(--text-muted)">报名截止：</span>' + new Date(comp.registration_end).toLocaleString() + '</div>';
      }
      html += '</div>';
    }

    // 下一步按钮
    html += '<button class="btn-primary" style="width:100%;padding:12px;font-size:15px;font-weight:600;border-radius:10px" onclick="showApplicationTypeSelector(\'' + compId + '\')">下一步：选择报名方式</button>';

    html += '</div>';
    showCompModal(html);
  } catch (error) {
    console.error('showCompetitionLevelInfo error:', error);
    showCopyToast('加载竞赛信息失败，请重试', 'error');
  }
}

// ==========================================
// 4. 报名类型选择（级别 + 个人/团队）
// ==========================================

async function showApplicationTypeSelector(compId) {
  try {
    var user = getCurrentUser();

    // 查询用户在此竞赛的已有报名记录，判断各级别是否可用
    var appRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?competition_id=eq.' + compId + '&applicant_user_id=eq.' + user.id + '&select=id,status,registration_level', { headers: HUB_HEADERS });
    var existingApps = appRes.ok ? await appRes.json() : [];
    var hasSchoolPassed = existingApps.some(function(a) { return a.registration_level === 'school' && (a.status === 'approved' || a.status === 'school_passed'); });
    var hasProvincialPassed = existingApps.some(function(a) { return a.registration_level === 'provincial' && (a.status === 'approved' || a.status === 'provincial_passed'); });

    var html = '<div style="max-width:500px;margin:0 auto;padding:20px">';
    html += '<h3 style="margin-bottom:20px">选择报名方式</h3>';

    // 报名级别选择
    html += '<div style="margin-bottom:20px">';
    html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-secondary)">报名级别</div>';
    html += '<div style="display:flex;gap:10px">';

    // 校赛报名（始终可用）
    html += '<div id="levelSchool" style="flex:1;padding:14px 8px;text-align:center;border-radius:10px;background:rgba(34,197,94,0.1);border:2px solid #22c55e;cursor:pointer;transition:all .2s" onclick="selectRegistrationLevel(\'school\')">';
    html += '<div style="font-weight:600;font-size:14px;color:#22c55e">校赛报名</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">校级选拔</div>';
    html += '</div>';

    // 省赛报名（需通过校赛）
    var provEnabled = hasSchoolPassed;
    html += '<div id="levelProvincial" style="flex:1;padding:14px 8px;text-align:center;border-radius:10px;background:' + (provEnabled ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)') + ';border:2px solid ' + (provEnabled ? '#f97316' : 'var(--border-subtle)') + ';cursor:' + (provEnabled ? 'pointer' : 'not-allowed') + ';opacity:' + (provEnabled ? '1' : '0.5') + ';transition:all .2s;position:relative"' + (provEnabled ? ' onclick="selectRegistrationLevel(\'provincial\')"' : '') + ' title="' + (provEnabled ? '' : '需先通过校赛') + '">';
    html += '<div style="font-weight:600;font-size:14px;color:' + (provEnabled ? '#f97316' : 'var(--text-muted)') + '">省赛报名</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + (provEnabled ? '省级竞赛' : '需先通过校赛') + '</div>';
    html += '</div>';

    // 国赛报名（需通过省赛）
    var natEnabled = hasProvincialPassed;
    html += '<div id="levelNational" style="flex:1;padding:14px 8px;text-align:center;border-radius:10px;background:' + (natEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)') + ';border:2px solid ' + (natEnabled ? '#ef4444' : 'var(--border-subtle)') + ';cursor:' + (natEnabled ? 'pointer' : 'not-allowed') + ';opacity:' + (natEnabled ? '1' : '0.5') + ';transition:all .2s;position:relative"' + (natEnabled ? ' onclick="selectRegistrationLevel(\'national\')"' : '') + ' title="' + (natEnabled ? '' : '需先通过省赛') + '">';
    html += '<div style="font-weight:600;font-size:14px;color:' + (natEnabled ? '#ef4444' : 'var(--text-muted)') + '">国赛报名</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + (natEnabled ? '国家级竞赛' : '需先通过省赛') + '</div>';
    html += '</div>';

    html += '</div></div>';

    // 个人/团队选择（初始隐藏）
    html += '<div id="typeSelectorArea" style="display:none">';
    html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-secondary)">参赛形式</div>';
    html += '<div style="display:flex;gap:12px">';
    html += '<div class="card" style="flex:1;padding:24px;text-align:center;cursor:pointer" onclick="createApplication(\'' + compId + '\',\'individual\',_selectedLevel)">';
    html += '<div style="font-size:32px;margin-bottom:12px">' + svgIcon('user', 40) + '</div>';
    html += '<div style="font-weight:600;font-size:16px">个人报名</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">以个人身份参赛</div>';
    html += '</div>';
    html += '<div class="card" style="flex:1;padding:24px;text-align:center;cursor:pointer" onclick="createApplication(\'' + compId + '\',\'team\',_selectedLevel)">';
    html += '<div style="font-size:32px;margin-bottom:12px">' + svgIcon('users', 40) + '</div>';
    html += '<div style="font-weight:600;font-size:16px">团队报名</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">组建或加入团队</div>';
    html += '</div>';
    html += '</div></div>';

    html += '</div>';
    showCompModal(html);
  } catch (error) {
    console.error('showApplicationTypeSelector error:', error);
    showCopyToast('加载报名选项失败', 'error');
  }
}

// 选中的报名级别（全局临时变量）
var _selectedLevel = 'school';

function selectRegistrationLevel(level) {
  _selectedLevel = level;
  // 更新级别按钮高亮
  var levels = ['school', 'provincial', 'national'];
  var colors = { school: '#22c55e', provincial: '#f97316', national: '#ef4444' };
  var bgs = { school: 'rgba(34,197,94,0.1)', provincial: 'rgba(249,115,22,0.1)', national: 'rgba(239,68,68,0.1)' };
  var ids = { school: 'levelSchool', provincial: 'levelProvincial', national: 'levelNational' };
  levels.forEach(function(lv) {
    var el = document.getElementById(ids[lv]);
    if (!el) return;
    if (lv === level) {
      el.style.boxShadow = '0 0 0 3px ' + colors[lv] + '33';
    } else {
      el.style.boxShadow = 'none';
    }
  });
  // 显示个人/团队选择
  var typeArea = document.getElementById('typeSelectorArea');
  if (typeArea) typeArea.style.display = 'block';
}

// ==========================================
// 4. 创建报名记录
// ==========================================

async function createApplication(compId, type, level) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var user = getCurrentUser();
    var body = {
      competition_id: compId,
      applicant_user_id: user.id,
      type: type,
      status: 'draft',
      data: {}
    };
    if (level) {
      body.registration_level = level;
    }
    var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications', {
      method: 'POST',
      headers: HUB_HEADERS,
      body: JSON.stringify(body)
    });
    if (!res.ok) { showCopyToast('创建报名失败', 'error'); return; }
    var app = await res.json();
    showCopyToast('报名已创建，请填写信息', 'success');
    showApplicationForm(compId, app.id);
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 5. 报名表单（核心）
// ==========================================

async function showApplicationForm(compId, applicationId) {
  try {
  var user = getCurrentUser();

  // 获取报名记录
  var appRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?id=eq.' + applicationId, { headers: HUB_HEADERS });
  var appData = (await appRes.json())[0];
  if (!appData) { showCopyToast('报名信息不存在'); return; }

  // 获取表单定义
  var formRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_forms?competition_id=eq.' + compId, { headers: HUB_HEADERS });
  var formData = (await formRes.json())[0];
  var schema = formData ? formData.schema : getDefaultSchema();

  // 获取竞赛信息
  var comps = await fetchCompetitions();
  var comp = comps.find(function(c) { return c.id === compId; });

  // 获取材料要求
  var reqRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/form_requirements?competition_id=eq.' + compId + '&order=sort_order', { headers: HUB_HEADERS });
  var requirements = await reqRes.json();

  // 获取已有材料
  var filesRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_files?application_id=eq.' + applicationId + '&status=eq.uploaded', { headers: HUB_HEADERS });
  var files = await filesRes.json();

  // 渲染表单
  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<input type="hidden" id="appCompId" value="' + compId + '">';
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button onclick="startApplication(\'' + compId + '\')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px">&larr;</button>';
  html += '<h3>' + esc(comp ? comp.name : '竞赛报名') + '</h3>';
  html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + getStatusBg(appData.status) + ';color:' + getStatusColor(appData.status) + '">' + getStatusText(appData.status) + '</span>';
  html += '</div>';

  // 表单字段
  html += '<div id="appFormFields">';
  schema.forEach(function(field) {
    var val = appData.data[field.key] || '';
    html += '<div style="margin-bottom:16px">';
    html += '<label style="display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:var(--text-secondary)">' + esc(field.label) + (field.required ? ' <span style="color:#ef4444">*</span>' : '') + '</label>';
    if (field.type === 'textarea') {
      html += '<textarea class="form-input" data-key="' + field.key + '" placeholder="' + esc(field.placeholder || '') + '" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary);font-family:inherit;resize:vertical">' + esc(val) + '</textarea>';
    } else if (field.type === 'select') {
      html += '<select class="form-input" data-key="' + field.key + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary)">';
      html += '<option value="">请选择</option>';
      (field.options || []).forEach(function(opt) {
        html += '<option value="' + esc(opt) + '"' + (val === opt ? ' selected' : '') + '>' + esc(opt) + '</option>';
      });
      html += '</select>';
    } else {
      html += '<input type="' + (field.type === 'number' ? 'number' : 'text') + '" class="form-input" data-key="' + field.key + '" value="' + esc(val) + '" placeholder="' + esc(field.placeholder || '') + '" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card);color:var(--text-primary)">';
    }
    html += '</div>';
  });
  html += '</div>';

  // 材料上传区域
  if (requirements.length > 0) {
    html += '<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-subtle)">';
    html += '<h4 style="margin-bottom:12px;font-size:14px">材料上传</h4>';
    requirements.forEach(function(req) {
      var reqFiles = files.filter(function(f) { return f.requirement_key === req.key; });
      html += '<div style="margin-bottom:12px;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);background:var(--bg-card)">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center">';
      html += '<div><div style="font-size:13px;font-weight:500">' + esc(req.label) + (req.required ? ' <span style="color:#ef4444">*</span>' : '') + '</div>';
      html += '<div style="font-size:11px;color:var(--text-muted)">' + (req.allow_multi ? '允许多文件' : '单个文件') + '</div></div>';
      html += '<label style="padding:6px 14px;border-radius:8px;background:var(--accent);color:#111;font-size:12px;font-weight:500;cursor:pointer">';
      html += '上传<input type="file" style="display:none" onchange="handleFileUpload(\'' + applicationId + '\',\'' + req.key + '\',this,' + req.allow_multi + ')"' + (appData.status !== 'draft' && appData.status !== 'request_changes' ? ' disabled' : '') + '></label>';
      html += '</div>';
      if (reqFiles.length > 0) {
        html += '<div style="margin-top:8px">';
        reqFiles.forEach(function(f) {
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:4px;background:rgba(255,200,74,0.05);margin-bottom:4px;font-size:12px">';
          html += '<span style="color:var(--text-secondary)">' + esc(f.file_name) + '</span>';
          html += '<span style="color:var(--text-muted)">v' + f.version + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // 操作按钮
  html += '<div style="margin-top:24px;display:flex;gap:12px">';
  if (appData.status === 'draft' || appData.status === 'request_changes') {
    html += '<button class="btn-secondary" style="flex:1" onclick="saveDraft(\'' + applicationId + '\',\'' + compId + '\')">保存草稿</button>';
    html += '<button class="btn-primary" style="flex:1" onclick="submitApplication(\'' + applicationId + '\',\'' + compId + '\')">提交报名</button>';
  }
  if (appData.status === 'submitted' || appData.status === 'under_review') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(255,200,74,0.08);font-size:13px;color:var(--accent)">已提交，等待审核中...</div>';
  }
  if (appData.status === 'approved') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(46,204,113,0.1);font-size:13px;color:#2ecc71">报名已通过 ✓</div>';
  }
  if (appData.status === 'rejected') {
    html += '<div style="flex:1;text-align:center;padding:12px;border-radius:8px;background:rgba(231,76,60,0.1);font-size:13px;color:#e74c3c">报名已被驳回</div>';
  }
  html += '</div></div>';

  showCompModal(html);
  } catch(error) {
    console.error('showApplicationForm error:', error);
    showCopyToast('加载报名表单失败，请重试', 'error');
  }
}

// ==========================================
// 6. 保存草稿
// ==========================================

async function saveDraft(applicationId, compId) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var data = collectFormData();
    var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?id=eq.' + applicationId, {
      method: 'PATCH',
      headers: HUB_HEADERS,
      body: JSON.stringify({ data: data })
    });
    if (res.ok) {
      showCopyToast('草稿已保存', 'success');
    } else {
      showCopyToast('保存失败', 'error');
    }
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 7. 提交报名
// ==========================================

async function submitApplication(applicationId, compId) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var data = collectFormData();
    // 验证必填字段
    var formRes = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_forms?competition_id=eq.' + compId, { headers: HUB_HEADERS });
    var formData = (await formRes.json())[0];
    if (formData && formData.schema) {
      var missing = formData.schema.filter(function(f) { return f.required && !data[f.key]; });
      if (missing.length > 0) {
        showCopyToast('请填写必填项：' + missing.map(function(f) { return f.label; }).join('、'), 'error');
        _submitLock = false;
        return;
      }
    }
    // 注意：_submitLock 在 confirm 回调中释放，不在外层 try/catch 中释放
    showConfirm('确认提交报名？提交后将无法修改。', async function() {
      try {
        var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?id=eq.' + applicationId, {
          method: 'PATCH',
          headers: HUB_HEADERS,
          body: JSON.stringify({
            data: data,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
        });
        if (res.ok) {
          showCopyToast('报名已提交！', 'success');
          // 尝试创建通知给竞赛管理员（best-effort，失败不影响主流程）
          try {
            var user = getCurrentUser();
            var comps = await fetchCompetitions();
            var comp = comps.find(function(c) { return c.id === compId; });
            var compName = comp ? comp.name : '未知竞赛';
            await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/notifications', {
              method: 'POST',
              headers: HUB_HEADERS,
              body: JSON.stringify({
                title: '新报名待审核',
                content: user.name + ' 报名了 ' + compName,
                notification_type: 'registration_submitted',
                action_url: '/admin'
              })
            });
          } catch (notifyErr) {
            console.warn('创建通知失败（不影响报名）:', notifyErr);
          }
          showApplicationForm(compId, applicationId);
        } else {
          showCopyToast('提交失败', 'error');
        }
      } catch (submitErr) {
        console.error('submitApplication error:', submitErr);
        showCopyToast('提交失败: ' + submitErr.message, 'error');
      } finally {
        _submitLock = false;
      }
    }, function() {
      // cancel callback - release the lock
      _submitLock = false;
    });
  } catch (e) {
    _submitLock = false;
    console.error('submitApplication validation error:', e);
  }
}

// ==========================================
// 8. 文件上传（模拟，实际需要 Supabase Storage）
// ==========================================

async function handleFileUpload(applicationId, requirementKey, input, allowMulti) {
  if (_submitLock) { showCopyToast('请勿重复提交', 'warning'); return; }
  _submitLock = true;
  try {
    var user = getCurrentUser();
    if (!input.files || input.files.length === 0) return;

    // File validation constants
    var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (var i = 0; i < input.files.length; i++) {
      var file = input.files[i];
      
      // Check file type
      if (ALLOWED_TYPES.indexOf(file.type) === -1) {
        showCopyToast('不支持的文件类型，仅支持图片、PDF、Word文档');
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        showCopyToast('文件大小不能超过10MB');
        continue;
      }

      // 模拟上传（实际应使用 Supabase Storage）
      // 这里将文件信息存入数据库，file_path 存储文件名
      var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/application_files', {
        method: 'POST',
        headers: HUB_HEADERS,
        body: JSON.stringify({
          application_id: applicationId,
          requirement_key: requirementKey,
          file_path: 'uploads/' + applicationId + '/' + file.name,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          version: 1,
          uploaded_by: user.id
        })
      });
      if (res.ok) {
        showCopyToast(file.name + ' 上传成功', 'success');
      }
    }
    // 刷新表单
    var compIdEl = document.getElementById('appCompId');
    if (compIdEl) {
      showApplicationForm(compIdEl.value, applicationId);
    }
  } finally {
    _submitLock = false;
  }
}

// ==========================================
// 9. 辅助函数
// ==========================================

function collectFormData() {
  var data = {};
  document.querySelectorAll('#appFormFields .form-input').forEach(function(el) {
    data[el.getAttribute('data-key')] = el.value;
  });
  return data;
}

function getDefaultSchema() {
  return [
    { key: 'real_name', label: '真实姓名', type: 'text', required: true, placeholder: '请输入真实姓名' },
    { key: 'student_id', label: '学号', type: 'text', required: true, placeholder: '请输入学号' },
    { key: 'college', label: '学院', type: 'text', required: true, placeholder: '请输入所在学院' },
    { key: 'phone', label: '联系电话', type: 'text', required: true, placeholder: '请输入手机号' },
    { key: 'experience', label: '相关经历', type: 'textarea', required: false, placeholder: '请简要描述相关经历' }
  ];
}

function getStatusText(status) {
  var map = { draft: '草稿', submitted: '已提交', under_review: '审核中', approved: '已通过', rejected: '已驳回', cancelled: '已取消', request_changes: '需补充' };
  return map[status] || status;
}

function getStatusBg(status) {
  var map = { draft: 'rgba(255,255,255,0.06)', submitted: 'rgba(255,200,74,0.1)', under_review: 'rgba(6,182,212,0.1)', approved: 'rgba(46,204,113,0.1)', rejected: 'rgba(231,76,60,0.1)', request_changes: 'rgba(251,191,36,0.1)' };
  return map[status] || 'rgba(255,255,255,0.06)';
}

function getStatusColor(status) {
  var map = { draft: 'var(--text-muted)', submitted: '#FFC84A', under_review: '#06b6d4', approved: '#2ecc71', rejected: '#e74c3c', request_changes: '#f59e0b' };
  return map[status] || 'var(--text-muted)';
}

// ==========================================
// 10. 我的报名页面增强
// ==========================================

async function renderMyApplications() {
  var container = document.getElementById('myRegsContent') || document.getElementById('myregistrationsContent') || document.getElementById('profileContent');
  if (!container) return;
  if (!isLoggedIn()) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><p>请先登录查看报名记录</p><button class="btn-primary" style="margin-top:16px" onclick="navigate(\'auth\')">去登录</button></div>';
    return;
  }
  var user = getCurrentUser();
  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">加载中...</div>';

  var res = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/applications?applicant_user_id=eq.' + user.id + '&select=*,competitions(name,level,category)&order=created_at.desc', { headers: HUB_HEADERS });
  if (!res.ok) { container.innerHTML = '<p style="text-align:center;color:#e74c3c">加载失败</p>'; return; }
  var apps = await res.json();

  if (apps.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:12px">' + svgIcon('clipboard', 40) + '</div><p>暂无报名记录</p><button class="btn-primary" style="margin-top:16px" onclick="navigate(\'competition\')">浏览竞赛</button></div>';
    return;
  }

  var html = '<div style="max-width:600px;margin:0 auto;padding:20px">';
  html += '<h3 style="margin-bottom:20px">我的报名 (' + apps.length + ')</h3>';
  apps.forEach(function(app) {
    var comp = app.competitions || {};
    html += '<div class="card" style="padding:16px;margin-bottom:10px;cursor:pointer" onclick="showApplicationForm(\'' + app.competition_id + '\',\'' + app.id + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(comp.name || '未知竞赛') + '</div>';
    html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + esc(comp.level || '') + ' · ' + esc(comp.category || '') + ' · ' + (app.type === 'team' ? '团队' : '个人') + '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + new Date(app.created_at).toLocaleDateString() + '</div>';
    html += '</div>';
    html += '<span style="font-size:12px;padding:4px 10px;border-radius:999px;background:' + getStatusBg(app.status) + ';color:' + getStatusColor(app.status) + ';white-space:nowrap">' + getStatusText(app.status) + '</span>';
    html += '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}
