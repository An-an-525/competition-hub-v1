// StartupDNA Backend Server
// Node.js + Express + SQLite + JWT + Multi-AI Provider

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'startupdna_secret_key_2024_change_me';

// ========== Rate Limiters ==========
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: '登录请求过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: '注册请求过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiChatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: { error: 'AI请求过于频繁，请5分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// ========== AI Provider Configuration ==========
// Supports: minimax, openai, deepseek, zhipu, mock (simulation mode)
const AI_PROVIDER = (process.env.AI_PROVIDER || 'mock').toLowerCase();
const AI_CONFIGS = {
  minimax: {
    apiKey: process.env.MINIMAX_API_KEY || '',
    endpoint: process.env.MINIMAX_ENDPOINT || 'https://api.minimaxi.com/v1/text/chatcompletion_v2',
    model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
    buildBody: (msgs, opts) => ({
      model: opts.model,
      messages: msgs,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens || 8000
    }),
    // MiniMax M2.7 is a reasoning model - content may be empty, check reasoning_content
    parseResponse: (data) => {
      const msg = data.choices?.[0]?.message;
      if (!msg) return '';
      // Priority 1: actual content
      if (msg.content && msg.content.trim()) return msg.content.trim();
      // Priority 2: reasoning_content (model spent all tokens on reasoning)
      if (msg.reasoning_content && msg.reasoning_content.trim()) {
        // Try to extract JSON from reasoning content
        const jsonMatch = msg.reasoning_content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return jsonMatch[0];
        return msg.reasoning_content.trim();
      }
      return '';
    },
    parseError: (data) => data.base_resp?.status_msg || 'AI服务暂时不可用'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    endpoint: process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    buildBody: (msgs, opts) => ({
      model: opts.model,
      messages: msgs,
      temperature: opts.temperature || 0.7,
      max_tokens: opts.maxTokens || 4000
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseError: (data) => data.error?.message || 'AI服务暂时不可用'
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    endpoint: process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    buildBody: (msgs, opts) => ({
      model: opts.model,
      messages: msgs,
      temperature: opts.temperature || 0.7,
      max_tokens: opts.maxTokens || 4000
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseError: (data) => data.error?.message || 'AI服务暂时不可用'
  },
  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY || '',
    endpoint: process.env.ZHIPU_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: process.env.ZHIPU_MODEL || 'glm-4-flash',
    buildBody: (msgs, opts) => ({
      model: opts.model,
      messages: msgs,
      temperature: opts.temperature || 0.7,
      max_tokens: opts.maxTokens || 4000
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content || '',
    parseError: (data) => data.error?.message || 'AI服务暂时不可用'
  }
};

// ========== Mock AI - Smart Simulation ==========
function mockAIResponse(systemPrompt, userMessage) {
  const msg = userMessage.toLowerCase();
  
  // Detect analysis type from system prompt
  if (systemPrompt?.includes('SWOT') || msg.includes('swot')) {
    return JSON.stringify({
      strengths: ["团队技术能力强", "目标市场明确", "产品有差异化"],
      weaknesses: ["资金有限", "市场经验不足", "品牌知名度低"],
      opportunities: ["行业增长迅速", "政策支持", "技术趋势利好"],
      threats: ["竞争激烈", "技术迭代快", "经济不确定性"]
    });
  }
  
  if (systemPrompt?.includes('精益画布') || msg.includes('画布') || msg.includes('canvas')) {
    return JSON.stringify({
      problem: "目标用户在现有解决方案中面临效率低、成本高、体验差三大痛点",
      solution: "通过AI驱动的智能化平台，提供一站式解决方案，降低使用门槛",
      uniqueValueProposition: "用AI重新定义创业工具，让每个人都能轻松启动和运营项目",
      unfairAdvantage: "独家算法引擎 + 深度行业数据积累",
      customerSegments: "18-35岁创业者、小型创业团队、高校创业项目",
      keyMetrics: "月活用户数、用户留存率、NPS评分、付费转化率",
      channels: "社交媒体营销、内容营销、合作伙伴推荐、线下活动",
      revenueStreams: "SaaS订阅、增值服务、数据分析报告",
      costStructure: "研发人力、服务器成本、市场推广、运营维护"
    });
  }
  
  if (systemPrompt?.includes('辩论') || msg.includes('辩论') || msg.includes('debate')) {
    return JSON.stringify({
      for: { title: "支持观点", points: ["市场需求真实存在", "技术方案可行", "团队执行力强", "商业模式清晰"] },
      against: { title: "反对观点", points: ["竞争壁垒不够高", "盈利周期可能较长", "用户获取成本高", "监管风险存在"] },
      conclusion: "综合来看，项目具备良好的基础条件，建议重点关注竞争壁垒建设和用户留存策略。"
    });
  }
  
  if (systemPrompt?.includes('评分') || msg.includes('评分') || msg.includes('scor')) {
    return JSON.stringify({
      market: { score: 4, reason: "目标市场规模可观，增长趋势明显" },
      team: { score: 3.5, reason: "核心团队能力互补，但缺少市场运营人才" },
      product: { score: 4, reason: "产品方案创新，技术实现路径清晰" },
      business: { score: 3, reason: "商业模式需要验证，收入来源较为单一" },
      competition: { score: 3.5, reason: "有一定差异化，但需加强护城河" },
      risk: { score: 3, reason: "存在技术和市场风险，需要做好预案" }
    });
  }
  
  if (systemPrompt?.includes('行动') || msg.includes('行动') || msg.includes('action')) {
    return JSON.stringify({
      immediate: ["完成产品原型设计", "进行10次用户深度访谈", "注册公司并办理相关资质"],
      shortTerm: ["开发MVP版本", "建立社交媒体账号", "寻找首批种子用户"],
      mediumTerm: ["产品公测", "建立合作伙伴关系", "申请创业扶持资金"],
      longTerm: ["规模化推广", "建立品牌影响力", "探索海外市场"]
    });
  }
  
  if (systemPrompt?.includes('市场研究') || msg.includes('市场') || msg.includes('research')) {
    return JSON.stringify({
      marketSize: "中国创业服务市场规模约500亿元，年增长率15%",
      targetUsers: "主要面向18-35岁的早期创业者和小型创业团队",
      competitors: ["创客贴", "石墨文档", "飞书", "Notion中国版"],
      trends: ["AI工具普及", "远程协作常态化", "低代码平台兴起", "创业教育下沉"]
    });
  }
  
  // Default: general conversational response
  const responses = [
    `关于"${userMessage.substring(0, 30)}"的分析：\n\n这是一个值得深入探讨的方向。从创业角度来看，建议从以下几个维度思考：\n\n1. **市场需求验证**：通过用户访谈和问卷调查，确认目标用户的真实痛点\n2. **最小可行产品(MVP)**：快速构建核心功能，用最低成本验证假设\n3. **商业模式画布**：梳理价值主张、客户细分、收入来源等关键要素\n4. **竞争分析**：研究现有解决方案的优劣势，找到差异化定位\n\n建议先从用户调研开始，用精益创业的方法论指导每一步决策。`,
    `很好的问题！让我从创业实践的角度来分析：\n\n**核心建议：**\n- 采用"构建-测量-学习"的迭代循环\n- 重点关注用户留存而非单纯获取\n- 建立数据驱动的决策机制\n\n**关键指标：**\n- 用户活跃度(DAU/MAU)\n- 客户获取成本(CAC)\n- 生命周期价值(LTV)\n- 净推荐值(NPS)\n\n**下一步行动：**\n1. 明确你的核心假设\n2. 设计验证实验\n3. 设定成功标准\n4. 快速执行并迭代`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ========== AI Call Function ==========
async function callAIProvider(systemPrompt, userMessage, options = {}) {
  if (AI_PROVIDER === 'mock') {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    return { content: mockAIResponse(systemPrompt, userMessage), provider: 'mock' };
  }

  const config = AI_CONFIGS[AI_PROVIDER];
  if (!config) throw new Error(`不支持的AI提供商: ${AI_PROVIDER}`);
  if (!config.apiKey) throw new Error(`${AI_PROVIDER} API密钥未配置，请在.env中设置`);

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: userMessage });

  const body = config.buildBody(messages, {
    model: config.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens
  });

  console.log(`[AI:${AI_PROVIDER}] Request: ${userMessage.substring(0, 60)}...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  let resp;
  try {
    resp = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      console.error(`[AI:${AI_PROVIDER}] Request timed out after 60s`);
      throw new Error('AI请求超时，请稍后重试或缩短问题内容');
    }
    throw fetchError;
  }
  clearTimeout(timeoutId);

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    const errMsg = config.parseError(errData);
    console.error(`[AI:${AI_PROVIDER}] Error ${resp.status}:`, errMsg);
    throw new Error(errMsg);
  }

  const data = await resp.json();
  const content = config.parseResponse(data);
  
  if (!content) {
    console.warn(`[AI:${AI_PROVIDER}] Empty response, falling back to mock`);
    return { content: mockAIResponse(systemPrompt, userMessage), provider: 'mock-fallback' };
  }

  return { content, provider: AI_PROVIDER };
}

// ========== Database Setup ==========
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'startupdna.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT UNIQUE NOT NULL,
    email TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invite_codes (
    code TEXT PRIMARY KEY,
    used_by INTEGER DEFAULT NULL,
    used_at DATETIME DEFAULT NULL,
    FOREIGN KEY (used_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_type TEXT NOT NULL DEFAULT 'full',
    answers TEXT DEFAULT '{}',
    scores TEXT DEFAULT '{}',
    personality_type TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    stage TEXT DEFAULT 'idea',
    content TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS challenge_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_date TEXT NOT NULL,
    answer TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS scorer_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scores TEXT DEFAULT '{}',
    total_score REAL DEFAULT 0,
    verdict TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    analysis_type TEXT NOT NULL,
    input_data TEXT DEFAULT '{}',
    result_data TEXT DEFAULT '{}',
    provider TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Create indexes for performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
  CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id);
  CREATE INDEX IF NOT EXISTS idx_challenge_records_user_date ON challenge_records(user_id, challenge_date);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_scorer_records_user ON scorer_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_analyses_user ON ai_analyses(user_id);
`);

// Seed invite codes
const seedCodes = db.prepare('SELECT COUNT(*) as cnt FROM invite_codes').get();
if (seedCodes.cnt === 0) {
  const insertCode = db.prepare('INSERT OR IGNORE INTO invite_codes (code) VALUES (?)');
  const insertMany = db.transaction((codes) => {
    for (const code of codes) insertCode.run(code);
  });
  const codes = [];
  for (let i = 0; i <= 495; i += 5) {
    codes.push('an' + String(i).padStart(3, '0'));
  }
  insertMany(codes);
  console.log(`[DB] Seeded ${codes.length} invite codes`);
}

// ========== Middleware ==========
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files from workspace
const frontendPath = '/workspace';
if (fs.existsSync(path.join(frontendPath, 'startupdna-optimized.html'))) {
  app.use(express.static(frontendPath, { maxAge: 0, etag: false }));
  console.log(`[Static] Serving frontend from ${frontendPath}`);
}

// JWT Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未登录，请先登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.nickname = decoded.nickname;
    next();
  } catch (e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.nickname = decoded.nickname;
    } catch (e) { /* ignore */ }
  }
  next();
}

// ========== Auth Routes ==========
app.post('/api/auth/register', registerLimiter, (req, res) => {
  try {
    const { nickname, password, email, inviteCode } = req.body;
    if (!nickname || !password) return res.status(400).json({ error: '请填写昵称和密码' });
    if (typeof nickname !== 'string' || nickname.length < 2 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度需为2-20个字符' });
    }
    if (typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ error: '密码长度不能超过128个字符' });
    }
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    if (!inviteCode) return res.status(400).json({ error: '请输入内测码' });
    if (!/^[a-zA-Z]{3}\d{3}$/.test(inviteCode)) {
      return res.status(400).json({ error: '内测码格式不正确，应为3位字母+3位数字' });
    }

    const codeRow = db.prepare('SELECT * FROM invite_codes WHERE code = ?').get(inviteCode.toLowerCase());
    if (!codeRow) return res.status(400).json({ error: '内测码无效' });
    if (codeRow.used_by) return res.status(400).json({ error: '该内测码已被使用' });

    const existing = db.prepare('SELECT id FROM users WHERE nickname = ?').get(nickname);
    if (existing) return res.status(400).json({ error: '昵称已被注册' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (nickname, email, password_hash) VALUES (?, ?, ?)').run(nickname, email || '', hash);
    db.prepare('UPDATE invite_codes SET used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?').run(result.lastInsertRowid, inviteCode.toLowerCase());

    const token = jwt.sign({ userId: result.lastInsertRowid, nickname }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { id: result.lastInsertRowid, nickname, email: email || '' } });
  } catch (e) {
    console.error('[Register Error]', e);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname || !password) return res.status(400).json({ error: '请填写昵称和密码' });

    const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
    if (!user) return res.status(400).json({ error: '用户不存在，请先注册' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(400).json({ error: '密码错误' });

    const token = jwt.sign({ userId: user.id, nickname: user.nickname }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true, token,
      user: { id: user.id, nickname: user.nickname, email: user.email, avatar: user.avatar, bio: user.bio }
    });
  } catch (e) {
    console.error('[Login Error]', e);
    res.status(500).json({ error: '登录失败' });
  }
});

app.post('/api/auth/reset-password', authMiddleware, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写原密码和新密码' });
    if (newPassword.length < 6) return res.status(400).json({ error: '新密码至少6位' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) return res.status(400).json({ error: '原密码错误' });

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.userId);
    res.json({ success: true, message: '密码修改成功' });
  } catch (e) {
    res.status(500).json({ error: '密码修改失败' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, nickname, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const { email, avatar, bio } = req.body;
    db.prepare('UPDATE users SET email = COALESCE(?, email), avatar = COALESCE(?, avatar), bio = COALESCE(?, bio), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(email || null, avatar || null, bio || null, req.userId);
    const user = db.prepare('SELECT id, nickname, email, avatar, bio FROM users WHERE id = ?').get(req.userId);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: '更新失败' });
  }
});

// ========== AI Proxy Route ==========
app.post('/api/ai/chat', optionalAuth, aiChatLimiter, async (req, res) => {
  try {
    const { systemPrompt, userMessage, temperature, maxTokens } = req.body;
    if (!userMessage) return res.status(400).json({ error: '请输入消息内容' });

    // 参数范围限制
    const safeMaxTokens = Math.min(Number(maxTokens) || 4000, 8000);
    const safeTemperature = Math.max(0, Math.min(Number(temperature) ?? 0.7, 1));
    const safeUserMessage = String(userMessage).substring(0, 5000);
    const safeSystemPrompt = systemPrompt ? String(systemPrompt).substring(0, 10000) : '';

    const result = await callAIProvider(safeSystemPrompt, safeUserMessage, { temperature: safeTemperature, maxTokens: safeMaxTokens });

    // Save analysis record (only for logged-in users)
    if (req.userId) {
      db.prepare('INSERT INTO ai_analyses (user_id, analysis_type, input_data, result_data, provider) VALUES (?, ?, ?, ?, ?)')
        .run(req.userId, 'chat', JSON.stringify({ userMessage: userMessage.substring(0, 500) }), JSON.stringify({ content: result.content.substring(0, 2000) }), result.provider);
    }

    res.json(result);
  } catch (e) {
    console.error('[AI] Error:', e);
    res.status(500).json({ error: 'AI请求失败，请稍后重试' });
  }
});

// ========== Test Routes ==========
app.post('/api/test/save', authMiddleware, (req, res) => {
  try {
    const { testType, answers, scores, personalityType } = req.body;
    const result = db.prepare(
      'INSERT INTO test_results (user_id, test_type, answers, scores, personality_type) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, testType || 'full', JSON.stringify(answers || {}), JSON.stringify(scores || {}), personalityType || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

app.get('/api/test/results', authMiddleware, (req, res) => {
  const results = db.prepare('SELECT * FROM test_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.userId);
  results.forEach(r => { r.answers = JSON.parse(r.answers); r.scores = JSON.parse(r.scores); });
  res.json({ results });
});

// ========== Ideas Routes ==========
app.post('/api/ideas', authMiddleware, (req, res) => {
  try {
    const { title, description, category, stage, content } = req.body;
    if (!title) return res.status(400).json({ error: '请输入创意标题' });
    const result = db.prepare(
      'INSERT INTO ideas (user_id, title, description, category, stage, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.userId, title, description || '', category || '', stage || 'idea', JSON.stringify(content || {}));
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: '创建失败' });
  }
});

app.get('/api/ideas', authMiddleware, (req, res) => {
  const ideas = db.prepare('SELECT * FROM ideas WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId);
  ideas.forEach(i => { i.content = JSON.parse(i.content); });
  res.json({ ideas });
});

app.put('/api/ideas/:id', authMiddleware, (req, res) => {
  try {
    const { title, description, category, stage, content } = req.body;
    db.prepare(
      'UPDATE ideas SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), stage = COALESCE(?, stage), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).run(title || null, description || null, category || null, stage || null, content ? JSON.stringify(content) : null, req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '更新失败' });
  }
});

app.delete('/api/ideas/:id', authMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM ideas WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: '创意不存在或无权删除' });
  res.json({ success: true });
});

// ========== Challenge Routes ==========
app.post('/api/challenge/save', authMiddleware, (req, res) => {
  try {
    const { challengeDate, answer, wordCount, timeSpent } = req.body;
    if (!challengeDate) return res.status(400).json({ error: '缺少日期' });
    const existing = db.prepare('SELECT id FROM challenge_records WHERE user_id = ? AND challenge_date = ?').get(req.userId, challengeDate);
    if (existing) {
      db.prepare('UPDATE challenge_records SET answer = ?, word_count = ?, time_spent = ? WHERE id = ?')
        .run(answer || '', wordCount || 0, timeSpent || 0, existing.id);
    } else {
      db.prepare('INSERT INTO challenge_records (user_id, challenge_date, answer, word_count, time_spent) VALUES (?, ?, ?, ?, ?)')
        .run(req.userId, challengeDate, answer || '', wordCount || 0, timeSpent || 0);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

app.get('/api/challenge/records', authMiddleware, (req, res) => {
  const records = db.prepare('SELECT * FROM challenge_records WHERE user_id = ? ORDER BY challenge_date DESC LIMIT 100').all(req.userId);
  res.json({ records });
});

// ========== Favorites Routes ==========
app.post('/api/favorites', authMiddleware, (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) return res.status(400).json({ error: '参数不完整' });
    db.prepare('INSERT OR IGNORE INTO favorites (user_id, item_type, item_id) VALUES (?, ?, ?)').run(req.userId, itemType, itemId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '收藏失败' });
  }
});

app.delete('/api/favorites', authMiddleware, (req, res) => {
  const { itemType, itemId } = req.body;
  const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?').run(req.userId, itemType, itemId);
  if (result.changes === 0) return res.status(404).json({ error: '收藏不存在或已取消' });
  res.json({ success: true });
});

app.get('/api/favorites', authMiddleware, (req, res) => {
  const favs = db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json({ favorites: favs });
});

// ========== Scorer Routes ==========
app.post('/api/scorer/save', authMiddleware, (req, res) => {
  try {
    const { scores, totalScore, verdict } = req.body;
    const result = db.prepare(
      'INSERT INTO scorer_records (user_id, scores, total_score, verdict) VALUES (?, ?, ?, ?)'
    ).run(req.userId, JSON.stringify(scores || {}), totalScore || 0, verdict || '');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: '保存失败' });
  }
});

app.get('/api/scorer/records', authMiddleware, (req, res) => {
  const records = db.prepare('SELECT * FROM scorer_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.userId);
  records.forEach(r => { r.scores = JSON.parse(r.scores); });
  res.json({ records });
});

// ========== Data Export ==========
app.get('/api/data/export', authMiddleware, (req, res) => {
  try {
    const userData = db.prepare('SELECT id, nickname, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.userId);
    const testResults = db.prepare('SELECT * FROM test_results WHERE user_id = ?').all(req.userId);
    const ideas = db.prepare('SELECT * FROM ideas WHERE user_id = ?').all(req.userId);
    const challenges = db.prepare('SELECT * FROM challenge_records WHERE user_id = ?').all(req.userId);
    const favorites = db.prepare('SELECT * FROM favorites WHERE user_id = ?').all(req.userId);
    const scorers = db.prepare('SELECT * FROM scorer_records WHERE user_id = ?').all(req.userId);
    res.json({ user: userData, testResults, ideas, challenges, favorites, scorers, exportedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: '导出失败' });
  }
});

// ========== Health Check ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: {
      provider: AI_PROVIDER,
      configured: AI_PROVIDER === 'mock' || !!AI_CONFIGS[AI_PROVIDER]?.apiKey
    },
    db: 'connected',
    time: new Date().toISOString()
  });
});

// AI诊断测试路由
app.get('/api/ai-test', async (req, res) => {
  try {
    const result = await callAIProvider('回复OK', 'test', { temperature: 0.7, maxTokens: 100 });
    res.json({ success: true, content: result.content, provider: result.provider });
  } catch(e) {
    res.json({ success: false, error: e.message });
  }
});

// ========== Global Error Handler ==========
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: '服务器内部错误，请稍后重试' });
});

// ========== Start Server ==========
app.listen(PORT, () => {
  const providerInfo = AI_PROVIDER === 'mock' 
    ? '🧪 Mock模式 (模拟AI响应，无需API密钥)' 
    : (AI_CONFIGS[AI_PROVIDER]?.apiKey ? `✅ ${AI_PROVIDER.toUpperCase()} 已配置` : `❌ ${AI_PROVIDER.toUpperCase()} 密钥未配置`);
  
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║     StartupDNA Backend Server               ║
  ║     http://localhost:${PORT}                    ║
  ╠══════════════════════════════════════════════╣
  ║  AI: ${providerInfo.padEnd(37)}║
  ║  DB: ${DB_PATH.substring(0, 37).padEnd(37)}║
  ╠══════════════════════════════════════════════╣
  ║  前端: http://localhost:${PORT}/startupdna-optimized.html  ║
  ╚══════════════════════════════════════════════╝
  `);
});

// ========== Graceful Shutdown ==========
process.on('SIGTERM', () => { db.close(); process.exit(0); });
process.on('SIGINT', () => { db.close(); process.exit(0); });
