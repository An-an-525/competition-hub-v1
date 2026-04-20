# 竞赛助手（Competition Hub）— 项目状况总结

> 整理时间：2026-04-19  
> 目的：供本地 Agent 对接使用，包含所有关键配置、凭证和待办事项

---

## 一、项目概述

**项目名称：** 竞赛助手（Competition Hub）  
**项目目标：** 学科竞赛智能查询与报名平台，面向长沙理工大学学生  
**核心功能：**
- 竞赛信息查询、筛选、排序
- 竞赛报名（需登录）
- AI 智能问答（SSE 流式）
- 用户登录/注册（JWT + Supabase）
- 收藏、提醒、个人中心

---

## 二、GitHub 仓库

| 项目 | 值 |
|------|-----|
| 用户名 | An-an-525 |
| 仓库名 | competition-hub |
| URL | https://github.com/An-an-525/competition-hub |
| 分支 | main（有 branch protection，需用 API 推送） |
| Token | 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 |
| GitHub Pages | https://an-an-525.github.io/competition-hub/ |
| 最新 Commit | 3d4fb7b7（完整前端代码 + API 相对路径 + 部署脚本） |

**仓库文件结构（46 个文件）：**
```
/
├── index.html              # 主页面
├── css/style.css           # 全部样式（含深色模式）
├── js/
│   ├── ai-chat.js          # AI 聊天（SSE 流式）
│   ├── app.js              # 入口 + 覆盖层
│   ├── auth.js             # 登录/注册逻辑
│   ├── navigation.js       # 导航
│   ├── competition-hub.js  # SWR 缓存、分页、排序
│   ├── pages-competition.js # 竞赛页面
│   ├── registration-v2.js  # 报名系统
│   ├── data.js             # 内置竞赛数据
│   ├── modals.js           # 弹窗
│   ├── search.js           # 搜索
│   ├── utils.js            # 工具函数
│   ├── effects.js          # 视觉效果
│   ├── animations.js       # 动画
│   ├── notifications.js    # 通知
│   ├── calendar.js         # 日历
│   ├── toolbox.js          # 工具箱
│   ├── admin.js            # 管理面板
│   ├── admin-v2.js         # 管理面板 v2
│   ├── pages-academic.js   # 学院页面
│   ├── pages-admission.js  # 录取分数页面
│   ├── pages-campus.js     # 校园生活页面
│   └── pages-news.js       # 新闻页面
├── assets/                 # 图片资源
├── deploy-api.sh           # 一键部署脚本（安全版，无硬编码密钥）
├── robots.txt
├── sitemap.xml
├── SECURITY.md
├── LIGHHOUSE.md
└── README.md
```

---

## 三、服务器信息

| 项目 | 值 |
|------|-----|
| IP 地址 | 149.28.143.114 |
| 地区 | 新加坡 |
| 系统 | Ubuntu 22.04 |
| 配置 | 1 vCPU, 1 GB RAM |
| Vultr 实例 ID | 6015b75c-73f9-4e74-97c6-72545ca56893 |
| Root 密码 | T9？euSvow4ZcY{mJ |
| SSH 端口 | 22（已开放，sshd 运行中） |

### 端口使用情况

| 端口 | 服务 | 状态 |
|------|------|------|
| 22 | SSH | ✅ 开放 |
| 80 | Nginx | ✅ 运行中（旧前端） |
| 3000 | TokenPlan LLM 网关（用户已有服务） | ✅ 运行中 |
| 3101 | Competition API（Node.js） | ✅ 运行中（PM2） |
| 7500 | frp dashboard | ✅ |
| 8080 | frp proxy | ✅ |

### Nginx 配置

- 配置文件：`/etc/nginx/sites-available/competition-api`
- 代理规则：`/api/` → `http://localhost:3101`
- SSE 支持：`proxy_buffering off` + `X-Accel-Buffering: no`
- 前端静态文件：`/var/www/html/`（目前是旧前端）

### PM2 进程

- 进程名：`competition-api`
- 运行文件：`/root/competition-api/server.js`
- 状态：online
- 端口：3101

---

## 四、后端 API 详情

### 技术栈
- Node.js 20
- Express.js
- PM2 进程管理
- JWT 认证
- SSE（Server-Sent Events）流式响应

### API 端点

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/health` | GET | 健康检查 | ✅ 正常 |
| `/api/login` | POST | 用户登录（学号+密码） | ✅ 已部署 |
| `/api/chat` | POST | AI 聊天（SSE 流式） | ✅ 已部署 |

### 登录接口请求格式
```json
POST /api/login
Content-Type: application/json

{
  "studentId": "学号",
  "password": "密码"
}
```

### 聊天接口请求格式
```json
POST /api/chat
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "messages": [
    {"role": "user", "content": "问题"},
    {"role": "assistant", "content": "回答"}
  ],
  "deepMode": false
}
```

### 后端代码位置
- 服务器：`/root/competition-api/server.js`（434 行）
- 本地：`/data/user/work/competition-api/server.js`
- 也嵌入在 `deploy-api.sh` 的 heredoc 中

---

## 五、Supabase 配置

| 项目 | 值 |
|------|-----|
| Supabase URL | https://fdbbcibmqaogsbasoqly.supabase.co |
| Service Key | sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z |
| ⚠️ 状态 | **已暴露，需要轮换** |

### 数据库表结构

**users 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| student_id | text | 学号（唯一） |
| password | text | 密码（bcrypt 哈希） |
| name | text | 姓名 |
| college | text | 学院 |
| role | text | 角色（user/admin） |
| created_at | timestamptz | 创建时间 |

**registrations 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 外键 → users.id |
| comp_name | text | 竞赛名称 |
| student_id | text | 学号 |
| name | text | 姓名 |
| college | text | 学院 |
| status | text | 状态 |
| registered_at | timestamptz | 报名时间 |

### Supabase SQL 初始化脚本
```sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  college TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 报名表
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comp_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  college TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own registrations" ON registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations" ON registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own registrations" ON registrations
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 六、API 密钥与凭证

### ⚠️ 安全警告
以下密钥在之前的对话中暴露，**必须轮换**：

| 密钥 | 当前值 | 用途 | 状态 |
|------|--------|------|------|
| LLM_API_KEY | sk-cp-sHnWpvPMygZhEJloWKBPQ49qOLA8FiMJIjoyWDegRumFLl4RRJvqOqMirvnkuq_gk6LmyRZcwzrTORsajL7_VlAVEpMhkiqfQxKOTvgRce6_53sy2aNZeB0 | TokenPlan LLM API | 🔴 已暴露 |
| SUPABASE_SERVICE_KEY | sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z | Supabase 数据库访问 | 🔴 已暴露 |
| APP_JWT_SECRET | csust-competition-hub-jwt-secret-2026-xK9mQ3 | JWT 签名 | 🔴 已暴露 |
| Vultr API Key | HNYCRTMR7ZAZULWB7I7Z6FOVSGQGSBCALRXA | Vultr API（可能无效） | 🔴 已暴露 |

### LLM API 配置

| 项目 | 值 |
|------|-----|
| LLM Base URL | https://api.tokenplan.cn/v1 |
| LLM API Key | sk-cp-sHnWpvPMygZhEJloWKBPQ49qOLA8FiMJIjoyWDegRumFLl4RRJvqOqMirvnkuq_gk6LmyRZcwzrTORsajL7_VlAVEpMhkiqfQxKOTvgRce6_53sy2aNZeB0 |
| 快速模型 | gpt-4o-mini |
| 深度模型 | gpt-4o |

---

## 七、前端 API 地址配置

前端代码已改为**相对路径**（commit 3d4fb7b7），部署到同服务器后无需修改：

| 文件 | 改动 |
|------|------|
| `js/ai-chat.js` 第4行 | `AI_API_BASE = ''`（空字符串，相对路径） |
| `js/auth.js` 第62行 | `fetch('/api/login', ...)`（相对路径） |

**重要：** 如果前端继续用 GitHub Pages（HTTPS），API 在 Vultr（HTTP），浏览器 Mixed Content 策略会拦截请求。**必须把前端也部署到 Vultr 服务器**才能正常工作。

---

## 八、部署脚本

### deploy-api.sh（GitHub 上的安全版）

**下载地址：** https://raw.githubusercontent.com/An-an-525/competition-hub/main/deploy-api.sh

**执行方式（通过环境变量注入密钥）：**
```bash
export APP_JWT_SECRET='你的JWT密钥'
export LLM_API_KEY='你的LLM密钥'
export SUPABASE_SERVICE_KEY='你的Supabase密钥'
curl -fsSL https://raw.githubusercontent.com/An-an-525/competition-hub/main/deploy-api.sh -o /tmp/deploy-api.sh
bash /tmp/deploy-api.sh
```

**脚本功能：**
1. 安装 Node.js 20（如果未安装）
2. 安装 PM2（全局）
3. 创建 `/root/competition-api/server.js`（完整后端代码）
4. 创建 `.env` 文件（从环境变量读取密钥）
5. PM2 启动 `competition-api` 进程
6. 配置 Nginx 反向代理（`/api/` → localhost）
7. 自动处理端口冲突（3000 被占用时切换到 3101）

---

## 九、当前问题与待办

### 🔴 必须解决

1. **前端部署到服务器**  
   目前前端在 GitHub Pages（HTTPS），后端在 Vultr（HTTP），Mixed Content 导致 API 无法调用。  
   **解决方案：** 把前端文件部署到 `/var/www/html/`：
   ```bash
   cd /var/www/html
   curl -fsSL https://raw.githubusercontent.com/An-an-525/competition-hub/main/index.html -o index.html
   mkdir -p css js assets
   curl -fsSL https://raw.githubusercontent.com/An-an-525/competition-hub/main/css/style.css -o css/style.css
   for f in ai-chat.js app.js auth.js navigation.js competition-hub.js pages-competition.js registration-v2.js data.js modals.js search.js utils.js effects.js animations.js notifications.js calendar.js toolbox.js admin.js admin-v2.js pages-academic.js pages-admission.js pages-campus.js pages-news.js; do
     curl -fsSL "https://raw.githubusercontent.com/An-an-525/competition-hub/main/js/$f" -o "js/$f"
   done
   # assets 目录下的图片也需要下载
   ```

2. **轮换已暴露的密钥**  
   - LLM_API_KEY：到 TokenPlan 控制台重新生成
   - SUPABASE_SERVICE_KEY：到 Supabase Dashboard → Settings → API 重新生成
   - APP_JWT_SECRET：改为新的随机字符串
   - 轮换后需要更新服务器上的 `.env` 文件并重启 PM2

### 🟡 建议完成

3. **验证端到端功能**  
   - 在 `http://149.28.143.114` 测试登录
   - 测试 AI 聊天（SSE 流式）
   - 测试竞赛报名

4. **配置 SSL 证书**（可选）  
   如果有域名，可以用 Let's Encrypt + Certbot 配置 HTTPS：
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

5. **更新 Nginx 配置**  
   确保前端静态文件和 API 代理都能正常工作：
   ```nginx
   server {
       listen 80;
       server_name 149.28.143.114;
       root /var/www/html;
       index index.html;

       # 前端静态文件
       location / {
           try_files $uri $uri/ /index.html;
       }

       # API 反向代理
       location /api/ {
           proxy_pass http://localhost:3101;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
           proxy_buffering off;
           proxy_read_timeout 300s;
           add_header X-Accel-Buffering no;
       }
   }
   ```

---

## 十、服务器 .env 文件参考

当前服务器 `/root/competition-api/.env` 内容：
```
PORT=3101
APP_JWT_SECRET=csust-competition-hub-jwt-secret-2026-xK9mQ3
LLM_BASE_URL=https://api.tokenplan.cn/v1
LLM_API_KEY=sk-cp-sHnWpvPMygZhEJloWKBPQ49qOLA8FiMJIjoyWDegRumFLl4RRJvqOqMirvnkuq_gk6LmyRZcwzrTORsajL7_VlAVEpMhkiqfQxKOTvgRce6_53sy2aNZeB0
LLM_MODEL_FAST=gpt-4o-mini
LLM_MODEL_DEEP=gpt-4o
SUPABASE_URL=https://fdbbcibmqaogsbasoqly.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=20
```

---

## 十一、SSH 连接信息

```
主机: 149.28.143.114
端口: 22
用户: root
密码: T9？euSvow4ZcY{mJ
```

也可用 SSH 密钥连接（公钥已上传到服务器）。

---

## 十二、架构图

```
用户浏览器
    │
    ├── GitHub Pages (当前) ─── HTTPS ─── 前端静态文件
    │                                        │
    │                                   fetch('/api/*')
    │                                        │
    │                                   ❌ Mixed Content 拦截
    │
    └── Vultr 服务器 (目标) ─── HTTP ─── 前端 + API 同源
         │
         ├── Nginx (:80)
         │   ├── / → /var/www/html/ (前端静态文件)
         │   └── /api/ → localhost:3101 (反向代理)
         │
         └── Node.js (:3101)
             ├── POST /api/login → Supabase 认证
             └── POST /api/chat → TokenPlan LLM API (SSE)
```
