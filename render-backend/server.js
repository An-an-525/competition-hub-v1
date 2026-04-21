const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'csust-competition-jwt-secret-2026';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
const LLM_MODEL = process.env.LLM_MODEL || 'MiniMax-M2.7';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fdbbcibmqaogsbasoqly.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ==================== 登录 ====================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '缺少用户名或密码' });
    }

    // SHA-256 密码哈希
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    // 从 Supabase profiles 表验证
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?username=eq.${username}&password_hash=eq.${hash}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const profiles = await profileRes.json();
    if (!profiles || profiles.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = profiles[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'student' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role || 'student', college_id: user.college_id }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// ==================== AI 问答 (SSE) ====================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: '缺少消息内容' });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 系统提示词
    const systemPrompt = `你是长沙理工大学学科竞赛数智化平台的AI助手。你可以回答关于：
1. 学科竞赛信息（A/B+/B-/C/D/E类竞赛分类、校赛/省赛/国赛流程）
2. 竞赛报名流程和注意事项
3. 长沙理工大学校园信息
4. 学习和备赛建议
请用中文回答，语气友好专业。如果不确定，请诚实说明。`;

    if (LLM_API_KEY) {
      // 调用 MiniMax API (SSE 流式)
      const response = await fetch(LLM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_API_KEY}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                res.write('data: [DONE]\n\n');
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } else {
        // API 调用失败，返回本地回复
        const fallback = generateLocalResponse(message);
        res.write(`data: ${JSON.stringify({ content: fallback })}\n\n`);
        res.write('data: [DONE]\n\n');
      }
    } else {
      // 无 API Key，使用本地回复
      const localResp = generateLocalResponse(message);
      res.write(`data: ${JSON.stringify({ content: localResp })}\n\n`);
      res.write('data: [DONE]\n\n');
    }

    res.end();
  } catch (err) {
    console.error('AI 聊天错误:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI 聊天失败' });
    } else {
      res.write(`data: ${JSON.stringify({ content: '抱歉，处理消息时出现错误，请稍后重试。' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// ==================== 本地知识库回复 ====================
function generateLocalResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('a类') || msg.includes('b类') || msg.includes('分类')) {
    return '长沙理工大学竞赛分类体系：\n\n🏆 **A类** — 国家级顶级赛事（互联网+、挑战杯）\n🥇 **B+类** — 国家级重要赛事（ACM、数模、电子设计）\n🥈 **B-类** — 国家级一般赛事（蓝桥杯、华为ICT）\n🥉 **C类** — 省级赛事\n🏅 **D类** — 省级一般赛事\n📋 **E类** — 校级竞赛\n\nA/B类竞赛含金量最高，对保研和就业帮助最大。建议根据专业方向选择合适的竞赛参加。';
  }

  if (msg.includes('校赛') || msg.includes('省赛') || msg.includes('国赛') || msg.includes('流程')) {
    return '竞赛参赛流程：\n\n1️⃣ **校赛报名** → 在平台提交报名信息\n2️⃣ **校赛选拔** → 校内评审/比赛\n3️⃣ **省赛报名** → 校赛通过后自动开放\n4️⃣ **省赛** → 省级竞赛\n5️⃣ **国赛报名** → 省赛通过后自动开放\n6️⃣ **国赛** → 国家级竞赛\n\n⚠️ 注意：必须通过上一级比赛才能报名下一级。校赛是所有竞赛的起点，建议尽早准备。';
  }

  if (msg.includes('报名') || msg.includes('注册')) {
    return '报名流程：\n\n1. 在平台注册账号并登录\n2. 完善个人信息（姓名、学院、专业）\n3. 浏览竞赛列表，选择想参加的竞赛\n4. 查看竞赛详情和注意事项\n5. 选择报名级别（校赛/省赛/国赛）\n6. 填写报名信息并提交\n7. 等待审核通过\n\n💡 提示：报名前请仔细阅读竞赛的注意事项和相关链接。';
  }

  if (msg.includes('学分') || msg.includes('创新学分')) {
    return '关于创新学分：\n\n参加学科竞赛可以获得创新学分，具体认定标准因学院而异。一般来说：\n\n- A类竞赛获奖：2-4学分\n- B类竞赛获奖：1-3学分\n- C类竞赛获奖：1-2学分\n- 参与即可获得基础学分\n\n建议咨询所在学院的教务老师了解具体认定标准。';
  }

  if (msg.includes('保研') || msg.includes('考研')) {
    return '竞赛对保研/考研的帮助：\n\n📚 **保研加分**：A/B类竞赛获奖可以显著提升保研竞争力\n- A类国家级一等奖：保研加分最高\n- 多项竞赛获奖：综合竞争力更强\n\n📝 **考研复试**：\n- 竞赛经历是复试的重要加分项\n- 体现实践能力和创新精神\n- 部分院校对竞赛获奖者有优惠政策\n\n建议：尽早参加竞赛，积累经验。';
  }

  // 默认回复
  return '你好！我是长理竞赛助手AI 🤖\n\n我可以帮你解答以下问题：\n- 🏆 竞赛分类（A/B/C/D/E类）\n- 📋 参赛流程（校赛→省赛→国赛）\n- 📝 报名方法和注意事项\n- 📚 备赛建议和学习资源\n- 💡 创新学分认定\n- 🎓 保研/考研相关\n\n请问有什么可以帮你的？';
}

// ==================== 启动 ====================
app.listen(PORT, () => {
  console.log(`🚀 竞赛助手 API 已启动: http://localhost:${PORT}`);
  console.log(`   健康检查: /api/health`);
  console.log(`   登录: POST /api/login`);
  console.log(`   AI 问答: POST /api/chat (SSE)`);
});
