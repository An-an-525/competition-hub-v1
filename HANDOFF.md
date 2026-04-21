# HANDOFF.md — 长沙理工大学学科竞赛数智化平台 数据库交接文档

> 更新时间：2026-04-21（功能改进后 v3）
> 项目：Competition Hub (竞赛助手) v2.0
> Supabase 项目：`fdbbcibmqaogsbasoqly`

---

## 一、数据库总计

| 数据类型 | 数量 | 目标表 |
|---------|------|--------|
| 学院信息 | 25个（含院长、电话） | `colleges` |
| 竞赛分类 | 7个（A/B+/B-/C/D/E/校级） | `competition_categories` |
| 竞赛项目 | 98项（含描述、主办方、难度） | `competitions` |
| 专业信息 | 68个 | `majors` |
| 校园新闻/通知 | 89条 | `knowledge_documents` (notice) |
| 管理规则 | 9份 | `knowledge_documents` (policy) |
| 角色种子数据 | 4条 | `roles` |
| 企业信息 | 0（空表，待管理员添加） | `enterprises` |
| 学习资源 | 0（空表，待管理员添加） | `learning_resources` |
| **总计** | **300+条** | |

---

## 二、Schema 结构 (28 表 + 2 物化视图 + 4 视图 + 5 触发器)

### 数据表

| 表名 | 记录数 | 说明 |
|------|--------|------|
| `colleges` | 25 | 学院信息（含院长、电话） |
| `majors` | 68 | 本科专业 |
| `competition_categories` | 7 | A/B+/B-/C/D/E/校级 |
| `competitions` | 98 | 竞赛项目（含描述、难度、主办方、校赛信息、注意事项、相关链接、学院限制） |
| `competition_milestones` | 0 | 竞赛里程碑模板 |
| `users` | 0 | 用户主表（含 has_seen_guide 新手引导标记） |
| `roles` | 4 | RBAC 角色（super_admin/college_admin/competition_admin/student） |
| `user_roles` | 0 | 用户角色关联（含 scope_type/scope_competition_id 权限隔离） |
| `integrity_logs` | 0 | 诚信记录 |
| `teams` | 0 | 团队表 |
| `team_members` | 0 | 团队成员 |
| `registrations` | 0 | 报名记录（含校赛→省赛→国赛状态机） |
| `team_match_suggestions` | 0 | 组队推荐 |
| `team_templates` | 0 | 黄金战队模板 |
| `judging_sessions` | 0 | 评审会话 |
| `certificates` | 0 | 电子证书 |
| `competition_documents` | 0 | 竞赛文档 |
| `knowledge_documents` | 98 | 知识库（89新闻+9规则） |
| `ai_conversations` | 0 | AI 对话 |
| `ai_messages` | 0 | AI 消息 |
| `community_posts` | 0 | 社区帖子 |
| `community_comments` | 0 | 社区评论 |
| `point_records` | 0 | 积分记录 |
| `notifications` | 0 | 统一通知（含报名审核推送） |
| `audit_logs` | 0 | 审计日志 |
| **`enterprises`** | **0** | **🆕 企业就业信息表** |
| **`competition_enterprises`** | **0** | **🆕 竞赛-企业关联表** |
| **`learning_resources`** | **0** | **🆕 学习资源表（视频/案例/攻略/外链）** |

### 视图

| 视图名 | 说明 |
|--------|------|
| `user_competition_profile` | 用户竞赛档案 |
| `open_registrations` | 当前可报名竞赛 |
| `admin_global_dashboard` | 超级管理员全局看板 |
| **`competition_admin_dashboard`** | **🆕 竞赛会长工作台（权限隔离）** |

### competitions 表新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `school_level_info` | JSONB | 校赛信息（主办方、联系方式、地点、通知链接） |
| `registration_notes` | TEXT | 报名注意事项 |
| `related_links` | JSONB | 相关链接数组 |
| `allowed_colleges` | INT[] | 允许报名的学院ID（空=所有学院可报） |
| `college_restriction_note` | TEXT | 学院限制原因说明 |

---

## 三、功能改进清单（2026-04-21 实施）

### 已完成功能

| # | 功能 | V1 | V2 | 数据库 |
|---|------|----|----|--------|
| F1 | 校赛→省赛→国赛分级报名 | ✅ | ✅ | ✅ 状态机已有 |
| F2 | 竞赛会长独立管理板块（权限隔离） | ✅ | ✅ | ✅ user_roles.scope |
| F3 | 新手引导（A/B类科普、一次性提示） | ✅ | ✅ | ✅ has_seen_guide |
| F4 | AI 聊天滚动跳转修复 | ✅ | — | — |
| F5 | 首页改版（了解校赛模块） | ✅ | ✅ | — |
| F6 | 基于学院的竞赛推荐（可报/不可报标注） | ✅ | ✅ | ✅ allowed_colleges |
| F7 | 学习资源模块（视频、案例、全流程） | ✅ | ✅ | ✅ learning_resources |
| F8 | 企业就业标注（空表+管理后台） | ✅ | ✅ | ✅ enterprises |

---

## 四、文件变更清单

### V1 前端（新增 2 文件 + 修改 6 文件）

| 文件 | 操作 | 关键改动 |
|------|------|----------|
| `js/onboarding.js` | **新增** | 新手引导（3步：分类说明→参赛流程→平台功能） |
| `js/learning-resources.js` | **新增** | 学习资源模块（列表+详情+管理CRUD） |
| `js/ai-chat.js` | 修改 | `addChatMessage` 增加 `scrollToBottom` 参数；新增 `loadChatHistory()` |
| `js/registration-v2.js` | 修改 | 新增 `showCompetitionLevelInfo()`；分级报名（校赛/省赛/国赛）；提交后推送通知 |
| `js/admin-v2.js` | 修改 | `fetchAdminScope()` 权限隔离；新增企业管理、学习资源管理、全局看板 |
| `js/pages-competition.js` | 修改 | 学院可报标签、企业合作标签、`filterByMyCollege()`、竞赛详情增强 |
| `js/navigation.js` | 修改 | 新增 `learning`/`guide` 路由、`renderGuidePage()` |
| `js/auth.js` | 修改 | 登录/注册后触发 `checkAndShowOnboarding()` |
| `index.html` | 修改 | 引入新JS模块、导航新增入口、首页"了解校赛"板块 |

### V2 前端（新增 5 文件 + 修改 6 文件）

| 文件 | 操作 | 关键改动 |
|------|------|----------|
| `src/pages/GuidePage.vue` | **新增** | 竞赛指南页（分类+流程+报名+FAQ） |
| `src/pages/LearningResourcesPage.vue` | **新增** | 学习资源列表页（分类Tab+详情弹窗） |
| `src/components/OnboardingGuide.vue` | **新增** | 新手引导组件（el-dialog 3步引导） |
| `src/pages/admin/EnterprisesPage.vue` | **新增** | 企业管理后台（CRUD表格） |
| `src/pages/admin/LearningResourcesAdmin.vue` | **新增** | 学习资源管理后台（CRUD表格） |
| `src/types/competition.ts` | 修改 | 新增 LearningResource/Enterprise 接口、REGISTRATION_STATUS_MAP |
| `src/composables/useRegistration.ts` | 修改 | 新增 `checkRegistrationLevelAvailability()`、`createNotification()` |
| `src/composables/useCompetitions.ts` | 修改 | 新增 `toggleMyCollegeFilter()`、`fetchCompetitionEnterprises()` |
| `src/router/index.ts` | 修改 | 新增 /guide、/learning、/admin/enterprises、/admin/resources 路由 |
| `src/pages/HomePage.vue` | 修改 | 新增"了解校赛"4卡片板块 |
| `src/pages/admin/AdminLayout.vue` | 修改 | 侧边栏新增"企业管理"和"学习资源"菜单 |

---

## 五、Supabase 连接信息

| 项目 | 值 |
|------|-----|
| Supabase URL | `https://fdbbcibmqaogsbasoqly.supabase.co` |
| Project Ref | `fdbbcibmqaogsbasoqly` |
| Region | Southeast Asia (ap-southeast-1) |
| DB Password | `B7syrjI3PjpOmSZv` |
| Management API | `https://api.supabase.com/v1/projects/fdbbcibmqaogsbasoqly/database/query` |

---

## 六、注意事项

1. **RLS 策略未启用**：所有业务表未启用 Row Level Security
2. **企业/学习资源为空表**：需管理员在后台添加数据
3. **V1 Supabase REST API HTTP 400**：前端回退到本地 data.js（55项），非数据库（98项），需排查
4. **V2 TypeScript 接口与数据库列名不完全匹配**：Competition 接口的 `name` vs 数据库 `competition_name` 等
5. **报名功能依赖 profiles 表**：V1/V2 均使用 `profiles` 表做认证，非 `users` 表
6. **权限隔离依赖前端**：当前通过前端 `fetchAdminScope()` 过滤，未启用 RLS

---

## 七、相关文件

| 文件 | 说明 |
|------|------|
| `csust_competition_v2_schema.sql` | 完整 DDL Schema (780行) |
| `.trae/documents/feature-improvement-blueprint.md` | 功能改进技术方案设计文档（蓝图） |
| `竞赛助手_数据库专业审计报告.docx` | 审计报告（补充前基线） |
| `PROJECT-STATUS.md` | 项目状况总结 |
| `competition-hub-v2-plan.md` | v2.0 重建计划书 |
