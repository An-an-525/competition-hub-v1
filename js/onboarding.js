/* ============================================
   onboarding.js — 新用户引导系统
   长沙理工大学学科竞赛数智化平台
   ============================================
   Functions:
   - checkAndShowOnboarding()  入口，登录后调用
   - showOnboardingGuide()     全屏多步骤引导弹窗
   - showCategoryTooltip()     竞赛列表页分类气泡提示
   ============================================ */

(function () {
  'use strict';

  var LS_KEY_GUIDE_SEEN = 'onboarding_guide_seen';
  var LS_KEY_TOOLTIP_SEEN = 'onboarding_tooltip_seen';

  /* ============================================
     竞赛分类数据
     ============================================ */
  var CATEGORIES = [
    { level: 'A',  label: 'A类',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  desc: '国家级顶级赛事', examples: '互联网+、挑战杯' },
    { level: 'B+', label: 'B+类', color: '#F97316', bg: 'rgba(249,115,22,0.12)', desc: '国家级重要赛事', examples: 'ACM、数模、电子设计' },
    { level: 'B-', label: 'B-类', color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  desc: '国家级一般赛事', examples: '蓝桥杯、华为ICT' },
    { level: 'C',  label: 'C类',  color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  desc: '省级赛事',       examples: '省级学科竞赛' },
    { level: 'D',  label: 'D类',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', desc: '省级一般赛事',   examples: '省级一般学科竞赛' },
    { level: 'E',  label: 'E类',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', desc: '校级竞赛',       examples: '校内学科竞赛' }
  ];

  /* 参赛流程节点 */
  var FLOW_STEPS = [
    { label: '校赛报名', icon: 'clipboard' },
    { label: '校赛选拔', icon: 'check-circle' },
    { label: '省赛报名', icon: 'clipboard' },
    { label: '省赛',     icon: 'trophy' },
    { label: '国赛报名', icon: 'clipboard' },
    { label: '国赛',     icon: 'trophy' }
  ];

  /* 平台功能 */
  var FEATURES = [
    { title: '竞赛查询', desc: '覆盖55+项学科竞赛，支持分类筛选、关键词搜索', color: '#3B82F6', icon: 'search' },
    { title: 'AI问答',   desc: '智能竞赛助手，快速解答竞赛相关问题',           color: '#8B5CF6', icon: 'robot' },
    { title: '报名管理', desc: '在线报名、查看报名状态、截止日期提醒',         color: '#22C55E', icon: 'clipboard' },
    { title: '学习资源', desc: '竞赛资料、历年真题、备赛经验分享',             color: '#F97316', icon: 'graduation-cap' }
  ];

  /* ============================================
     checkAndShowOnboarding — 入口函数
     登录成功后调用
     ============================================ */
  function checkAndShowOnboarding() {
    var user = getCurrentUser();
    if (!user) return;

    // 已看过引导则不再显示
    if (getLS(LS_KEY_GUIDE_SEEN, false)) return;
    if (user.has_seen_guide) return;

    // 延迟 600ms 显示，等页面渲染完成
    setTimeout(function () {
      showOnboardingGuide();
    }, 600);
  }

  /* ============================================
     showOnboardingGuide — 全屏多步骤引导
     ============================================ */
  function showOnboardingGuide() {
    var currentStep = 0;
    var totalSteps = 3;

    // 创建遮罩层
    var overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100001;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);opacity:0;transition:opacity 0.3s ease;';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 创建弹窗容器
    var modal = document.createElement('div');
    modal.id = 'onboardingModal';
    modal.style.cssText = 'background:var(--bg-card,#FFFFFF);border:1px solid var(--border-subtle,rgba(0,0,0,0.1));border-radius:20px;padding:0;max-width:520px;width:92%;max-height:85vh;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);transform:translateY(20px) scale(0.96);transition:transform 0.3s ease;';
    overlay.appendChild(modal);

    // 渲染步骤内容
    function renderStep(step) {
      var html = '';

      // 顶部进度条
      html += '<div style="padding:20px 24px 0;display:flex;align-items:center;gap:8px">';
      for (var i = 0; i < totalSteps; i++) {
        var active = i === step;
        var done = i < step;
        html += '<div style="flex:1;height:4px;border-radius:2px;transition:background 0.3s;background:' +
          (done ? 'var(--accent,#d97706)' : active ? 'var(--accent,#d97706)' : 'var(--border-subtle,rgba(0,0,0,0.1))') +
          ';opacity:' + (active || done ? '1' : '0.4') + '"></div>';
      }
      html += '</div>';

      // 步骤标题
      var titles = ['竞赛分类说明', '参赛流程', '平台功能'];
      var subtitles = [
        '了解不同级别竞赛的含义与重要性',
        '从校赛到国赛的完整参赛路径',
        '平台核心功能一览'
      ];
      html += '<div style="padding:20px 24px 0">';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
      html += '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:var(--accent,#d97706);color:#fff;font-size:13px;font-weight:700">' + (step + 1) + '</span>';
      html += '<h3 style="margin:0;font-size:18px;font-weight:700;color:var(--text-primary,#1A1A1A)">' + esc(titles[step]) + '</h3>';
      html += '</div>';
      html += '<p style="margin:0;font-size:13px;color:var(--text-muted,#6B7280);padding-left:38px">' + esc(subtitles[step]) + '</p>';
      html += '</div>';

      // 步骤内容
      html += '<div style="padding:16px 24px 24px">';
      html += buildStepContent(step);
      html += '</div>';

      // 底部按钮
      html += '<div style="padding:0 24px 24px;display:flex;gap:10px;justify-content:flex-end">';
      if (step > 0) {
        html += '<button id="obPrevBtn" style="padding:10px 20px;border-radius:10px;border:1px solid var(--border-subtle,rgba(0,0,0,0.1));background:transparent;color:var(--text-secondary,#6B7280);cursor:pointer;font-size:14px;transition:all 0.2s">上一步</button>';
      }
      if (step < totalSteps - 1) {
        html += '<button id="obNextBtn" style="padding:10px 24px;border-radius:10px;border:none;background:var(--accent,#d97706);color:#fff;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">下一步</button>';
      } else {
        html += '<button id="obDoneBtn" style="padding:10px 24px;border-radius:10px;border:none;background:var(--accent,#d97706);color:#fff;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s">我知道了</button>';
      }
      html += '</div>';

      modal.innerHTML = html;

      // 绑定事件
      var prevBtn = document.getElementById('obPrevBtn');
      var nextBtn = document.getElementById('obNextBtn');
      var doneBtn = document.getElementById('obDoneBtn');

      if (prevBtn) {
        prevBtn.onclick = function () {
          currentStep--;
          renderStep(currentStep);
        };
      }
      if (nextBtn) {
        nextBtn.onclick = function () {
          currentStep++;
          renderStep(currentStep);
        };
      }
      if (doneBtn) {
        doneBtn.onclick = function () {
          markGuideSeen();
          closeModal();
        };
      }
    }

    // 构建各步骤内容
    function buildStepContent(step) {
      if (step === 0) return buildCategoryStep();
      if (step === 1) return buildFlowStep();
      return buildFeatureStep();
    }

    // Step 1: 竞赛分类说明
    function buildCategoryStep() {
      var html = '<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">';
      CATEGORIES.forEach(function (cat) {
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;background:' + cat.bg + ';border:1px solid ' + cat.color + '22;transition:transform 0.15s">';
        html += '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:28px;border-radius:8px;background:' + cat.color + ';color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px">' + esc(cat.label) + '</span>';
        html += '<div style="flex:1;min-width:0">';
        html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary,#1A1A1A)">' + esc(cat.desc) + '</div>';
        html += '<div style="font-size:12px;color:var(--text-muted,#6B7280);margin-top:2px">如：' + esc(cat.examples) + '</div>';
        html += '</div>';
        html += '</div>';
      });
      html += '<p style="font-size:12px;color:var(--text-muted,#6B7280);margin-top:4px;text-align:center">竞赛级别越高，含金量越大，对评优评先帮助越大</p>';
      html += '</div>';
      return html;
    }

    // Step 2: 参赛流程
    function buildFlowStep() {
      var html = '<div style="margin-top:12px">';
      // 流程图
      html += '<div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:0;padding:16px 0">';

      FLOW_STEPS.forEach(function (item, idx) {
        // 节点
        var isHighlight = idx === 1 || idx === 4; // 选拔节点
        var nodeColor = isHighlight ? '#22C55E' : (idx >= 4 ? '#EF4444' : '#3B82F6');
        var nodeBg = isHighlight ? 'rgba(34,197,94,0.12)' : (idx >= 4 ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)');

        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:60px">';
        html += '<div style="width:44px;height:44px;border-radius:12px;background:' + nodeBg + ';border:2px solid ' + nodeColor + ';display:flex;align-items:center;justify-content:center;color:' + nodeColor + '">';
        html += (typeof svgIcon === 'function' ? svgIcon(item.icon, 20) : '');
        html += '</div>';
        html += '<span style="font-size:12px;font-weight:600;color:var(--text-primary,#1A1A1A);white-space:nowrap">' + esc(item.label) + '</span>';
        html += '</div>';

        // 箭头（最后一个不加）
        if (idx < FLOW_STEPS.length - 1) {
          html += '<div style="display:flex;align-items:center;color:var(--text-muted,#6B7280);margin:0 2px;margin-bottom:22px">';
          html += '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
          html += '</div>';
        }
      });

      html += '</div>';

      // 分层说明
      html += '<div style="margin-top:8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">';
      html += '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted,#6B7280)"><span style="width:10px;height:10px;border-radius:3px;background:rgba(59,130,246,0.3);border:1px solid #3B82F6"></span>校级阶段</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted,#6B7280)"><span style="width:10px;height:10px;border-radius:3px;background:rgba(34,197,94,0.3);border:1px solid #22C55E"></span>选拔节点</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted,#6B7280)"><span style="width:10px;height:10px;border-radius:3px;background:rgba(239,68,68,0.3);border:1px solid #EF4444"></span>省赛/国赛</span>';
      html += '</div>';

      html += '<p style="font-size:12px;color:var(--text-muted,#6B7280);margin-top:12px;text-align:center;line-height:1.6">通常需要先在校赛中脱颖而出，才能获得省赛乃至国赛的参赛资格</p>';
      html += '</div>';
      return html;
    }

    // Step 3: 平台功能
    function buildFeatureStep() {
      var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">';
      FEATURES.forEach(function (feat) {
        html += '<div style="padding:16px 14px;border-radius:14px;background:' + feat.color + '0D;border:1px solid ' + feat.color + '1A;text-align:center;transition:transform 0.15s">';
        html += '<div style="width:40px;height:40px;border-radius:10px;background:' + feat.color + '18;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:' + feat.color + '">';
        html += (typeof svgIcon === 'function' ? svgIcon(feat.icon, 20) : '');
        html += '</div>';
        html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary,#1A1A1A);margin-bottom:4px">' + esc(feat.title) + '</div>';
        html += '<div style="font-size:12px;color:var(--text-muted,#6B7280);line-height:1.5">' + esc(feat.desc) + '</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '<p style="font-size:12px;color:var(--text-muted,#6B7280);margin-top:12px;text-align:center">更多功能持续开发中，敬请期待</p>';
      return html;
    }

    // 关闭弹窗
    function closeModal() {
      document.removeEventListener('keydown', onKeydown);
      modal.style.transform = 'translateY(20px) scale(0.96)';
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.style.overflow = '';
      }, 300);
    }

    // 点击遮罩不关闭（强制看完）
    // ESC 键跳过
    function onKeydown(e) {
      if (e.key === 'Escape') {
        markGuideSeen();
        closeModal();
        document.removeEventListener('keydown', onKeydown);
      }
    }
    document.addEventListener('keydown', onKeydown);

    // 入场动画
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
      modal.style.transform = 'translateY(0) scale(1)';
    });

    // 渲染第一步
    renderStep(0);
  }

  /* ============================================
     markGuideSeen — 标记引导已查看
     ============================================ */
  function markGuideSeen() {
    // 设置 localStorage
    setLS(LS_KEY_GUIDE_SEEN, true);

    // 更新 Supabase 用户资料
    var user = getCurrentUser();
    if (user && user.id) {
      fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/users?user_id=eq.' + user.id, {
        method: 'PATCH',
        headers: HUB_HEADERS,
        body: JSON.stringify({ has_seen_guide: true })
      }).then(function (res) {
        if (res.ok) {
          // 同步更新本地用户缓存
          user.has_seen_guide = true;
          setCurrentUser(user);
        }
      }).catch(function (e) {
        console.warn('更新引导状态失败:', e.message);
      });
    }

    showCopyToast('欢迎加入竞赛助手！', 'success');
  }

  /* ============================================
     showCategoryTooltip — 竞赛分类气泡提示
     首次访问竞赛列表页时显示
     ============================================ */
  function showCategoryTooltip() {
    // 已看过则不显示
    if (getLS(LS_KEY_TOOLTIP_SEEN, false)) return;

    // 创建气泡
    var tooltip = document.createElement('div');
    tooltip.id = 'categoryTooltip';
    tooltip.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);z-index:100000;background:var(--bg-card,#FFFFFF);border:1px solid var(--border-subtle,rgba(0,0,0,0.1));border-radius:14px;padding:14px 18px;max-width:380px;width:calc(100% - 48px);box-shadow:0 8px 30px rgba(0,0,0,0.12);opacity:0;transition:all 0.3s ease;cursor:pointer;';

    var html = '<div style="display:flex;align-items:flex-start;gap:12px">';
    html += '<div style="flex-shrink:0;width:36px;height:36px;border-radius:10px;background:var(--accent,#d97706);color:#fff;display:flex;align-items:center;justify-content:center">';
    html += (typeof svgIcon === 'function' ? svgIcon('help-circle', 18) : '?');
    html += '</div>';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-size:14px;font-weight:600;color:var(--text-primary,#1A1A1A);margin-bottom:6px">竞赛分类小贴士</div>';
    html += '<div style="font-size:12px;color:var(--text-muted,#6B7280);line-height:1.6">';
    html += '竞赛按级别分为 <b style="color:#EF4444">A</b> <b style="color:#F97316">B+</b> <b style="color:#EAB308">B-</b> <b style="color:#22C55E">C</b> <b style="color:#3B82F6">D</b> <b style="color:#8B5CF6">E</b> 六类，';
    html += 'A类为最高级别国家级赛事，E类为校级竞赛。';
    html += '</div>';
    html += '<div style="font-size:11px;color:var(--text-muted,#6B7280);margin-top:6px;opacity:0.7">点击任意位置关闭</div>';
    html += '</div>';
    html += '</div>';

    tooltip.innerHTML = html;

    // 点击关闭
    tooltip.onclick = function () {
      dismissTooltip();
    };

    document.body.appendChild(tooltip);

    // 入场动画
    requestAnimationFrame(function () {
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateX(-50%) translateY(0)';
    });

    // 8秒后自动消失
    tooltip._autoTimer = setTimeout(function () {
      dismissTooltip();
    }, 8000);
  }

  function dismissTooltip() {
    var tooltip = document.getElementById('categoryTooltip');
    if (!tooltip) return;
    clearTimeout(tooltip._autoTimer);
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(function () {
      if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    }, 300);
    setLS(LS_KEY_TOOLTIP_SEEN, true);
  }

  /* ============================================
     导出全局函数
     ============================================ */
  window.checkAndShowOnboarding = checkAndShowOnboarding;
  window.showOnboardingGuide = showOnboardingGuide;
  window.showCategoryTooltip = showCategoryTooltip;

})();
