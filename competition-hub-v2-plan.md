# 竞赛助手 2.0 — 从零重建计划书

> **定位**：专注竞赛信息的智能服务平台，为高校学生提供竞赛发现、报名管理、AI 辅助问答的一站式体验。
> **版本**：v2.0
> **日期**：2026-04-20
> **技术栈**：Vue3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
> **用户规模**：千人级（全校推广）

---

## 一、产品定义

### 1.1 核心价值

| 模块 | 价值 | 目标用户动作 |
|------|------|-------------|
| 竞赛信息中心 | 发现适合的竞赛 | 浏览 → 筛选 → 收藏 |
| 报名管理系统 | 高效完成报名 | 填表 → 提交 → 追踪 |
| AI 竞赛助手 | 智能问答与导航 | 提问 → 获得精准回答 |
| 管理后台 | 高效审核管理 | 审核 → 统计 → 通知 |

### 1.2 用户角色

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   学生      │    │   教师      │    │   管理员    │
│ 浏览竞赛    │    │ 发布竞赛    │    │ 全局管理    │
│ 报名参赛    │    │ 审核报名    │    │ 数据统计    │
│ AI 问答     │    │ 团队管理    │    │ 系统配置    │
│ 查看通知    │    │ 查看统计    │    │ 用户管理    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 1.3 核心用户路径

```
首页（竞赛推荐）→ 竞赛详情 → 报名填表 → 提交成功 → 查看进度
                                    ↓
                              AI 问答（随时可唤起）
```

**设计原则**：3 次点击内到达核心目标。

---

## 二、系统架构

### 2.1 整体架构图

```
┌──────────────────────────────────────────────────────────┐
│                        客户端                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Vue3 SPA │  │ 移动端   │  │ 微信小程序│  │ PWA      │  │
│  │ (Web)    │  │ (H5适配) │  │ (可选)   │  │ (离线)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └──────────────┴──────────────┴──────────────┘       │
│                         │ HTTPS                            │
├─────────────────────────┼──────────────────────────────────┤
│                    Nginx / CDN                               │
│                         │                                   │
├─────────────────────────┼──────────────────────────────────┤
│                      API 网关层                              │
│         速率限制 │ CORS │ 安全头 │ 日志                      │
├────────────┬────────────┼────────────┬─────────────────────┤
│            │            │            │                      │
│  ┌─────────▼──┐  ┌──────▼──────┐  ┌──▼──────────┐         │
│  │ 业务服务    │  │ AI 服务     │  │ 通知服务    │         │
│  │ (NestJS)   │  │ (SSE流式)   │  │ (WebSocket) │         │
│  │            │  │             │  │             │         │
│  │ - 竞赛CRUD │  │ - 对话管理  │  │ - 站内信    │         │
│  │ - 报名管理 │  │ - 知识库    │  │ - 审核通知  │         │
│  │ - 用户认证 │  │ - 上下文    │  │ - 系统公告  │         │
│  │ - 权限控制 │  │ - RAG检索   │  │ - 邮件推送  │         │
│  └──────┬─────┘  └──────┬──────┘  └──────┬──────┘         │
│         │               │                │                  │
├─────────┼───────────────┼────────────────┼──────────────────┤
│         │          数据层 │                │                  │
│  ┌──────▼────────────────▼────────────────▼──────┐         │
│  │              PostgreSQL (Supabase)               │         │
│  │  竞赛 │ 报名 │ 用户 │ 通知 │ AI对话 │ 团队      │         │
│  └────────────────────────────────────────────────┘         │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │   Redis (缓存)   │  │  Supabase Storage │                 │
│  │ 会话 │ 速率 │ 排行 │  │  报名附件 │ 头像   │                 │
│  └──────────────────┘  └──────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| **前端框架** | Vue 3 + Composition API | 响应式强、生态成熟、学习曲线适中 |
| **构建工具** | Vite 5 | 极速 HMR、原生 ESM、插件丰富 |
| **语言** | TypeScript 5 | 类型安全、IDE 支持好、减少运行时错误 |
| **状态管理** | Pinia | Vue3 官方推荐、TypeScript 友好、DevTools |
| **路由** | Vue Router 4 | 官方路由、支持路由守卫和懒加载 |
| **UI 组件库** | Element Plus | 中后台首选、中文文档完善、主题定制强 |
| **CSS 方案** | UnoCSS + Tailwind | 原子化 CSS、按需生成、体积小 |
| **HTTP 客户端** | Axios | 拦截器、取消请求、类型封装 |
| **后端框架** | NestJS | 模块化架构、装饰器、依赖注入、TypeScript 原生 |
| **ORM** | Prisma | 类型安全、迁移管理、查询直观 |
| **数据库** | PostgreSQL (Supabase) | 免费、可靠、JSON 支持、全文搜索 |
| **缓存** | Redis (Upstash 免费层) | 速率限制、会话缓存、排行榜 |
| **认证** | JWT + Refresh Token | 无状态、可扩展、移动端友好 |
| **AI** | OpenAI 兼容 API (MiniMax) | SSE 流式、上下文管理、RAG |
| **文件存储** | Supabase Storage | 与数据库同平台、免费额度够用 |
| **部署** | Vercel (前端) + Railway/Fly.io (后端) | CI/CD 自动化、免费层够用 |
| **监控** | Sentry (错误) + Umami (统计) | 开源免费、隐私友好 |

### 2.3 项目结构

```
competition-hub-v2/
├── apps/
│   ├── web/                    # 前端 Vue3 应用
│   │   ├── src/
│   │   │   ├── api/            # API 请求封装
│   │   │   ├── assets/         # 静态资源
│   │   │   ├── components/     # 通用组件
│   │   │   │   ├── common/     # 基础组件
│   │   │   │   ├── business/   # 业务组件
│   │   │   │   └── layout/     # 布局组件
│   │   │   ├── composables/    # 组合式函数
│   │   │   ├── constants/      # 常量定义
│   │   │   ├── layouts/        # 页面布局
│   │   │   ├── pages/          # 页面组件
│   │   │   │   ├── home/       # 首页
│   │   │   │   ├── competition/# 竞赛相关
│   │   │   │   ├── auth/       # 认证相关
│   │   │   │   ├── ai/         # AI 问答
│   │   │   │   ├── profile/    # 个人中心
│   │   │   │   └── admin/      # 管理后台
│   │   │   ├── router/         # 路由配置
│   │   │   ├── stores/         # Pinia 状态
│   │   │   ├── styles/         # 全局样式
│   │   │   ├── types/          # TypeScript 类型
│   │   │   └── utils/          # 工具函数
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── server/                 # 后端 NestJS 应用
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/       # 认证模块
│       │   │   ├── user/       # 用户模块
│       │   │   ├── competition/# 竞赛模块
│       │   │   ├── application/# 报名模块
│       │   │   ├── ai/         # AI 模块
│       │   │   ├── notification/# 通知模块
│       │   │   ├── team/       # 团队模块
│       │   │   └── admin/      # 管理模块
│       │   ├── common/         # 公共模块
│       │   │   ├── guards/     # 守卫
│       │   │   ├── interceptors/# 拦截器
│       │   │   ├── decorators/ # 装饰器
│       │   │   ├── filters/    # 过滤器
│       │   │   └── pipes/      # 管道
│       │   ├── prisma/         # Prisma schema
│       │   └── app.module.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                   # 共享包
│   ├── shared-types/           # 共享 TypeScript 类型
│   └── shared-utils/           # 共享工具函数
│
├── docker-compose.yml          # 本地开发环境
├── turbo.json                  # Turborepo 配置
├── .github/workflows/          # CI/CD
├── pnpm-workspace.yaml
└── README.md
```

---

## 三、数据库设计

### 3.1 ER 关系图

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  users   │────<│ applications │>────│ competitions │
│          │     │              │     │              │
│ id (PK)  │     │ id (PK)      │     │ id (PK)      │
│ username │     │ user_id (FK) │     │ title        │
│ password │     │ comp_id (FK) │     │ description  │
│ name     │     │ status       │     │ level        │
│ role     │     │ team_id (FK) │     │ category     │
│ college  │     │ answers      │     │ start_date   │
│ avatar   │     │ created_at   │     │ end_date     │
│ student_id│   └──────┬───────┘     │ max_team_size│
└────┬─────┘            │             │ status       │
     │            ┌─────▼──────┐     └──────────────┘
     │            │   teams    │
     │            │            │
     │            │ id (PK)    │     ┌──────────────┐
     │            │ name       │     │ notifications│
     │            │ leader_id  │     │              │
     │            │ comp_id    │     │ id (PK)      │
     │            └────────────┘     │ user_id (FK) │
     │                               │ title        │
     │            ┌──────────────┐   │ content      │
     │            │ team_members │   │ type         │
     │            │              │   │ is_read      │
     │            │ id (PK)      │   └──────────────┘
     │            │ team_id (FK)│
     │            │ user_id (FK)│   ┌──────────────┐
     │            │ role        │   │ ai_chats    │
     │            └──────────────┘   │              │
     │                               │ id (PK)      │
     │            ┌──────────────┐   │ user_id (FK) │
     │            │ reviews      │   │ title        │
     │            │              │   │ messages     │
     │            │ id (PK)      │   │ created_at   │
     │            │ app_id (FK)  │   └──────────────┘
     │            │ reviewer_id  │
     │            │ status       │
     │            │ comment      │
     │            └──────────────┘
     │
     └──> favorites (user_id, comp_id)
```

### 3.2 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt
  college       VARCHAR(100),
  role          VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 竞赛表
CREATE TABLE competitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  level           VARCHAR(20) CHECK (level IN ('national','provincial','school','college')),
  category        VARCHAR(50),
  organizer       VARCHAR(100),
  start_date      DATE,
  end_date        DATE,
  reg_start_date  DATE,
  reg_end_date    DATE,
  max_team_size   INT DEFAULT 1,
  status          VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','ended','cancelled')),
  cover_image     TEXT,
  attachments     JSONB DEFAULT '[]',
  tags            TEXT[] DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 报名表
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  competition_id  UUID REFERENCES competitions(id) NOT NULL,
  team_id         UUID REFERENCES teams(id),
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected','withdrawn')),
  form_data       JSONB DEFAULT '{}',       -- 动态表单数据
  attachments     JSONB DEFAULT '[]',       -- 附件列表
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, competition_id)
);

-- 团队表
CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  competition_id  UUID REFERENCES competitions(id) NOT NULL,
  leader_id       UUID REFERENCES users(id) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 团队成员表
CREATE TABLE team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id),
  role      VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 审核记录表
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) NOT NULL,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('approved','rejected','request_changes')),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 通知表
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     TEXT,
  type        VARCHAR(30) DEFAULT 'system' CHECK (type IN ('system','review','registration','team','reminder')),
  is_read     BOOLEAN DEFAULT FALSE,
  related_id  UUID,           -- 关联的业务 ID
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AI 对话表
CREATE TABLE ai_chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) NOT NULL,
  title       VARCHAR(200),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- AI 消息表
CREATE TABLE ai_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID REFERENCES ai_chats(id) ON DELETE CASCADE,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  competition_id  UUID REFERENCES competitions(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, competition_id)
);

-- 索引
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_comp ON applications(competition_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_dates ON competitions(start_date, end_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_ai_chats_user ON ai_chats(user_id);
CREATE INDEX idx_teams_comp ON teams(competition_id);
```

---

## 四、功能模块设计

### 4.1 竞赛信息中心

```
竞赛首页
├── 竞赛推荐（基于标签和浏览历史）
├── 分类筛选（级别/类别/状态/时间）
├── 搜索（全文搜索 + 标签匹配）
├── 竞赛日历（日/周/月视图）
└── 竞赛详情页
    ├── 基本信息（标题/描述/时间/级别）
    ├── 组织方信息
    ├── 报名要求（团队规模/资格）
    ├── 附件下载
    ├── 相关竞赛推荐
    └── 立即报名按钮
```

**关键特性**：
- 竞赛状态自动流转（upcoming → ongoing → ended）
- 报名截止倒计时
- 收藏和浏览历史
- 标签体系（学科/类型/主办方）

### 4.2 报名管理系统

```
报名流程
├── 选择竞赛 → 查看要求
├── 填写报名表（动态表单）
│   ├── 个人信息（自动填充）
│   ├── 团队信息（如需组队）
│   ├── 附件上传（证明材料）
│   └── 确认提交
├── 提交后追踪
│   ├── 状态：草稿 → 已提交 → 审核中 → 通过/驳回
│   ├── 审核意见查看
│   ├── 修改重新提交
│   └── 撤回报名
└── 我的报名列表
    ├── 全部/待审核/已通过/已驳回
    └── 筛选和排序
```

**关键特性**：
- 动态表单引擎（不同竞赛不同字段）
- 断点续填（草稿自动保存）
- 团队邀请机制（链接/学号邀请）
- 文件上传（类型/大小限制）
- 报名状态变更实时通知

### 4.3 AI 竞赛助手

```
AI 问答系统
├── 对话界面
│   ├── 流式输出（SSE）
│   ├── 上下文记忆（最近 20 条）
│   ├── 对话历史管理
│   └── 新建/删除/重命名对话
├── 竞赛知识库（RAG）
│   ├── 竞赛信息检索
│   ├── 报名流程指导
│   ├── 备赛策略建议
│   └── 往届经验分享
├── 智能导航
│   ├── "帮我报名 XXX 竞赛" → 跳转报名页
│   ├── "查看我的报名" → 跳转我的报名
│   └── "有哪些数学类竞赛" → 竞赛列表筛选
└── 快捷入口
    ├── 常见问题模板
    ├── 竞赛推荐
    └── 深度思考模式
```

**关键特性**：
- RAG 检索增强生成（竞赛数据 + 政策文档）
- 意图识别与页面跳转
- 流式输出 + 打字效果
- 上下文窗口管理
- Token 用量统计和限额

### 4.4 管理后台

```
管理后台
├── 数据概览
│   ├── 报名统计（按竞赛/学院/状态）
│   ├── 用户活跃度
│   ├── AI 使用量
│   └── 趋势图表
├── 竞赛管理
│   ├── 创建/编辑/删除竞赛
│   ├── 自定义报名表单
│   ├── 状态管理
│   └── 批量操作
├── 报名审核
│   ├── 审核列表（待审核/已审核）
│   ├── 批量通过/驳回
│   ├── 审核意见
│   └── 导出数据
├── 用户管理
│   ├── 用户列表
│   ├── 角色管理
│   ├── 禁用/启用
│   └── 重置密码
├── 通知管理
│   ├── 发送通知
│   ├── 系统公告
│   └── 定时提醒
└── 系统设置
    ├── 竞赛分类管理
    ├── 标签管理
    └── 系统参数
```

---

## 五、API 设计

### 5.1 接口规范

```
基础URL: /api/v1
认证: Bearer JWT
格式: JSON
分页: ?page=1&pageSize=20
排序: ?sortBy=created_at&sortOrder=desc
过滤: ?status=approved&level=national
```

### 5.2 核心接口列表

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| **认证** |
| POST | /auth/register | 注册 | 公开 |
| POST | /auth/login | 登录 | 公开 |
| POST | /auth/refresh | 刷新 Token | 已认证 |
| POST | /auth/logout | 登出 | 已认证 |
| GET | /auth/me | 当前用户信息 | 已认证 |
| **竞赛** |
| GET | /competitions | 竞赛列表（分页/筛选） | 公开 |
| GET | /competitions/:id | 竞赛详情 | 公开 |
| GET | /competitions/search | 全文搜索 | 公开 |
| POST | /competitions | 创建竞赛 | 教师/管理员 |
| PATCH | /competitions/:id | 更新竞赛 | 教师/管理员 |
| DELETE | /competitions/:id | 删除竞赛 | 管理员 |
| **报名** |
| GET | /applications | 我的报名列表 | 已认证 |
| GET | /applications/:id | 报名详情 | 本人 |
| POST | /applications | 创建报名 | 已认证 |
| PATCH | /applications/:id | 更新报名 | 本人 |
| POST | /applications/:id/submit | 提交报名 | 本人 |
| POST | /applications/:id/withdraw | 撤回报名 | 本人 |
| **审核** |
| GET | /reviews | 审核列表 | 教师/管理员 |
| POST | /reviews | 提交审核 | 教师/管理员 |
| POST | /reviews/batch | 批量审核 | 教师/管理员 |
| **团队** |
| POST | /teams | 创建团队 | 已认证 |
| POST | /teams/:id/members | 邀请成员 | 队长 |
| DELETE | /teams/:id/members/:uid | 移除成员 | 队长 |
| **AI** |
| POST | /ai/chat | 发送消息（SSE） | 已认证 |
| GET | /ai/chats | 对话列表 | 已认证 |
| DELETE | /ai/chats/:id | 删除对话 | 本人 |
| **通知** |
| GET | /notifications | 通知列表 | 已认证 |
| PATCH | /notifications/:id/read | 标记已读 | 本人 |
| PATCH | /notifications/read-all | 全部已读 | 本人 |
| **管理** |
| GET | /admin/stats | 数据统计 | 管理员 |
| GET | /admin/users | 用户列表 | 管理员 |
| PATCH | /admin/users/:id/role | 修改角色 | 管理员 |
| POST | /admin/notifications | 发送通知 | 管理员 |

### 5.3 统一响应格式

```typescript
// 成功
{
  "code": 200,
  "data": { ... },
  "message": "success"
}

// 分页
{
  "code": 200,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 错误
{
  "code": 400,
  "error": "VALIDATION_ERROR",
  "message": "学号格式不正确",
  "details": [{ "field": "studentId", "message": "必须为 8-12 位数字" }]
}
```

### 5.4 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|----------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| UNAUTHORIZED | 401 | 未认证 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突（如重复报名） |
| RATE_LIMITED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| AI_UNAVAILABLE | 503 | AI 服务不可用 |

---

## 六、安全设计

### 6.1 认证与授权

```
注册/登录流程：
1. 用户提交学号 + 密码（HTTPS）
2. 后端 bcrypt 验证密码
3. 返回 access_token (15min) + refresh_token (7d)
4. 前端存储在 httpOnly cookie
5. access_token 过期后自动用 refresh_token 刷新
```

### 6.2 安全基线

| 措施 | 实现 |
|------|------|
| 密码存储 | bcrypt (cost=12) |
| HTTPS | Let's Encrypt + HSTS |
| CORS | 白名单域名 |
| CSP | 严格 Content-Security-Policy |
| 速率限制 | 登录 5次/分/IP，API 60次/分/用户 |
| CSRF | SameSite cookie + CSRF token |
| XSS | 输入验证 + 输出编码 + CSP |
| SQL 注入 | Prisma 参数化查询 |
| 文件上传 | 类型白名单 + 大小限制 + 病毒扫描 |
| 安全头 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

### 6.3 权限模型 (RBAC)

```
student:  浏览竞赛、报名、AI 问答、查看通知
teacher:  + 创建竞赛、审核报名、团队管理
admin:    + 用户管理、系统配置、全局数据
```

---

## 七、性能设计

### 7.1 性能目标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| LCP (首屏渲染) | < 2.0s | Lighthouse |
| FID (首次输入延迟) | < 100ms | Lighthouse |
| CLS (布局偏移) | < 0.1 | Lighthouse |
| API P95 响应时间 | < 300ms | APM 监控 |
| API P99 响应时间 | < 500ms | APM 监控 |
| 页面加载 JS 体积 | < 200KB (gzip) | 构建分析 |

### 7.2 缓存策略

```
L1: 浏览器缓存
    - 静态资源: Cache-Control immutable + 内容哈希
    - API 响应: SWR (Stale-While-Revalidate)

L2: CDN 缓存
    - 静态资源: Vercel Edge Network
    - 页面: ISR (Incremental Static Regeneration)

L3: 服务端缓存
    - 竞赛列表: Redis 5min TTL
    - 用户会话: Redis 30min TTL
    - AI 对话上下文: 内存 LRU
```

### 7.3 前端优化

- 路由级代码分割（Vue Router lazy import）
- 图片懒加载 + WebP/AVIF 格式
- 虚拟滚动（长列表）
- Skeleton 骨架屏
- 预加载关键资源（preconnect, prefetch）

---

## 八、开发计划

### 8.1 里程碑规划

```
Phase 1: 基础框架（第 1-2 周）
├── 项目初始化（Monorepo + Turborepo）
├── 数据库设计与 Prisma 迁移
├── 后端基础架构（NestJS + 认证模块）
├── 前端基础框架（Vue3 + 路由 + 布局）
├── CI/CD 流水线
└── 交付物: 可运行的空壳 + 登录/注册

Phase 2: 竞赛核心（第 3-4 周）
├── 竞赛 CRUD（后端 API + 前端页面）
├── 竞赛列表（分页/筛选/搜索）
├── 竞赛详情页
├── 竞赛日历
├── 收藏功能
└── 交付物: 可浏览和搜索竞赛

Phase 3: 报名系统（第 5-6 周）
├── 动态表单引擎
├── 报名 CRUD
├── 团队管理（创建/邀请/退出）
├── 文件上传
├── 报名状态追踪
├── 审核功能
└── 交付物: 完整报名流程

Phase 4: AI 问答（第 7-8 周）
├── AI 对话接口（SSE 流式）
├── 竞赛知识库（RAG）
├── 意图识别与页面跳转
├── 对话历史管理
├── 快捷问题模板
└── 交付物: AI 问答可用

Phase 5: 管理后台 + 打磨（第 9-10 周）
├── 管理后台仪表盘
├── 数据统计图表
├── 用户管理
├── 通知系统
├── UI/UX 打磨
├── 移动端适配
├── SEO 优化
├── 性能优化
└── 交付物: 可上线的完整产品

Phase 6: 测试上线（第 11-12 周）
├── 单元测试（覆盖率 > 80%）
├── E2E 测试（核心流程）
├── 安全测试（渗透测试）
├── 性能测试（压力测试）
├── 数据迁移（从旧系统）
├── 灰度发布
└── 交付物: 正式上线
```

### 8.2 工时估算

| 阶段 | 前端 | 后端 | 测试 | 合计 |
|------|------|------|------|------|
| Phase 1 | 3天 | 5天 | 1天 | 9天 |
| Phase 2 | 5天 | 3天 | 2天 | 10天 |
| Phase 3 | 7天 | 5天 | 2天 | 14天 |
| Phase 4 | 5天 | 5天 | 2天 | 12天 |
| Phase 5 | 7天 | 3天 | 2天 | 12天 |
| Phase 6 | 2天 | 2天 | 5天 | 9天 |
| **合计** | **29天** | **23天** | **14天** | **66天** |

---

## 九、部署方案

### 9.1 环境规划

```
开发环境:  localhost + Docker Compose
测试环境:  Railway/Fly.io (免费层)
预发环境:  同生产但独立数据库
生产环境:  Vercel (前端) + Railway (后端) + Supabase (数据库)
```

### 9.2 CI/CD 流水线

```
Push to main
    │
    ├── Lint + Type Check
    ├── Unit Test
    ├── Build
    ├── E2E Test (Playwright)
    │
    ├── Preview Deploy (Vercel/Railway)
    │
    └── Manual Approve → Production Deploy
```

### 9.3 监控告警

| 工具 | 用途 |
|------|------|
| Sentry | 前后端错误追踪 |
| Umami | 用户行为统计（隐私友好） |
| Upptime Robot | 服务可用性监控 |
| GitHub Actions | CI/CD 状态 |

---

## 十、与旧系统对比

| 维度 | v1.0（当前） | v2.0（重建） |
|------|-------------|-------------|
| 前端框架 | 原生 JS | Vue3 + TypeScript |
| 后端框架 | Express (单文件) | NestJS (模块化) |
| 数据库操作 | 前端直连 Supabase | 后端 API + Prisma ORM |
| 认证方式 | localStorage + 前端校验 | JWT + httpOnly cookie + 后端校验 |
| 密码存储 | SHA-256 无盐 | bcrypt (cost=12) |
| 权限控制 | 前端 role 判断 | 后端 RBAC 中间件 |
| AI 问答 | 直接调 LLM | RAG + 意图识别 + 上下文管理 |
| 代码组织 | 22 个全局 JS 文件 | Monorepo + ES Modules |
| 构建 | 无构建流程 | Vite + Turborepo |
| 测试 | 无 | Vitest + Playwright |
| 安全 | 多处漏洞 | 安全基线 + 渗透测试 |
| SEO | SPA 无 SSR | 预渲染 + Sitemap + JSON-LD |
| 性能 | 337KB JS 同步加载 | 代码分割 < 200KB gzip |

---

## 附录：技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 前端框架 | Vue3 | 生态成熟、中文社区强、Element Plus |
| 后端框架 | NestJS | 企业级架构、TypeScript 原生、模块化 |
| ORM | Prisma | 类型安全、迁移管理、开发体验好 |
| 数据库 | Supabase (PostgreSQL) | 免费层够用、内置 Auth/Storage |
| 缓存 | Upstash Redis | Serverless、免费层、低延迟 |
| 部署 | Vercel + Railway | CI/CD 自动化、免费层、全球 CDN |
| 监控 | Sentry + Umami | 开源、隐私友好、免费层够用 |
| 测试 | Vitest + Playwright | 速度快、Vue 生态集成好 |
