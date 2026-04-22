/* Extracted from app.js */

function navigate(page,tab){
  // Clear any running timers
  if (window._cdInterval) { clearInterval(window._cdInterval); window._cdInterval = null; }
  if (window.app && window.app.pomodoroTimer) { clearInterval(window.app.pomodoroTimer); window.app.pomodoroTimer = null; }
  // 修复：导航时确保滚动不被锁定
  document.body.style.overflow='';
  // Reset modal counter on navigation
  if(typeof _modalCount!=='undefined'){_modalCount=0;}
  // 清理可能残留的弹窗
  var stuckOverlays=document.querySelectorAll('div[style*="z-index:1000"]');
  stuckOverlays.forEach(function(o){try{document.body.removeChild(o)}catch(e){}});
  closeMobileMenu();
  var activePage=document.querySelector('.page.active');
  if(activePage&&activePage.id!=='page-'+page){
    activePage.style.transition='opacity 0.25s ease';
    activePage.style.opacity='0';
    var pageRef=page,tabRef=tab;
    setTimeout(function(){
      activePage.classList.remove('active');
      activePage.style.opacity='';
      activePage.style.transition='';
      document.querySelectorAll('.nav-link').forEach(function(l){l.classList.remove('active')});
      var target=document.getElementById('page-'+pageRef);
      if(target){
        target.classList.add('active');
        target.style.opacity='0';
        target.style.transition='opacity 0.25s ease';
        requestAnimationFrame(function(){
          target.style.opacity='1';
        });
      }
      document.querySelectorAll('.nav-link[data-page="'+pageRef+'"]').forEach(function(l){l.classList.add('active')});
      app.currentPage=pageRef;
      window.scrollTo({top:0,behavior:'smooth'});
      handlePageInit(pageRef,tabRef);
    },250);
  } else {
    document.querySelectorAll('.nav-link').forEach(function(l){l.classList.remove('active')});
    var target2=document.getElementById('page-'+page);
    if(target2){target2.classList.add('active')}
    document.querySelectorAll('.nav-link[data-page="'+page+'"]').forEach(function(l){l.classList.add('active')});
    app.currentPage=page;
    window.scrollTo({top:0,behavior:'smooth'});
    handlePageInit(page,tab);
  }
}
function handlePageInit(page,tab){
  if(page==='home')refreshQuote();
  if(page==='academic'){if(tab)switchAcademicTab(tab);else switchAcademicTab('majors')}
  if(page==='campus'){if(tab)switchCampusTab(tab);else switchCampusTab('overview')}
  if(page==='admission'){if(tab)switchAdmissionTab(tab);else switchAdmissionTab('policy')}
  if(page==='news'){if(tab)switchNewsTab(tab);else switchNewsTab('notices')}
  if(page==='competition'){if(tab)switchCompetitionTab(tab);else switchCompetitionTab('all')}
  if(page==='toolbox'){if(tab)switchToolboxTab(tab);else document.getElementById('toolboxContent').innerHTML=''}
  if(page==='profile')renderProfile();
  if(page==='ai')updateAIView();
  if(page==='learning'){if(typeof renderLearningResources==='function')renderLearningResources()}
  if(page==='guide'){renderGuidePage()}
}
function toggleNavGroup(btn){var dropdown=btn.nextElementSibling;var isOpen=dropdown.classList.contains('show');closeAllNavGroups();if(!isOpen){dropdown.classList.add('show');btn.setAttribute('aria-expanded','true')}else{btn.setAttribute('aria-expanded','false')}btn.classList.toggle('active',!isOpen)}
function closeAllNavGroups(){document.querySelectorAll('.nav-dropdown').forEach(function(d){d.classList.remove('show')});document.querySelectorAll('.nav-group-trigger,.nav-dropdown-trigger').forEach(function(t){t.classList.remove('active');t.setAttribute('aria-expanded','false')})}
function toggleMobileMenu(){document.body.style.overflow='hidden';document.getElementById('mobileMenu').classList.toggle('open');document.getElementById('hamburgerBtn').classList.toggle('open')}
function closeMobileMenu(){document.body.style.overflow='';document.getElementById('mobileMenu').classList.remove('open');document.getElementById('hamburgerBtn').classList.remove('open')}
document.addEventListener('click',function(e){if(!e.target.closest('.nav-group'))closeAllNavGroups()});
function refreshQuote(){if(typeof QUOTES==='undefined'||!QUOTES.length)return;var q=QUOTES[Math.floor(Math.random()*QUOTES.length)];var textEl=document.getElementById('quoteText');var authorEl=document.getElementById('quoteAuthor');if(textEl)textEl.textContent=q.text;if(authorEl)authorEl.textContent='—— '+q.author}

function toggleTheme(){var html=document.documentElement;var isLight=html.getAttribute('data-theme')==='light';html.setAttribute('data-theme',isLight?'dark':'light');html.setAttribute('data-user-theme',isLight?'dark':'light');setLS('theme',isLight?'dark':'light');var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=isLight?'#07070a':'#fafaf8';var sunIcon=document.getElementById('themeIconSun');var moonIcon=document.getElementById('themeIconMoon');if(sunIcon&&moonIcon){sunIcon.style.display=isLight?'none':'';moonIcon.style.display=isLight?'':'none'}}
document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();openGlobalSearch()}if(e.key==='Escape'){hideContactModal();hideLegalModal();closeGlobalSearch()}});

var _origNavigate=navigate;
/* 页面标题映射（移动端返回导航栏） */
var PAGE_TITLES={home:'首页',academic:'学业助手',campus:'校园生活',admission:'招生咨询',news:'校园资讯',competition:'学科竞赛',toolbox:'工具箱',profile:'个人中心',ai:'AI问答',auth:'登录注册',admin:'管理面板',myregistrations:'我的报名',learning:'学习资源',guide:'竞赛指南'};
/* 更新移动端底部标签栏和返回导航栏 */
function updateMobileNav(page){
  /* 底部标签栏激活状态 */
  var tabMap={home:'home',competition:'competition',toolbox:'toolbox',profile:'profile'};
  var activeTab=tabMap[page]||'';
  document.querySelectorAll('.bottom-tab-item').forEach(function(item){
    item.classList.toggle('active',item.getAttribute('data-tab')===activeTab);
  });
  /* 返回导航栏 */
  var backNav=document.getElementById('backNav');
  var backNavTitle=document.getElementById('backNavTitle');
  var shell=document.getElementById('main-content');
  if(page==='home'){
    backNav.style.display='none';
    shell.classList.remove('on-sub-page');
  }else{
    backNav.style.display='';
    backNavTitle.textContent=PAGE_TITLES[page]||'';
    shell.classList.add('on-sub-page');
  }
}
/* 回到顶部按钮：滚动监听 */
function initBackToTop(){
  var btn=document.getElementById('backToTop');
  if(!btn)return;
  var ticking=false;
  window.addEventListener('scroll',function(){
    if(!ticking){requestAnimationFrame(function(){ticking=false;if(window.scrollY>300){btn.classList.add('visible')}else{btn.classList.remove('visible')}});ticking=true}
  },{passive:true});
}
/* 触觉反馈：关键操作振动 */
function hapticFeedback(){if(navigator.vibrate)try{navigator.vibrate(10)}catch(e){}}
/* 密码显示/隐藏切换 */
function togglePwdVisibility(inputId,btn){
  var input=document.getElementById(inputId);if(!input)return;
  var isPassword=input.type==='password';
  input.type=isPassword?'text':'password';
  btn.innerHTML=isPassword?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  btn.setAttribute('aria-label',isPassword?'隐藏密码':'显示密码');
}

/* === 竞赛指南页面 === */
function renderGuidePage(){
  var container=document.getElementById('main-content');
  if(!container)return;
  // 查找或创建 guide page
  var pageEl=document.getElementById('page-guide');
  if(!pageEl){
    pageEl=document.createElement('div');
    pageEl.id='page-guide';
    pageEl.className='page';
    container.appendChild(pageEl);
  }
  // 隐藏其他页面，显示 guide
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  pageEl.classList.add('active');
  pageEl.style.opacity='1';
  app.currentPage='guide';
  window.scrollTo({top:0,behavior:'smooth'});
  updateMobileNav('guide');

  var html='<div class="page-breadcrumb"><button onclick="navigate(\'home\')">首页</button><span class="bc-sep">/</span><span class="bc-current">竞赛指南</span></div>';
  html+='<div class="content-page"><h2 class="content-page-title"><span class="gold">竞赛指南</span></h2>';

  // 竞赛分类说明
  html+='<div class="knowledge-list">';
  html+='<div class="knowledge-card" style="border-left:3px solid #e74c3c">';
  html+='<h4>&#127942; 竞赛分类说明</h4>';
  html+='<div style="margin-top:10px">';
  html+='<div style="padding:10px;border-radius:8px;background:rgba(231,76,60,0.06);margin-bottom:8px"><strong style="color:#e74c3c">A类竞赛（最高级别）</strong><br/><span style="font-size:13px;color:var(--text-secondary)">学校给予最大力度支持的竞赛，如中国国际大学生创新大赛（互联网+）、挑战杯等。获奖在保研、评优中具有最高权重。</span></div>';
  html+='<div style="padding:10px;border-radius:8px;background:rgba(243,156,18,0.06);margin-bottom:8px"><strong style="color:#f39c12">B+类竞赛</strong><br/><span style="font-size:13px;color:var(--text-secondary)">学校重点支持的竞赛，如数学建模、电子设计竞赛、蓝桥杯、智能汽车竞赛等。获奖可获得较高保研加分。</span></div>';
  html+='<div style="padding:10px;border-radius:8px;background:rgba(52,152,219,0.06);margin-bottom:8px"><strong style="color:#3498db">B-类竞赛</strong><br/><span style="font-size:13px;color:var(--text-secondary)">学校一般支持的竞赛，如信息安全竞赛、ISCC、中国大学生计算机设计大赛等。</span></div>';
  html+='<div style="padding:10px;border-radius:8px;background:rgba(149,165,166,0.06)"><strong style="color:#95a5a6">C级竞赛</strong><br/><span style="font-size:13px;color:var(--text-secondary)">学校基础支持的竞赛，参与度高，适合入门练手。</span></div>';
  html+='</div></div>';

  // 校赛→省赛→国赛流程
  html+='<div class="knowledge-card" style="border-left:3px solid #2ecc71">';
  html+='<h4>&#127919; 校赛 &#8594; 省赛 &#8594; 国赛 流程</h4>';
  html+='<div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:50%;background:rgba(251,191,36,0.15);color:#d97706;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">1</div><div><strong>校赛阶段</strong><br/><span style="font-size:13px;color:var(--text-secondary)">各学院组织校内选拔赛，通过校赛的优秀选手/团队获得参加省赛的资格。关注学院官网通知，及时报名。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:50%;background:rgba(52,152,219,0.15);color:#3498db;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">2</div><div><strong>省赛阶段</strong><br/><span style="font-size:13px;color:var(--text-secondary)">省级竞赛由各省教育厅或相关学会组织，省赛获奖者可晋级国赛。部分竞赛省赛成绩直接影响保研加分。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:36px;height:36px;border-radius:50%;background:rgba(231,76,60,0.15);color:#e74c3c;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">3</div><div><strong>国赛阶段</strong><br/><span style="font-size:13px;color:var(--text-secondary)">国家级竞赛，含金量最高。国赛获奖在保研、评优、就业中具有极大优势。需要充分准备和团队配合。</span></div></div>';
  html+='</div></div>';

  // 报名流程步骤
  html+='<div class="knowledge-card" style="border-left:3px solid #9b59b6">';
  html+='<h4>&#128221; 报名流程步骤</h4>';
  html+='<div style="margin-top:10px;display:flex;flex-direction:column;gap:10px">';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:28px;height:28px;border-radius:50%;background:rgba(155,89,182,0.15);color:#9b59b6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">1</div><div><strong>了解竞赛信息</strong><br/><span style="font-size:13px;color:var(--text-secondary)">浏览竞赛大全，了解竞赛类别、级别、报名时间和比赛时间。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:28px;height:28px;border-radius:50%;background:rgba(155,89,182,0.15);color:#9b59b6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">2</div><div><strong>选择适合的竞赛</strong><br/><span style="font-size:13px;color:var(--text-secondary)">根据专业方向和兴趣选择竞赛，理工科推荐数学建模、电子设计等；经管类推荐挑战杯、三创赛等。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:28px;height:28px;border-radius:50%;background:rgba(155,89,182,0.15);color:#9b59b6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">3</div><div><strong>组建团队</strong><br/><span style="font-size:13px;color:var(--text-secondary)">大部分竞赛需要组队参加（3-5人），建议跨专业组队，发挥各自优势。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:28px;height:28px;border-radius:50%;background:rgba(155,89,182,0.15);color:#9b59b6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">4</div><div><strong>在线报名</strong><br/><span style="font-size:13px;color:var(--text-secondary)">通过竞赛助手平台在线报名，或前往竞赛官方网站完成报名。注意报名截止日期。</span></div></div>';
  html+='<div style="display:flex;align-items:flex-start;gap:12px"><div style="min-width:28px;height:28px;border-radius:50%;background:rgba(155,89,182,0.15);color:#9b59b6;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">5</div><div><strong>认真备赛</strong><br/><span style="font-size:13px;color:var(--text-secondary)">参加培训、刷历年真题、学习优秀作品，充分准备后参加比赛。</span></div></div>';
  html+='</div></div>';

  // 常见问题
  html+='<div class="knowledge-card" style="border-left:3px solid #f39c12">';
  html+='<h4>&#10067; 常见问题</h4>';
  html+='<div style="margin-top:10px">';
  html+='<div style="margin-bottom:12px"><strong style="color:var(--text-primary)">Q：参加竞赛对保研有帮助吗？</strong><br/><span style="font-size:13px;color:var(--text-secondary)">非常有帮助！A类和B+类竞赛获奖在保研综合测评中占较大比重，国家级奖项甚至可以加分。</span></div>';
  html+='<div style="margin-bottom:12px"><strong style="color:var(--text-primary)">Q：大一可以参加竞赛吗？</strong><br/><span style="font-size:13px;color:var(--text-secondary)">可以！很多竞赛对年级没有限制，如数学建模、英语竞赛等。建议大一先从基础竞赛开始。</span></div>';
  html+='<div style="margin-bottom:12px"><strong style="color:var(--text-primary)">Q：竞赛获奖有奖金吗？</strong><br/><span style="font-size:13px;color:var(--text-secondary)">部分竞赛设有奖金，同时学校也会对获奖学生给予奖励。具体政策请咨询所在学院。</span></div>';
  html+='<div style="margin-bottom:12px"><strong style="color:var(--text-primary)">Q：如何找到队友？</strong><br/><span style="font-size:13px;color:var(--text-secondary)">可以通过班级群、社团、学院通知等渠道寻找队友，也可以在相关竞赛的QQ群/微信群中组队。</span></div>';
  html+='<div><strong style="color:var(--text-primary)">Q：竞赛和学业冲突怎么办？</strong><br/><span style="font-size:13px;color:var(--text-secondary)">建议合理规划时间，选择1-2个重点竞赛深入准备，避免贪多嚼不烂。期中期末考试前适当减少备赛时间。</span></div>';
  html+='</div></div>';

  html+='</div>'; // knowledge-list
  html+='</div>'; // content-page
  pageEl.innerHTML=html;
}
