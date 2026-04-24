/* Extracted from app.js - Upgraded to MiniMax M2.7 SSE Streaming */

// MiniMax API 配置（API 密钥由服务端 Edge Function 管理，不暴露在前端）
var MINIMAX_MODEL = 'MiniMax-M2.7';

// Supabase 配置（与 competition-hub.js 共享，条件声明避免重复）
if(typeof HUB_URL === 'undefined') var HUB_URL = 'https://fdbbcibmqaogsbasoqly.supabase.co';
if(typeof HUB_HEADERS === 'undefined') var HUB_HEADERS = {
  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTc1NzUsImV4cCI6MjA5MjE5MzU3NX0.6vudhdijK3Dcy7aoM1qvGWbIJzE8aUVfTK7CdyrO3SM',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYmJjaWJtcWFvZ3NiYXNvcWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTc1NzUsImV4cCI6MjA5MjE5MzU3NX0.6vudhdijK3Dcy7aoM1qvGWbIJzE8aUVfTK7CdyrO3SM',
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// AI 对话数据库操作
var _aiConvId = null;
var _currentAIController = null;

async function aiGetOrCreateConversation() {
  if (_aiConvId) return _aiConvId;
  var user = getCurrentUser();
  var userId = user ? (user.user_id || user.id) : null;
  if (!userId) return null;
  try {
    var thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    var resp = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/ai_conversations?user_id=eq.' + userId + '&created_at=gte.' + thirtyMinAgo + '&select=conversation_id,created_at&order=created_at.desc&limit=1', { headers: HUB_GET_HEADERS });
    if (resp.ok) {
      var convs = await resp.json();
      if (convs && convs.length > 0) { _aiConvId = convs[0].conversation_id; return _aiConvId; }
    }
    var title = 'AI 对话 ' + new Date().toLocaleString('zh-CN');
    var createResp = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/ai_conversations', {
      method: 'POST', headers: HUB_HEADERS,
      body: JSON.stringify({ user_id: userId, title: title })
    });
    if (createResp.ok) {
      var created = await createResp.json();
      if (created && created[0]) { _aiConvId = created[0].conversation_id; return _aiConvId; }
    }
  } catch (e) { console.warn('[AI DB] 获取/创建会话失败:', e.message); }
  return null;
}

async function aiSaveMessageToDB(role, content, thinkingContent) {
  var convId = await aiGetOrCreateConversation();
  if (!convId) return;
  try {
    var msgData = { conversation_id: convId, role: role, content: content, model_name: MINIMAX_MODEL };
    if (thinkingContent) { msgData.is_deep_thinking = true; msgData.token_count = content.length + thinkingContent.length; }
    await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/ai_messages', { method: 'POST', headers: HUB_HEADERS, body: JSON.stringify(msgData) });
  } catch (e) { console.warn('[AI DB] 保存消息失败:', e.message); }
}

async function aiLoadHistoryFromDB() {
  var user = getCurrentUser();
  var userId = user ? (user.user_id || user.id) : null;
  if (!userId) return null;
  try {
    var convResp = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/ai_conversations?user_id=eq.' + userId + '&select=conversation_id,title&order=created_at.desc&limit=1', { headers: HUB_GET_HEADERS });
    if (!convResp.ok) return null;
    var convs = await convResp.json();
    if (!convs || convs.length === 0) return null;
    _aiConvId = convs[0].conversation_id;
    var msgResp = await fetch(HUB_URL + '/functions/v1/competition-api/rest/v1/ai_messages?conversation_id=eq.' + _aiConvId + '&select=role,content,is_deep_thinking,created_at&order=created_at.asc&limit=100', { headers: HUB_GET_HEADERS });
    if (!msgResp.ok) return null;
    var msgs = await msgResp.json();
    if (!msgs || msgs.length === 0) return null;
    return msgs.map(function(m) {
      var item = { role: m.role, content: m.content, time: m.created_at };
      if (m.is_deep_thinking) item.thinking = true;
      return item;
    });
  } catch (e) { console.warn('[AI DB] 加载历史失败:', e.message); return null; }
}

// API 配置（API_BASE 在 utils.js 中定义，自动适配部署环境）
var AI_API_BASE = API_BASE || '';

// 系统提示词
var AI_SYSTEM_PROMPT = '你是"竞赛助手"AI，专门服务长沙理工大学的学生。你的核心能力：\n\n1. 竞赛查询：根据学生的问题，从知识库中查找相关竞赛信息\n2. 报名指导：指导学生完成竞赛报名流程\n3. 竞赛推荐：根据学生需求推荐合适的竞赛\n4. 校园信息：回答关于长沙理工大学的问题\n\n## 严格规则\n- 所有回答必须基于事实，不得编造信息\n- 如果不确定，明确说"我不确定，建议查看官网确认"\n- 引用信息时标注来源\n- 使用简洁清晰的中文回答\n- 竞赛分类：A类（国家级顶级）、B+类、B-类、C类\n- 长沙理工大学2026年支持的A类竞赛：\n  1. 中国国际大学生创新大赛（原"互联网+"）\n  2. "挑战杯"中国大学生创业计划竞赛\n  3. "挑战杯"全国大学生课外学术科技作品竞赛';

// 深度模式状态
function isDeepMode(){return getLS('ai_deep_mode',false)}
function toggleDeepMode(){var current=isDeepMode();setLS('ai_deep_mode',!current);var toggle=document.getElementById('deepModeToggle');if(toggle)toggle.classList.toggle('active',!current);var label=document.getElementById('deepModeLabel');if(label)label.textContent=!current?'深度思考已开启':'深度思考';showCopyToast(!current?'深度思考模式已开启，回答更全面':'已切换为普通模式','success')}

function updateAIView(){var container=document.getElementById('aiChatContainer');var emptyState=document.getElementById('aiEmpty');var hasMessages=container&&container.children.length>0;if(hasMessages){emptyState.style.display='none';container.style.display='flex'}else{emptyState.style.display='flex';container.style.display='none'}// 更新 AI 页面登录状态 - MiniMax 直连模式始终为在线
var statusEl=document.getElementById('aiLoginStatus');if(statusEl){statusEl.innerHTML='<span style="color:#10b981">● 本地模式</span> · 知识库问答';statusEl.dataset.mode='online'}// 初始化深度模式开关状态
var deepToggle=document.getElementById('deepModeToggle');if(deepToggle)deepToggle.classList.toggle('active',isDeepMode());var deepLabel=document.getElementById('deepModeLabel');if(deepLabel)deepLabel.textContent=isDeepMode()?'深度思考已开启':'深度思考'}

// AI 上游不可用时，将状态从"在线模式"降级为"本地模式（AI暂不可用）"
function setAIStatusDegraded(reason){var statusEl=document.getElementById('aiLoginStatus');if(!statusEl)return;statusEl.innerHTML='<span style="color:#f59e0b">● 本地模式</span> · 在线 AI 暂不可用';statusEl.dataset.mode='degraded';console.warn('[AI Status] 降级为本地模式，原因：',reason||'未知')}

function addChatMessage(role,content,save,scrollToBottom){if(scrollToBottom===undefined)scrollToBottom=true;var container=document.getElementById('aiChatContainer');var emptyState=document.getElementById('aiEmpty');emptyState.style.display='none';container.style.display='flex';var msg=document.createElement('div');msg.className='msg '+(role==='assistant'?'msg-ai':'msg-user');var time=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});var formatted=esc(content).replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+)\.\s/gm,'<span style="display:inline-block;margin-left:1.2em;text-indent:-1.2em">$1. </span>').replace(/^- (.+)$/gm,'<span style="display:block;padding-left:1em;position:relative">• $1</span>');if(role==='assistant'){/* AI消息：左对齐气泡 + 头像 */msg.innerHTML='<div style="display:flex;align-items:flex-start;gap:10px"><div class="msg-avatar">AI</div><div style="flex:1;min-width:0"><div>'+formatted+'</div><div class="msg-time">'+time+'</div></div></div>'}else{/* 用户消息：右对齐金色气泡 */msg.innerHTML='<div>'+formatted+'</div><div class="msg-time" style="text-align:right">'+time+'</div>'}container.appendChild(msg);if(scrollToBottom){container.scrollTop=container.scrollHeight}if(save!==false){var _u=getCurrentUser();var _uid=_u?_u.id:'guest';var messages=getLS('ai_messages_'+_uid,[]);messages.push({role:role,content:content,time:new Date().toISOString()});if(messages.length>200)messages=messages.slice(-200);setLS('ai_messages_'+_uid,messages);aiSaveMessageToDB(role,content)}

function addTypingIndicator(){var container=document.getElementById('aiChatContainer');var wrapper=document.createElement('div');wrapper.id='aiTypingIndicator';wrapper.style.cssText='display:flex;align-items:flex-start;gap:10px;align-self:flex-start';wrapper.innerHTML='<div class="msg-avatar">AI</div><div class="ai-typing-indicator"><span></span><span></span><span></span></div>';container.appendChild(wrapper);container.scrollTop=container.scrollHeight}
function removeTypingIndicator(){var indicator=document.getElementById('aiTypingIndicator');if(indicator)indicator.remove()}
function quickAsk(question){if(_currentAIController){_currentAIController.abort();_currentAIController=null}document.getElementById('aiChatInput').value=question;sendAIChat()}

// 流式消息辅助函数 - 支持思考过程折叠显示
function addStreamingMessage(){var container=document.getElementById('aiChatContainer');var emptyState=document.getElementById('aiEmpty');emptyState.style.display='none';container.style.display='flex';var msg=document.createElement('div');msg.className='msg msg-ai';msg.id='streamingMsg';var time=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});msg.innerHTML='<div style="display:flex;align-items:flex-start;gap:10px"><div class="msg-avatar">AI</div><div style="flex:1;min-width:0"><div class="thinking-section" id="thinkingSection" style="display:none"><div class="thinking-toggle" onclick="toggleThinkingSection()"><span class="thinking-icon">&#128173;</span><span class="thinking-label">思考过程</span><svg class="thinking-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div><div class="thinking-content" id="thinkingContent"></div></div><div class="streaming-content"></div><div class="msg-time">'+time+'</div></div></div>';container.appendChild(msg);container.scrollTop=container.scrollHeight;return msg}

function appendToStreamingMessage(msgEl,content){var contentEl=msgEl.querySelector('.streaming-content');if(contentEl){contentEl.innerHTML+=esc(content).replace(/\n/g,'<br/>');var container=document.getElementById('aiChatContainer');container.scrollTop=container.scrollHeight}}

function appendToThinkingSection(msgEl,content){var section=msgEl.querySelector('#thinkingSection');var contentEl=msgEl.querySelector('#thinkingContent');if(section&&contentEl){section.style.display='block';contentEl.textContent+=content;var container=document.getElementById('aiChatContainer');container.scrollTop=container.scrollHeight}}

function toggleThinkingSection(){var content=document.getElementById('thinkingContent');var arrow=document.querySelector('.thinking-arrow');if(content){var isHidden=content.style.display==='none'||!content.style.display;content.style.display=isHidden?'block':'none';if(arrow)arrow.style.transform=isHidden?'rotate(180deg)':'rotate(0deg)'}}

function finishStreamingMessage(msgEl,question){var contentEl=msgEl.querySelector('.streaming-content');if(contentEl){var finalContent=contentEl.textContent;msgEl.classList.remove('streaming');// 移除流式光标
var thinkingContent=msgEl.querySelector('#thinkingContent');var thinkingText=thinkingContent?thinkingContent.textContent:'';// 保存到历史
var _fu=getCurrentUser();var _fuid=_fu?_fu.id:'guest';var messages=getLS('ai_messages_'+_fuid,[]);messages.push({role:'assistant',content:finalContent,time:new Date().toISOString(),thinking:thinkingText||undefined});if(messages.length>200)messages=messages.slice(-200);setLS('ai_messages_'+_fuid,messages);aiSaveMessageToDB('assistant',finalContent,thinkingText||undefined)}var container=document.getElementById('aiChatContainer');if(container){container.scrollTop=container.scrollHeight}}

// 加载聊天历史（不自动滚动到底部，保留用户当前滚动位置）
var _loadChatHistoryRunning = false;
function loadChatHistory(){var container=document.getElementById('aiChatContainer');if(!container)return;var _u=getCurrentUser();var _uid=_u?_u.id:'guest';// 尝试从数据库加载（异步，不阻塞渲染）
aiLoadHistoryFromDB().then(function(dbMessages){if(dbMessages&&dbMessages.length>0&&!_loadChatHistoryRunning){_loadChatHistoryRunning=true;setLS('ai_messages_'+_uid,dbMessages);loadChatHistory();_loadChatHistoryRunning=false;}}).catch(function(){});var messages=getLS('ai_messages_'+_uid,[]);if(!messages||messages.length===0)return;var savedScrollTop=container.scrollTop;var savedScrollHeight=container.scrollHeight;container.innerHTML='';for(var i=0;i<messages.length;i++){var m=messages[i];if(!m.role||!m.content)continue;var msg=document.createElement('div');msg.className='msg '+(m.role==='assistant'?'msg-ai':'msg-user');var msgTime=m.time?new Date(m.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});var formatted=esc(m.content).replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+)\.\s/gm,'<span style="display:inline-block;margin-left:1.2em;text-indent:-1.2em">$1. </span>').replace(/^- (.+)$/gm,'<span style="display:block;padding-left:1em;position:relative">• $1</span>');if(m.role==='assistant'){var thinkingHtml='';if(m.thinking){thinkingHtml='<div class="thinking-section" id="thinkingSection" style="display:none"><div class="thinking-toggle" onclick="toggleThinkingSection()"><span class="thinking-icon">&#128173;</span><span class="thinking-label">思考过程</span><svg class="thinking-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div><div class="thinking-content" id="thinkingContent">'+esc(m.thinking)+'</div></div>'}msg.innerHTML='<div style="display:flex;align-items:flex-start;gap:10px"><div class="msg-avatar">AI</div><div style="flex:1;min-width:0"><div>'+formatted+'</div>'+thinkingHtml+'<div class="msg-time">'+msgTime+'</div></div></div>'}else{msg.innerHTML='<div>'+formatted+'</div><div class="msg-time" style="text-align:right">'+msgTime+'</div>'}container.appendChild(msg)}container.scrollTop=savedScrollTop+(container.scrollHeight-savedScrollHeight);updateAIView()}

// 本地知识库模式（不依赖外部API，完全本地运行）
async function sendToMiniMax(messages, onChunk, onThinking, onDone, onError, deepMode, externalSignal) {
  try {
    // Extract the last user message
    var lastMsg = '';
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastMsg = messages[i].content;
        break;
      }
    }

    // Simulate thinking phase
    if (deepMode) {
      var thinkingText = '正在分析问题...\n正在检索知识库...\n正在组织回答...';
      var chars = thinkingText.split('');
      for (var t = 0; t < chars.length; t++) {
        if (externalSignal && externalSignal.aborted) { onError('timeout'); return; }
        onThinking(chars[t]);
        await new Promise(function(r) { setTimeout(r, 30); });
      }
      await new Promise(function(r) { setTimeout(r, 500); });
    }

    // Get response from local knowledge base
    var response = searchKnowledgeBase(lastMsg);

    // Simulate streaming (typewriter effect)
    var responseChars = response.split('');
    for (var j = 0; j < responseChars.length; j++) {
      if (externalSignal && externalSignal.aborted) { onError('timeout'); return; }
      onChunk(responseChars[j]);
      await new Promise(function(r) { setTimeout(r, 15); });
    }

    onDone();
  } catch (e) {
    onError('network_error');
  }
}

// 主发送函数
async function sendAIChat(){
  var input=document.getElementById('aiChatInput');
  if(!input||!input.value.trim()){showCopyToast('请输入问题','warning');return;}
  if(input.value.length>2000){showCopyToast('输入内容不能超过2000字','warning');return}
  if(document.getElementById('aiTypingIndicator')||document.getElementById('streamingMsg'))return;

  // Abort any previous SSE stream
  if(_currentAIController){_currentAIController.abort();_currentAIController=null}
  _currentAIController=new AbortController();

  var question=input.value.trim();
  input.value='';
  input.style.height='auto';
  addChatMessage('user',question);
  addTypingIndicator();

  // 获取历史消息（最近 10 条，即 5 轮对话）
  var _hu=getCurrentUser();
  var _huid=_hu?_hu.id:'guest';
  var history=getLS('ai_messages_'+_huid,[]).slice(-10).map(function(m){return{role:m.role,content:m.content}});

  // 构建消息列表
  var messages=[{role:'system',content:AI_SYSTEM_PROMPT}].concat(history);
  messages.push({role:'user',content:question});

  var deepMode=isDeepMode();

  // 定义回调
  function onChunk(text){
    removeTypingIndicator();
    if(!document.getElementById('streamingMsg')){
      addStreamingMessage();
    }
    var msgEl=document.getElementById('streamingMsg');
    appendToStreamingMessage(msgEl,text);
  }

  function onThinking(text){
    removeTypingIndicator();
    if(!document.getElementById('streamingMsg')){
      addStreamingMessage();
    }
    var msgEl=document.getElementById('streamingMsg');
    appendToThinkingSection(msgEl,text);
  }

  function onDone(){
    removeTypingIndicator();
    _currentAIController=null;
    var msgEl=document.getElementById('streamingMsg');
    if(msgEl){
      finishStreamingMessage(msgEl,question);
      msgEl.removeAttribute('id');
    }
  }

  function onError(errorType){
    removeTypingIndicator();
    _currentAIController=null;
    var streamingMsg=document.getElementById('streamingMsg');
    if(streamingMsg)streamingMsg.remove();

    switch(errorType){
      case 'rate_limit':
        addChatMessage('assistant','请求过于频繁，请稍后再试。');
        break;
      case 'timeout':
        addChatMessage('assistant','请求超时，请稍后再试。');
        break;
      case 'input_sensitive':
        addChatMessage('assistant','该问题无法回答，请更换提问方式。');
        break;
      case 'output_sensitive':
        addChatMessage('assistant','该问题无法回答。');
        break;
      case 'auth_error':
        setAIStatusDegraded('API认证失败');
        addChatMessage('assistant','网络连接失败，已切换到本地模式。\n\n'+searchKnowledgeBase(question));
        break;
      case 'http_error':
      case 'network_error':
      default:
        setAIStatusDegraded(errorType);
        addChatMessage('assistant','网络连接失败，已切换到本地模式。\n\n'+searchKnowledgeBase(question));
        break;
    }
  }

  // 调用 MiniMax API
  await sendToMiniMax(messages, onChunk, onThinking, onDone, onError, deepMode, _currentAIController.signal);
}

function clearAIChat(){document.getElementById('aiChatContainer').innerHTML='';var _cu=getCurrentUser();var _cuid=_cu?_cu.id:'guest';setLS('ai_messages_'+_cuid,[]);_aiConvId=null;updateAIView();showCopyToast('对话已清空')}

function searchKnowledgeBase(query){var q=query.toLowerCase();var results=[];CSUST_DATA.colleges.forEach(function(col){var colMatch=col.name.toLowerCase().indexOf(q)>=0;var majorMatch=false;col.majors.forEach(function(m){if(typeof m==='object'){if(m.name.toLowerCase().indexOf(q)>=0)majorMatch=true;if(m.intro&&m.intro.toLowerCase().indexOf(q)>=0)majorMatch=true;if(m.career&&m.career.some(function(c){return c.toLowerCase().indexOf(q)>=0}))majorMatch=true;if(m.courses&&m.courses.some(function(c){return c.toLowerCase().indexOf(q)>=0}))majorMatch=true}else{if(m.toLowerCase().indexOf(q)>=0)majorMatch=true}});if(colMatch||majorMatch){var names=col.majors.map(function(m){return typeof m==='object'?m.name:m});results.push('【'+col.name+'】包含专业：'+names.join('、'))}});if(q.indexOf('校训')>=0||q.indexOf('motto')>=0)results.push('校训：博学、力行、守正、拓新');if(q.indexOf('代码')>=0||q.indexOf('code')>=0)results.push('学校代码：10536');if(q.indexOf('校区')>=0||q.indexOf('地址')>=0){CSUST_DATA.campuses.forEach(function(c){results.push('【'+c.name+'】'+c.address+'（'+c.type+'）')})}if(q.indexOf('云塘')>=0){var c=CSUST_DATA.campuses[0];results.push('云塘校区：'+c.address+'。公交：'+c.bus.join('、')+'。'+c.desc)}if(q.indexOf('金盆岭')>=0){var c2=CSUST_DATA.campuses[1];results.push('金盆岭校区：'+c2.address+'。公交：'+c2.bus.join('、')+'。地铁：'+c2.subway+'。'+c2.desc)}if(q.indexOf('图书馆')>=0){results.push('图书馆开放时间：'+CSUST_DATA.library.hours+'。'+CSUST_DATA.library.desc+'馆藏：'+CSUST_DATA.library.collections+'。座位：'+CSUST_DATA.library.seats+'。')}if(q.indexOf('宿舍')>=0||q.indexOf('住宿')>=0){results.push('宿舍类型：'+CSUST_DATA.dormitory.type+'。设施：'+CSUST_DATA.dormitory.facilities+'。网络：'+CSUST_DATA.dormitory.internet+'。'+CSUST_DATA.dormitory.desc)}if(q.indexOf('食堂')>=0){CSUST_DATA.canteens.forEach(function(c){results.push('【'+c.name+'】'+c.desc)})}if(q.indexOf('学费')>=0||q.indexOf('费用')>=0){var tuitionInfo='学费标准：';Object.keys(CSUST_DATA.tuition).forEach(function(k){tuitionInfo+=k+' '+CSUST_DATA.tuition[k]+'；'});results.push(tuitionInfo)}if(q.indexOf('电话')>=0||q.indexOf('联系')>=0){results.push('招生电话：'+CSUST_DATA.contact.admission_phone);results.push('招生邮箱：'+CSUST_DATA.contact.admission_email);results.push('官网：'+CSUST_DATA.contact.website)}if(q.indexOf('奖学金')>=0||q.indexOf('奖助')>=0){results.push('学校设有国家奖学金（8000元/年）、国家励志奖学金（5000元/年）、校级奖学金等多种奖助学金。具体请咨询学生工作处。')}if(q.indexOf('社团')>=0||q.indexOf('学生组织')>=0){results.push('学校有众多学生社团和组织，包括学术科技类、文化艺术类、体育竞技类、公益服务类等。具体信息请关注校团委公告。')}if(q.indexOf('交通')>=0||q.indexOf('公交')>=0||q.indexOf('地铁')>=0){CSUST_DATA.campuses.forEach(function(c){results.push('【'+c.name+'】公交：'+c.bus.join('、')+(c.subway?'。地铁：'+c.subway:''))})}if(q.indexOf('新生')>=0||q.indexOf('入学')>=0){results.push('新生入学须知：1. 按录取通知书规定时间报到；2. 携带录取通知书、身份证、高考准考证、户口迁移证（自愿）；3. 准备一寸和两寸证件照；4. 学费可通过银行代扣或现场缴纳；5. 到校后按指引办理入住手续。')}if(q.indexOf('a类')>=0||q.indexOf('互联网')>=0||q.indexOf('挑战杯')>=0||q.indexOf('创新大赛')>=0){results.push('长沙理工大学2026年支持的A类竞赛：');results.push('1. 中国国际大学生创新大赛（原"互联网+"）');results.push('2. "挑战杯"中国大学生创业计划竞赛');results.push('3. "挑战杯"全国大学生课外学术科技作品竞赛');results.push('A类竞赛为国家级顶级赛事，学校高度重视，获奖可获保研加分。')}if(q.indexOf('竞赛')>=0||q.indexOf('比赛')>=0||q.indexOf('参赛')>=0){results.push('学校支持的竞赛分为A类（国家级顶级）、B+类、B-类、C类。');results.push('A类竞赛包括：中国国际大学生创新大赛、"挑战杯"系列竞赛等。');results.push('建议关注学校教务处和创新创业学院的竞赛通知。')}// 土木工程相关
if(q.indexOf('土木')>=0||q.indexOf('结构')>=0||q.indexOf('桥梁')>=0||q.indexOf('建筑')>=0){
  results.push('土木与环境工程学院是长沙理工大学重点学院之一。');
  results.push('相关竞赛推荐：');
  results.push('1. 全国大学生结构设计竞赛 - 土木领域最高水平赛事，我校多次获奖');
  results.push('2. 全国大学生测绘学科创新创业智能大赛 - 测绘技能综合竞赛');
  results.push('3. BIM技术应用竞赛 - 建筑信息模型设计与建模');
  results.push('4. 全国大学生工程力学竞赛 - 力学理论与应用');
  results.push('5. 混凝土材料设计大赛 - 混凝土配合比设计与实践');
  results.push('备赛建议：注重力学基础、CAD/BIM技能、团队协作能力');
}
// 竞赛报名流程
if(q.indexOf('报名')>=0||q.indexOf('怎么参加')>=0||q.indexOf('如何参加')>=0){
  results.push('竞赛报名流程：');
  results.push('1. 关注教务处竞赛通知 https://www.csust.edu.cn/jwc/cxjy_/xkjs.htm');
  results.push('2. 按通知要求在规定时间内提交报名材料');
  results.push('3. 部分竞赛需要通过学院推荐');
  results.push('4. 校内选拔赛后择优推荐参加省赛/国赛');
  results.push('建议：提前组队（通常3-5人），了解竞赛规则，准备相关材料');
}
// 保研加分
if(q.indexOf('保研')>=0||q.indexOf('推免')>=0||q.indexOf('加分')>=0){
  results.push('竞赛获奖与保研加分政策：');
  results.push('A类竞赛国家级一等奖可获得较高保研加分');
  results.push('具体加分标准以学校当年文件为准，建议咨询教务处');
  results.push('A类竞赛包括：互联网+、挑战杯等');
}
if(results.length===0){results.push('抱歉，我在本地知识库中没有找到相关信息。建议你：');results.push('1. 查看学校官网 https://www.csust.edu.cn');results.push('2. 咨询学校教务处或相关部门');results.push('3. 尝试换一个关键词提问')}return results.join('\n\n')}
}
