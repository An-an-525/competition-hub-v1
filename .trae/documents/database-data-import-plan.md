# 数据库验收对齐计划：补齐其他 Agent 收集的数据

## 一、任务理解

### 1.1 目标
截图显示另一个 Agent 已完成的工作包含：
- **校园新闻** 926条 → 对应 `knowledge_documents` 表
- **竞赛项目** 130项 → 对应 `competitions` 表
- **学院信息** 24个 → 对应 `colleges` 表
- **管理规则** 9份 → 对应 `knowledge_documents` 表（source_type='policy'）

但当前数据库（v2 Schema）中除 `roles` 有4条种子数据外，**所有业务表均为空**。需要将本地已有的数据导入到 Supabase 数据库中。

### 1.2 约束
- 必须使用 Supabase Management API（`POST /v1/projects/{ref}/database/query`）执行 SQL
- Access Token 可能已过期，需验证或重新获取
- 数据需适配 v2 Schema 的字段结构（与旧 Schema 不同）
- 需要生成 HANDOFF.md 交接文档

### 1.3 成功标准
- `colleges` 表 ≥ 24 条记录
- `competitions` 表 ≥ 130 条记录（或 JSON 中可用的全部竞赛数据）
- `knowledge_documents` 表包含校园新闻 + 管理规则
- 生成 HANDOFF.md 文档

---

## 二、当前状态分析

### 2.1 数据库现状（已验证）
| 对象 | 数量 | 状态 |
|------|------|------|
| 表 | 25 | ✅ 全部创建 |
| 物化视图 | 2 | ✅ |
| 普通视图 | 3 | ✅ |
| 触发器 | 5个(7事件) | ✅ |
| 函数 | 5 | ✅ |
| 索引 | 64 | ✅ |
| roles 种子数据 | 4 | ✅ |
| **其他业务数据** | **0** | ❌ 需补齐 |

### 2.2 可用数据源
| 数据 | 本地文件 | 记录数 | 目标表 |
|------|---------|--------|--------|
| 竞赛项目 | `competition-hub-v2/src/data/csust_competitions_ref.json` | 32条 | `competitions` + `competition_categories` |
| 校园新闻 | `competition-hub-v2/src/data/csust_notices.json` | 75条 | `knowledge_documents` |
| 学院信息 | 需从竞赛数据中提取 department 字段 | ~24个 | `colleges` |
| 管理规则 | 需从长理官网抓取或本地查找 | 9份 | `knowledge_documents` |

### 2.3 数据量差距
截图声称的数据量（926新闻、130竞赛）远大于本地文件实际拥有的数据（75新闻、32竞赛）。这意味着：
- 其他 Agent 可能直接从网页抓取了更多数据并写入旧 Schema
- 旧 Schema 已被 DROP 替换为 v2 Schema，数据丢失
- **可行方案**：先导入本地已有的数据，再通过网页抓取补充不足部分

---

## 三、执行计划

### Step 1: 验证 Access Token 有效性
- 用一个简单 SELECT 查询测试 token 是否过期
- 如已过期，需通过浏览器重新登录获取新 token

### Step 2: 导入学院数据（colleges）
- 从 `csust_competitions_ref.json` 的 `department` 字段提取去重，得到学院列表
- 补充 `college_code`（如 JTX、DQ 等）
- INSERT INTO colleges (college_name, college_code, dean_name) VALUES ...

### Step 3: 导入竞赛分类数据（competition_categories）
- 从 JSON 的 `category` 字段提取：A类、B+类、B-类、C类
- INSERT INTO competition_categories (category_name, category_level, category_type) VALUES ...

### Step 4: 导入竞赛项目数据（competitions）
- 将 32 条竞赛数据映射到 v2 Schema 的 `competitions` 表
- 字段映射：name→name, category→category_id(关联), level→level, organizer→organizer_name, department→hosting_college_id(关联)
- INSERT INTO competitions ...

### Step 5: 导入校园新闻（knowledge_documents）
- 将 75 条通知数据映射到 `knowledge_documents` 表
- 字段映射：title→title, publish_date→created_at, url→source_url, content→content_text, keywords→tags
- source_type = 'notice'

### Step 6: 补充管理规则数据
- 搜索长理官网获取竞赛管理规则文档
- 或从本地 `ddl.sql` 中的 `official_notices` 表结构推断
- INSERT INTO knowledge_documents (source_type='policy') ...

### Step 7: 刷新物化视图
- REFRESH MATERIALIZED VIEW college_competition_stats;
- REFRESH MATERIALIZED VIEW global_competition_dashboard;

### Step 8: 验证数据完整性
- 查询各表记录数
- 验证外键关联正确性
- 验证物化视图数据

### Step 9: 生成 HANDOFF.md 交接文档
- 记录所有已导入的数据
- 记录 Schema 结构
- 记录 API 凭证和连接信息
- 记录注意事项（RLS 策略、字段映射等）

---

## 四、假设与决策

1. **数据量差距处理**：截图中的 926/130 数据量是旧 Schema 时代的，当前以本地实际可用数据为准，不足部分通过抓取补充
2. **学院数据**：从竞赛 JSON 的 department 字段提取，约 24 个唯一学院
3. **管理规则**：如果无法从官网获取，则从已有知识库或公开信息中整理
4. **RLS 策略**：v2 Schema 当前未启用 RLS（与截图中的"所有新表都启用了RLS"不一致），需要决定是否补充

---

## 五、验证步骤

1. `SELECT count(*) FROM colleges` → 应 ≥ 20
2. `SELECT count(*) FROM competitions` → 应 ≥ 30
3. `SELECT count(*) FROM competition_categories` → 应 ≥ 4
4. `SELECT count(*) FROM knowledge_documents` → 应 ≥ 75
5. `SELECT * FROM college_competition_stats LIMIT 5` → 物化视图有数据
6. HANDOFF.md 文件存在于 /workspace/
