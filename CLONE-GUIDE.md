# 长沙理工大学学科竞赛数智化平台 — 完整复刻指南

> 本文档面向接手此项目的开发者/AI Agent，提供从零复刻到生产部署的完整指引。
> 最后更新：2026-04-21

---

## 一、项目架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                      │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │   V1 (HTML/JS)    │  │   V2 (Vue3 + Element Plus)│     │
│  │  index.html + 22  │  │  competition-hub-v2/      │     │
│  │  JS modules       │  │  14 routes, 6 composables│     │
│  └────────┬─────────┘  └───────────┬──────────────┘     │
│           └──────────┬─────────────┘                     │
├──────────────────────┼──────────────────────────────────┤
│              API / 数据层                                │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │  后端 API (Node)  │  │  Supabase (PostgreSQL)   │     │
│  │  Vultr:3101      │  │  fdbbcibmqaogsbasoqly    │     │
│  │  JWT + MiniMax    │  │  28表 + 视图 + 触发器    │     │
│  └──────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 二、仓库文件清单与说明

### 2.1 核心前端文件（V1）

| 文件 | 说明 |
|------|------|
| `index.html` | 单页应用入口，加载所有 JS 模块 |
| `css/style.css` | 主样式表（Claude Aesthetic 设计系统） |
| `js/competition-hub.js` | 核心：Supabase 数据获取 + 3层缓存 + 竞赛渲染 |
| `js/ai-chat.js` | AI 问答（MiniMax M2.7 SSE + 本地知识库） |
| `js/registration-v2.js` | V2 报名系统（分级报名：校赛→省赛→国赛） |
| `js/admin-v2.js` | V2 管理后台（权限隔离 + 企业/资源管理） |
| `js/auth.js` | 自定义认证（SHA-256 + profiles 表） |
| `js/navigation.js` | SPA 路由 + 页面切换 |
| `js/pages-competition.js` | 竞赛页面（列表/详情/日历/战绩） |
| `js/onboarding.js` | 🆕 新手引导（A/B类科普 + 流程说明） |
| `js/learning-resources.js` | 🆕 学习资源模块（视频/案例/攻略） |
| `js/notifications.js` | Supabase 通知系统（30s 轮询） |
| `js/data.js` | 本地数据回退（55+ 竞赛，Supabase 不可用时使用） |
| `js/utils.js` | 工具函数（Supabase URL/Headers 配置） |

### 2.2 数据库文件

| 文件 | 说明 |
|------|------|
| `csust_competition_v2_schema.sql` | **完整 DDL**（28 表 + 2 物化视图 + 4 视图 + 5 触发器 + 64 索引） |
| `ddl.sql` | 早期 DDL 版本 |
| `init_database.sql` | 初始化脚本 |
| `competition_registration_system.sql` | 报名系统 SQL |

### 2.3 部署脚本

| 文件 | 说明 |
|------|------|
| `deploy-backend.sh` | 后端 API 远程部署（sshpass + PM2 + Nginx） |
| `deploy-api.sh` | 后端 API 本地部署 |
| `deploy-api-safe.sh` | 后端 API 安全部署（命令行注入密钥） |
| `deploy.sh` | 全新本地部署 |
| `server-setup.sh` | 服务器环境初始化 |
| `server-start.sh` | 服务器启动脚本 |

### 2.4 文档

| 文件 | 说明 |
|------|------|
| `HANDOFF.md` | **数据库交接文档**（表结构、数据统计、凭证、注意事项） |
| `PROJECT-STATUS.md` | **项目全貌**（架构、API、凭证、所有服务信息） |
| `BACKEND_SETUP_GUIDE.md` | 后端部署指南 |
| `.trae/documents/feature-improvement-blueprint.md` | **功能改进技术蓝图**（8 模块设计） |
| `.trae/documents/database-data-import-plan.md` | 数据导入计划 |
| `competition-hub-v2-plan.md` | V2.0 重建计划书（66 天估算） |
| `SECURITY.md` | 安全策略 |

### 2.5 V2 前端（Vue3）

位于 `competition-hub-v2/` 子目录（独立仓库 `An-an-525/competition-hub-v2`）：
- `src/pages/` — 10 个前端页面 + 5 个管理页面
- `src/composables/` — 6 个数据逻辑模块
- `src/stores/auth.ts` — 认证状态管理
- `src/types/competition.ts` — TypeScript 类型定义
- `src/router/index.ts` — 14 个路由

---

## 三、Supabase 数据库

### 3.1 连接信息

| 项目 | 值 |
|------|-----|
| Supabase URL | `https://fdbbcibmqaogsbasoqly.supabase.co` |
| Project Ref | `fdbbcibmqaogsbasoqly` |
| Region | Southeast Asia (ap-southeast-1) |
| DB Password | 见 `PROJECT-STATUS.md` |
| Anon Key | 见 `PROJECT-STATUS.md` |
| Service Role Key | 见 `PROJECT-STATUS.md` |

### 3.2 数据统计（当前）

| 数据类型 | 数量 | 目标表 |
|---------|------|--------|
| 学院信息 | 25 | `colleges` |
| 竞赛分类 | 7 (A/B+/B-/C/D/E/校级) | `competition_categories` |
| 竞赛项目 | 98 | `competitions` |
| 专业信息 | 68 | `majors` |
| 通知/新闻 | 89 | `knowledge_documents` |
| 管理规则 | 9 | `knowledge_documents` |
| 企业信息 | 0 (空表) | `enterprises` |
| 学习资源 | 0 (空表) | `learning_resources` |

### 3.3 从零部署数据库

```bash
# 方法1: 通过 Supabase Management API
# 详见 HANDOFF.md 中的 deploy_schema.py 脚本

# 方法2: 通过 Supabase Dashboard SQL Editor
# 直接复制 csust_competition_v2_schema.sql 的内容执行

# 方法3: 通过 psql
psql "postgresql://postgres:[DB_PASSWORD]@db.fdbbcibmqaogsbasoqly.supabase.co:5432/postgres" -f csust_competition_v2_schema.sql
```

---

## 四、后端 API

### 4.1 技术栈
- Node.js + Express
- JWT 认证
- MiniMax M2.7 AI (SSE 流式)
- PM2 进程管理
- Nginx 反向代理

### 4.2 端点
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/login` | POST | JWT 登录 |
| `/api/chat` | POST | AI 问答 (SSE) |

### 4.3 部署
```bash
# 远程部署到 Vultr 服务器
bash deploy-backend.sh

# 或安全部署（命令行注入密钥）
bash deploy-api-safe.sh --jwt-secret=xxx --llm-key=xxx --supabase-key=xxx
```

---

## 五、前端部署

### 5.1 GitHub Pages（已配置）
- 仓库：`An-an-525/competition-hub-v1`
- 自动部署：push 到 main 分支触发 `.github/workflows/deploy.yml`
- 访问地址：`https://an-an-525.github.io/competition-hub-v1/`

### 5.2 自有服务器部署
```bash
# 1. 克隆仓库
git clone https://github.com/An-an-525/competition-hub-v1.git
cd competition-hub-v1

# 2. 配置 Nginx
# 将 nginx root 指向仓库目录
# server {
#     listen 80;
#     server_name your-domain.com;
#     root /path/to/competition-hub-v1;
#     index index.html;
#     location / { try_files $uri $uri/ /index.html; }
#     location /api/ { proxy_pass http://localhost:3101; }
# }
```

---

## 六、功能模块清单（2026-04-21 改进后）

| # | 功能 | 状态 | 涉及文件 |
|---|------|------|----------|
| F1 | 校赛→省赛→国赛分级报名 | ✅ | registration-v2.js |
| F2 | 竞赛会长独立管理（权限隔离） | ✅ | admin-v2.js |
| F3 | 新手引导（A/B类科普） | ✅ | onboarding.js |
| F4 | AI 聊天滚动修复 | ✅ | ai-chat.js |
| F5 | 首页"了解校赛"模块 | ✅ | index.html, navigation.js |
| F6 | 基于学院的竞赛推荐 | ✅ | pages-competition.js |
| F7 | 学习资源模块 | ✅ | learning-resources.js |
| F8 | 企业就业标注 | ✅ | admin-v2.js, pages-competition.js |

---

## 七、已知问题

| 问题 | 严重性 | 说明 |
|------|--------|------|
| V1 Supabase REST API HTTP 400 | 高 | 前端回退到本地 data.js（55项），需排查 anon key 配置 |
| V2 TypeScript 接口与 DB 列名不匹配 | 高 | Competition.name vs DB competition_name |
| RLS 未启用 | 中 | 所有表无行级安全策略 |
| 权限隔离依赖前端 | 中 | admin scope 通过前端 JS 过滤，非数据库级别 |

---

## 八、扩展指南

### 添加新竞赛
```sql
INSERT INTO competitions (name, category_id, ...) VALUES (...);
```

### 添加企业合作
```sql
INSERT INTO enterprises (enterprise_name, ...) VALUES (...);
INSERT INTO competition_enterprises (competition_id, enterprise_id, cooperation_desc) VALUES (...);
```

### 添加学习资源
```sql
INSERT INTO learning_resources (title, resource_type, content_url, ...) VALUES (...);
```

### 配置竞赛学院限制
```sql
UPDATE competitions SET allowed_colleges = '{1,3,5}', college_restriction_note = '仅限土木、交通、电气学院' WHERE competition_id = xx;
```
