# 长沙理工大学学科竞赛数智化平台 — 功能改进技术方案设计文档（蓝图）

> **版本**: v1.0 | **日期**: 2026-04-21
> **阶段**: Phase 1 — 蓝图设计（待审批）
> **范围**: V1 前端 + V2 Vue3 前端 + 数据库 Schema + 后端 API
> **原则**: 先出方案再执行，两个版本都改，留下完整备案

---

## 一、需求清单与优先级

| # | 需求 | 优先级 | 影响范围 |
|---|------|--------|----------|
| F1 | 校赛→省赛→国赛分级报名流程 | P0 | DB + V1 + V2 |
| F2 | 竞赛会长独立管理板块（权限隔离） | P0 | DB + V1 + V2 |
| F3 | 新手引导（A/B类科普、一次性提示） | P0 | V1 + V2 |
| F4 | AI 聊天滚动跳转 Bug 修复 | P1 | V1 |
| F5 | 首页改版（底部三入口→校赛了解模块） | P1 | V1 + V2 |
| F6 | 基于学院的竞赛推荐（可报/不可报标注） | P1 | DB + V1 + V2 |
| F7 | 学习资源模块（视频、案例、全流程介绍） | P2 | DB + V1 + V2 |
| F8 | 企业就业标注（空表 + 管理后台） | P2 | DB + V1 + V2 |

---

## 二、架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                      │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │   V1 (HTML/JS)    │  │   V2 (Vue3 + Element Plus)│     │
│  │  index.html + 22  │  │  14 routes, 6 composables│     │
│  │  JS modules       │  │  10 frontend + 5 admin   │     │
│  └────────┬─────────┘  └───────────┬──────────────┘     │
│           └──────────┬─────────────┘                     │
├──────────────────────┼──────────────────────────────────┤
│              API / REST 层                               │
│  ┌──────────────────┐  ┌──────────────────────────┐     │
│  │  V1: Supabase    │  │  V2: Supabase JS SDK     │     │
│  │  REST API (anon) │  │  direct connection       │     │
│  └────────┬─────────┘  └───────────┬──────────────┘     │
│           └──────────┬─────────────┘                     │
├──────────────────────┼──────────────────────────────────┤
│              数据库层 (Supabase PostgreSQL)                │
│  现有 25 表 + 新增 3 表 + 修改 2 表 + 新增 1 视图         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、数据库变更方案

### 3.1 新增表

#### ① `enterprises` — 企业就业信息表（F8）
```sql
CREATE TABLE enterprises (
    enterprise_id     SERIAL PRIMARY KEY,
    enterprise_name   VARCHAR(200) NOT NULL,
    industry          VARCHAR(100),          -- 行业
    logo_url          VARCHAR(500),
    description       TEXT,                  -- 企业简介
    contact_person    VARCHAR(50),
    contact_phone     VARCHAR(20),
    website_url       VARCHAR(500),
    cooperation_type  TEXT[] DEFAULT '{}',   -- ['实习','校招','竞赛赞助','产学研']
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

#### ② `competition_enterprises` — 竞赛与企业关联表（F8）
```sql
CREATE TABLE competition_enterprises (
    id                SERIAL PRIMARY KEY,
    competition_id    INT REFERENCES competitions(competition_id) ON DELETE CASCADE,
    enterprise_id     INT REFERENCES enterprises(enterprise_id) ON DELETE CASCADE,
    cooperation_desc  TEXT,                  -- "获奖选手可直接获得面试机会"
    display_order     INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(competition_id, enterprise_id)
);
```

#### ③ `learning_resources` — 学习资源表（F7）
```sql
CREATE TABLE learning_resources (
    resource_id       SERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    resource_type     VARCHAR(30) NOT NULL,  -- video / article / case_study / guide / external_link
    -- 关联
    competition_id    INT REFERENCES competitions(competition_id),  -- 可选：关联特定竞赛
    category          VARCHAR(50),           -- '入门指南' / '备赛攻略' / '获奖案例' / '技能提升'
    -- 内容
    description       TEXT,
    cover_image_url   VARCHAR(500),
    content_url       VARCHAR(500) NOT NULL, -- 视频链接/文章URL/PDF地址
    content_text      TEXT,                  -- 内嵌文本内容（可选）
    author            VARCHAR(100),
    -- 排序与统计
    sort_order        INT DEFAULT 0,
    view_count        INT DEFAULT 0,
    is_recommended    BOOLEAN DEFAULT FALSE, -- 管理员推荐
    is_active         BOOLEAN DEFAULT TRUE,
    tags              TEXT[] DEFAULT '{}',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 修改现有表

#### ① `competitions` 表 — 新增字段（F1, F6）
```sql
-- 新增字段
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS
    school_level_info JSONB DEFAULT '{}';
    -- 校赛信息: {"organizer":"计通学院","contact":"张老师","location":"云塘校区B102","notice_url":"..."}

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS
    registration_notes TEXT DEFAULT '';
    -- 报名注意事项（在报名入口前展示）

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS
    related_links JSONB DEFAULT '[]';
    -- 相关链接: [{"title":"竞赛官网","url":"..."},{"title":"往届真题","url":"..."}]

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS
    allowed_colleges INT[] DEFAULT '{}';
    -- 允许报名的学院ID数组，空数组=所有学院可报

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS
    college_restriction_note TEXT DEFAULT '';
    -- 限制原因说明: "仅限土木工程学院报名"
```

#### ② `users` 表 — 已有 `has_seen_guide` 字段（F3）
现有 schema 已包含 `has_seen_guide BOOLEAN DEFAULT FALSE` 和 `guide_seen_at TIMESTAMPTZ`，无需修改。

### 3.3 新增视图

#### `competition_admin_dashboard` — 竞赛会长工作台视图（F2）
```sql
CREATE VIEW competition_admin_dashboard AS
SELECT
    comp.competition_id,
    comp.name AS competition_name,
    cc.category_name,
    cc.category_level,
    comp.status,
    comp.current_participants,
    comp.max_participants,
    COUNT(r.registration_id) AS total_registrations,
    COUNT(CASE WHEN r.status = 'draft' THEN 1 END) AS draft_count,
    COUNT(CASE WHEN r.status IN ('applied','school_review') THEN 1 END) AS pending_review_count,
    COUNT(CASE WHEN r.status = 'school_passed' THEN 1 END) AS passed_count,
    COUNT(CASE WHEN r.status = 'school_rejected' THEN 1 END) AS rejected_count
FROM competitions comp
JOIN competition_categories cc ON cc.category_id = comp.category_id
LEFT JOIN registrations r ON r.competition_id = comp.competition_id
GROUP BY comp.competition_id, comp.name, cc.category_name, cc.category_level, comp.status,
         comp.current_participants, comp.max_participants;
```

### 3.4 Schema 变更汇总

| 操作 | 对象 | 说明 |
|------|------|------|
| CREATE TABLE | `enterprises` | 企业信息（空表） |
| CREATE TABLE | `competition_enterprises` | 竞赛-企业关联 |
| CREATE TABLE | `learning_resources` | 学习资源 |
| ALTER TABLE | `competitions` | +5 字段 |
| CREATE VIEW | `competition_admin_dashboard` | 会长工作台 |
| **总计** | **3 新表 + 1 视图 + 1 表修改** | |

---

## 四、各功能模块详细设计

### F1: 校赛→省赛→国赛分级报名流程

**现状分析**:
- 数据库 `registrations` 表已有完整的状态机：`draft → applied → school_review → school_passed → provincial_applied → provincial_review → provincial_passed → national_applied → ...`
- 触发器 `enforce_registration_status_transition()` 已防止非法跳转
- V1 `registration-v2.js` 使用 `applications` 表（非 `registrations`），状态为 `draft/submitted/under_review/approved/rejected/withdrawn`
- V2 `useRegistration.ts` 同样使用 `applications` 表

**改进方案**:

1. **V1 前端 (`js/registration-v2.js`)**:
   - 在 `showApplicationTypeSelector()` 之前，新增 `showCompetitionLevelInfo(compId)` 函数
   - 展示该竞赛的校赛/省赛/国赛信息、流程图、注意事项、相关链接
   - 报名时明确选择报名级别（校赛/省赛/国赛），校赛通过后才能报省赛
   - 修改 `createApplication()` 增加参数 `level`

2. **V2 前端 (`src/composables/useRegistration.ts` + `src/pages/RegistrationPage.vue`)**:
   - Application 接口新增 `registration_level` 字段
   - 报名页面顶部增加竞赛流程信息卡片
   - 根据用户已有报名状态，自动禁用不可报名的级别按钮

3. **竞赛详情页**:
   - V1: `showCompDetail()` 增加校赛流程、报名流程、注意事项展示区
   - V2: `CompetitionDetailPage.vue` 增加流程信息组件

### F2: 竞赛会长独立管理板块（权限隔离）

**现状分析**:
- 数据库 `user_roles` 表已有 `scope_type` / `scope_competition_id` 字段
- V1 `admin-v2.js` 的 `renderAdminV2()` 查询所有 applications，无权限过滤
- V2 `router/index.ts` 管理后台只有 `requiresAdmin: true`，无细分权限

**改进方案**:

1. **V1 前端 (`js/admin-v2.js`)**:
   - `renderAdminV2()` 入口处增加角色判断逻辑：
     - `super_admin` → 显示全局看板 + 所有竞赛
     - `college_admin` → 仅显示本院竞赛
     - `competition_admin` → 仅显示 `scope_competition_id` 对应的竞赛
   - 新增 `renderCompetitionAdminDashboard(competitionId)` 函数
   - 每个竞赛独立 Tab/板块，不可切换到其他竞赛
   - 新增报名审核推送：报名提交后自动创建 notification 推送给对应竞赛会长

2. **V2 前端**:
   - `src/stores/auth.ts` 增加 `userScopes` 计算属性
   - `src/router/index.ts` 管理路由增加 `meta.requiresCompetitionAdmin`
   - 新增 `src/pages/admin/CompetitionAdminPage.vue` — 单竞赛管理页
   - 路由: `/admin/competition/:id` — 仅能访问自己负责的竞赛

3. **通知推送**:
   - 学生提交报名时，前端调用 `notifications` 表 INSERT
   - `user_id` = 该竞赛的 `competition_admin` 的 `user_id`
   - `notification_type` = `'registration_submitted'`
   - `action_url` = `/admin/competition/{competitionId}`

### F3: 新手引导（A/B类科普、一次性提示）

**现状分析**:
- 数据库 `users` 表已有 `has_seen_guide` 和 `guide_seen_at` 字段
- 触发器 `send_welcome_notification()` 已在新用户注册时发送通知
- 前端目前无新手引导弹窗

**改进方案**:

1. **V1 前端**:
   - 新增 `js/onboarding.js` 模块
   - 首次登录检测 `has_seen_guide === false`，弹出全屏引导 Modal
   - 内容包含：
     - A/B+/B-/C/D/E 类竞赛含义解释（配图/图标）
     - 校赛→省赛→国赛流程图
     - 平台功能导航概览
   - 用户点击"我已了解"后，UPDATE `users SET has_seen_guide = true`
   - 竞赛列表页首次进入时，弹出分类说明气泡（一次性）

2. **V2 前端**:
   - 新增 `src/components/OnboardingGuide.vue`
   - 使用 Element Plus `el-dialog` + `el-steps` 实现分步引导
   - 在 `App.vue` 或 `HomePage.vue` 中检测并显示

### F4: AI 聊天滚动跳转 Bug 修复

**现状分析**:
- V1 `ai-chat.js` 中 `addChatMessage()` 每次都执行 `container.scrollTop = container.scrollHeight`
- 加载历史消息时，所有消息依次 appendChild，每次都触发 scrollTop 跳转
- 用户查看历史消息时被强制跳到底部

**修复方案**:

1. **V1 前端 (`js/ai-chat.js`)**:
   - 新增参数 `scrollToBottom` 控制是否自动滚动
   - `addChatMessage(role, content, save, scrollToBottom = true)` — 默认行为不变
   - 新增 `loadChatHistory()` 函数：加载历史消息时设置 `scrollToBottom = false`
   - 加载完成后，scrollTo 保存的位置（加载前的 scrollTop）
   - 修改 `finishStreamingMessage()` 确保流式消息完成后才滚动

2. **V2 前端**:
   - V2 的 AI 聊天是本地关键词匹配，无此问题（不涉及流式 + 历史加载）
   - 但建议在 `useAiChat.ts` 中也加入同样的防跳转逻辑作为预防

### F5: 首页改版（底部三入口→校赛了解模块）

**现状分析**:
- V1 首页底部有工具箱等入口
- V2 `HomePage.vue` 为独立页面

**改进方案**:

1. **V1 前端**:
   - 首页底部区域改为"了解校赛"入口模块
   - 包含：
     - "校赛流程"卡片 → 展示校赛→省赛→国赛完整流程
     - "报名流程"卡片 → 展示报名步骤指南
     - "查看校赛"卡片 → 直接跳转到校赛列表（筛选 level=school）
     - "立即报名"快捷入口 → 跳转到可报名的校赛列表

2. **V2 前端 (`src/pages/HomePage.vue`)**:
   - 重新设计首页底部区域
   - 新增"竞赛指南"section，包含流程图和快捷入口
   - 新增路由 `/guide` → `src/pages/GuidePage.vue`（竞赛全流程介绍页）

### F6: 基于学院的竞赛推荐（可报/不可报标注）

**现状分析**:
- `competitions` 表新增 `allowed_colleges` 和 `college_restriction_note` 字段
- 用户注册时填写 `college_id`
- 目前无学院维度的筛选和推荐

**改进方案**:

1. **V1 前端 (`js/competition-hub.js` + `js/pages-competition.js`)**:
   - `renderCompAll()` 中根据当前用户的 `college_id` 标注每个竞赛：
     - ✅ 可报名（绿色标记）
     - ⚠️ 限制报名（黄色标记 + 原因说明）
     - 默认不筛选，但提供"只看可报"筛选按钮
   - 新增 `filterByMyCollege()` 函数

2. **V2 前端 (`src/composables/useCompetitions.ts`)**:
   - 新增 `useCollegeRecommendations()` composable
   - 返回 `{ recommended, restricted, unrestricted }` 三类竞赛
   - 竞赛卡片上显示学院匹配状态标签

3. **数据库**:
   - 通过 `competitions.allowed_colleges` 字段实现
   - 空数组 = 所有学院可报
   - 有值 = 仅列出的学院可报

### F7: 学习资源模块（视频、案例、全流程介绍）

**现状分析**:
- `knowledge_documents` 表已有 `source_type: guide/case_study` 等类型
- 但缺少专门的学习资源管理（视频链接、外部教程等）

**改进方案**:

1. **数据库**: 新增 `learning_resources` 表（见 3.1）

2. **V1 前端**:
   - 新增 `js/learning-resources.js` 模块
   - 导航栏增加"学习资源"入口
   - 页面结构：
     - 顶部：推荐资源轮播
     - 分类 Tab：入门指南 / 备赛攻略 / 获奖案例 / 技能提升
     - 资源卡片：封面图 + 标题 + 类型标签 + 浏览量
   - 竞赛详情页增加"学习资源"Tab

3. **V2 前端**:
   - 新增 `src/pages/LearningResourcesPage.vue`
   - 新增 `src/composables/useLearningResources.ts`
   - 路由: `/learning` → 学习资源列表
   - 路由: `/learning/:id` → 资源详情

### F8: 企业就业标注（空表 + 管理后台）

**现状分析**:
- 用户明确要求"先建空表 + 管理后台"
- 企业可以标注就业途径，让学生知道竞赛→就业的路径

**改进方案**:

1. **数据库**: 新增 `enterprises` + `competition_enterprises` 表（见 3.1）

2. **V1 管理后台**:
   - `admin-v2.js` 新增"企业管理"Tab
   - 功能：添加/编辑/删除企业，关联到竞赛
   - 前端展示：竞赛详情页显示"合作企业"板块，标注就业途径

3. **V2 管理后台**:
   - 新增 `src/pages/admin/EnterprisesPage.vue`
   - 路由: `/admin/enterprises`

4. **前端展示**:
   - 竞赛卡片上显示企业合作标签（如"🏆 获奖可获XX公司实习机会"）
   - 竞赛详情页增加"就业机会"板块

---

## 五、V1 前端文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `js/onboarding.js` | **新增** | 新手引导模块（A/B类科普、一次性提示） |
| `js/learning-resources.js` | **新增** | 学习资源模块（视频、案例、全流程） |
| `js/competition-hub.js` | 修改 | `fetchCompetitions()` 增加学院匹配标注 |
| `js/registration-v2.js` | 修改 | 增加校赛/省赛/国赛级别选择、流程信息展示 |
| `js/admin-v2.js` | 修改 | 权限隔离（会长只看自己竞赛）、企业/资源管理 |
| `js/ai-chat.js` | 修改 | 修复历史消息加载时滚动跳转 Bug |
| `js/pages-competition.js` | 修改 | 竞赛详情增加校赛流程、学习资源、企业信息、注意事项 |
| `js/auth.js` | 修改 | 登录后检测 `has_seen_guide`，触发新手引导 |
| `js/navigation.js` | 修改 | 增加"学习资源"和"竞赛指南"路由 |
| `js/notifications.js` | 修改 | 报名提交后推送通知给竞赛会长 |
| `index.html` | 修改 | 引入新 JS 模块、首页底部改版 |
| `css/style.css` | 修改 | 新增引导弹窗、资源卡片、流程图样式 |

---

## 六、V2 前端文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/OnboardingGuide.vue` | **新增** | 新手引导组件 |
| `src/pages/GuidePage.vue` | **新增** | 竞赛全流程指南页 |
| `src/pages/LearningResourcesPage.vue` | **新增** | 学习资源列表页 |
| `src/pages/admin/CompetitionAdminPage.vue` | **新增** | 单竞赛管理页（会长用） |
| `src/pages/admin/EnterprisesPage.vue` | **新增** | 企业管理页 |
| `src/pages/admin/LearningResourcesAdmin.vue` | **新增** | 学习资源管理页 |
| `src/composables/useLearningResources.ts` | **新增** | 学习资源数据逻辑 |
| `src/composables/useCollegeRecommendations.ts` | **新增** | 学院推荐逻辑 |
| `src/composables/useRegistration.ts` | 修改 | 增加报名级别、流程信息 |
| `src/composables/useCompetitions.ts` | 修改 | 学院匹配标注 |
| `src/composables/useAiChat.ts` | 修改 | 预防滚动跳转 |
| `src/stores/auth.ts` | 修改 | 增加 userScopes 计算属性 |
| `src/types/competition.ts` | 修改 | Competition 接口增加新字段 |
| `src/router/index.ts` | 修改 | 新增路由（guide, learning, admin子路由） |
| `src/pages/HomePage.vue` | 修改 | 首页底部改版 |
| `src/pages/CompetitionDetailPage.vue` | 修改 | 增加流程、资源、企业板块 |
| `src/pages/RegistrationPage.vue` | 修改 | 增加级别选择、注意事项 |
| `src/pages/admin/AdminLayout.vue` | 修改 | 侧边栏增加新菜单 |

---

## 七、后端变更

当前后端（Vultr:3101）仅提供 `/api/chat`（MiniMax SSE）和 `/api/login`（JWT）。

本次改动**不涉及后端 API 变更**，所有新功能通过 Supabase REST API / SDK 直接操作数据库。

如后续需要：
- 报名审核推送可使用 Supabase Realtime（已内置）
- 文件上传可使用 Supabase Storage（已内置）

---

## 八、执行顺序与依赖关系

```
Phase 2A: 数据库变更（无前端依赖）
  ├── 部署 3 张新表
  ├── ALTER competitions 表（+5 字段）
  └── 创建 competition_admin_dashboard 视图

Phase 2B: V1 前端核心功能（依赖 2A）
  ├── F4: AI 聊天滚动修复（独立，可并行）
  ├── F3: 新手引导模块
  ├── F1: 分级报名流程改造
  ├── F2: 管理后台权限隔离
  ├── F6: 学院推荐标注
  ├── F5: 首页改版
  ├── F7: 学习资源模块
  └── F8: 企业就业标注

Phase 2C: V2 前端核心功能（依赖 2A）
  ├── F4: AI 聊天预防性修复
  ├── F3: 新手引导组件
  ├── F1: 分级报名改造
  ├── F2: 管理后台权限隔离
  ├── F6: 学院推荐
  ├── F5: 首页改版
  ├── F7: 学习资源页
  └── F8: 企业管理页

Phase 2D: 验证与文档
  ├── 功能验证测试
  ├── 更新 HANDOFF.md
  └── 更新 PROJECT-STATUS.md
```

---

## 九、风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| V1 Supabase REST API 返回 HTTP 400 | 高 | 需先排查修复，否则新功能无法使用线上数据 |
| V2 TypeScript 接口与数据库列名不匹配 | 高 | 统一接口定义，确保与 schema 列名一致 |
| RLS 未启用，数据无安全隔离 | 中 | 本次先不启用 RLS，通过前端权限控制 + 后续启用 |
| 新增表需要刷新物化视图 | 低 | 新表不参与现有物化视图，无需刷新 |

---

## 十、待确认事项

1. **V1 Supabase HTTP 400 问题**: 需要先排查修复，否则所有依赖 Supabase 的新功能在 V1 上无法生效
2. **企业数据**: 用户说"先建空表"，后续由管理员在后台添加
3. **学习资源数据**: 是否需要预置一些资源？还是也先空表？
4. **竞赛学院限制**: 目前大部分竞赛未设置 `allowed_colleges`，默认所有学院可报，后续由管理员配置

---

> **蓝图与任务拆解如上，是否同意开始执行？**
> 如有修改意见请指出，确认后我将按照 Phase 2A → 2B → 2C → 2D 的顺序逐步实施。
