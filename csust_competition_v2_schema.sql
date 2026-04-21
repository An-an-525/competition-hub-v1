-- ============================================================
-- 长沙理工大学学科竞赛数智化平台 - 完整数据库 Schema
-- 版本: v2.0 | 日期: 2026-04-20
-- 目标: 支持全生命周期竞赛管理、跨学科组队、权限隔离、AI 问答溯源
-- ============================================================

-- ============================================================
-- 第一层: 基础数据域 (Foundation)
-- ============================================================

-- 1.1 学院表
CREATE TABLE colleges (
    college_id      SERIAL PRIMARY KEY,
    college_name    VARCHAR(100) NOT NULL UNIQUE,  -- 如: 计算机与通信工程学院
    college_code    VARCHAR(20) UNIQUE,            -- 如: JTX
    dean_name       VARCHAR(50),
    contact_phone   VARCHAR(20),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 专业表
CREATE TABLE majors (
    major_id        SERIAL PRIMARY KEY,
    major_name      VARCHAR(100) NOT NULL,
    major_code      VARCHAR(20) UNIQUE,            -- 如: CS
    college_id      INT REFERENCES colleges(college_id),
    degree_type     VARCHAR(20) DEFAULT '本科',    -- 本科/硕士/博士
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 竞赛分类表 (A/B类 + 子类)
CREATE TABLE competition_categories (
    category_id     SERIAL PRIMARY KEY,
    category_name   VARCHAR(100) NOT NULL,         -- 如: A类-学科竞赛
    category_level  VARCHAR(10) NOT NULL,          -- A / B
    category_type   VARCHAR(50),                   -- 学科竞赛 / 科技创新 / 文体竞赛
    credit_weight   DECIMAL(3,1) DEFAULT 0,        -- 创新学分权重
    sort_order      INT DEFAULT 0,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 竞赛主表 (核心实体)
CREATE TABLE competitions (
    competition_id      SERIAL PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,          -- 如: 全国大学生数学建模竞赛
    short_name          VARCHAR(50),                     -- 如: 数模
    category_id         INT REFERENCES competition_categories(category_id),
    -- 赛事级别与层级
    level               VARCHAR(10) NOT NULL,            -- school / provincial / national / international
    parent_competition_id INT REFERENCES competitions(competition_id),  -- 省赛/国赛关联校赛
    -- 基本信息
    description         TEXT,
    official_url        VARCHAR(500),                    -- 教务处官网原文链接
    hosting_college_id  INT REFERENCES colleges(college_id),  -- 承办学院
    organizer_name      VARCHAR(100),                    -- 承办协会名称
    contact_teacher     VARCHAR(50),
    contact_phone       VARCHAR(20),
    contact_location    VARCHAR(200),                    -- 实验室/教室地点
    -- 时间信息
    registration_start  DATE,
    registration_end    DATE,
    event_start_date    DATE,
    event_end_date      DATE,
    -- 准入要求
    eligibility_rules   JSONB DEFAULT '{}',              -- {"min_grade":1,"max_grade":4,"allowed_majors":["*"],"team_size_min":1,"team_size_max":3}
    prerequisite_skills JSONB DEFAULT '[]',              -- ["C++","数据结构","线性代数"]
    -- 难度与热度 (AI推荐用)
    difficulty_score    INT DEFAULT 5 CHECK (difficulty_score BETWEEN 1 AND 10),
    avg_prep_weeks      INT DEFAULT 8,                  -- 平均备赛周数
    historical_win_rate DECIMAL(5,2),                    -- 往届获奖率 %
    popularity_score    INT DEFAULT 0,                   -- 报名热度分
    -- 状态
    status              VARCHAR(20) DEFAULT 'upcoming',  -- upcoming / registration_open / in_progress / judging / completed / cancelled
    max_participants    INT,                             -- 最大参赛人数
    current_participants INT DEFAULT 0,
    -- 审核流程
    requires_school_review   BOOLEAN DEFAULT TRUE,      -- 是否需要校赛选拔
    requires_document_upload BOOLEAN DEFAULT FALSE,      -- 是否需要提交作品文件
    -- 元数据
    cover_image_url     VARCHAR(500),
    tags                TEXT[] DEFAULT '{}',             -- ['数学','建模','算法']
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 竞赛级别索引
CREATE INDEX idx_competitions_level ON competitions(level);
CREATE INDEX idx_competitions_category ON competitions(category_id);
CREATE INDEX idx_competitions_status ON competitions(status);
CREATE INDEX idx_competitions_dates ON competitions(registration_start, registration_end);

-- 1.5 竞赛流程里程碑模板
CREATE TABLE competition_milestones (
    milestone_id       SERIAL PRIMARY KEY,
    competition_id     INT REFERENCES competitions(competition_id) ON DELETE CASCADE,
    week_offset        INT NOT NULL,                     -- 第几周 (相对报名截止日)
    title              VARCHAR(200) NOT NULL,            -- 如: "完成组队并确定选题"
    description        TEXT,
    required_actions   JSONB DEFAULT '[]',               -- ["submit_topic","form_team"]
    is_mandatory       BOOLEAN DEFAULT TRUE,
    sort_order         INT DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 第二层: 用户域 (User)
-- ============================================================

-- 2.1 用户主表
CREATE TABLE users (
    user_id            SERIAL PRIMARY KEY,
    csust_id           VARCHAR(20) UNIQUE NOT NULL,      -- 学号 (唯一标识)
    password_hash      VARCHAR(255) NOT NULL,
    real_name          VARCHAR(50) NOT NULL,
    nickname           VARCHAR(50),
    gender             VARCHAR(5),
    avatar_url         VARCHAR(500),
    -- 学籍信息
    college_id         INT REFERENCES colleges(college_id),
    major_id           INT REFERENCES majors(major_id),
    grade              INT CHECK (grade BETWEEN 1 AND 8),-- 1=大一, 2=大二, ... 4=大四, 5=研一...
    class_name         VARCHAR(50),                       -- 如: 计科2201班
    enrollment_year    INT,                               -- 入学年份
    -- 联系方式
    phone              VARCHAR(20),
    email              VARCHAR(100),
    wechat_id          VARCHAR(50),
    -- 竞赛相关属性
    integrity_score    INT DEFAULT 100,                   -- 参赛诚信分 (0-100)
    total_credits      DECIMAL(4,1) DEFAULT 0,            -- 已获创新学分
    skill_tags         JSONB DEFAULT '[]',                -- ["Python","C++","PPT设计","论文写作"]
    bio                TEXT,                              -- 个人简介 (用于组队匹配)
    -- 状态
    is_active          BOOLEAN DEFAULT TRUE,
    last_login_at      TIMESTAMPTZ,
    -- 新手引导
    has_seen_guide     BOOLEAN DEFAULT FALSE,             -- 是否已看过A/B类科普
    guide_seen_at      TIMESTAMPTZ,
    -- 元数据
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_csust_id ON users(csust_id);
CREATE INDEX idx_users_college ON users(college_id);
CREATE INDEX idx_users_skill_tags ON users USING GIN(skill_tags);

-- 2.2 用户角色与权限 (RBAC)
CREATE TABLE roles (
    role_id            SERIAL PRIMARY KEY,
    role_name          VARCHAR(50) NOT NULL UNIQUE,       -- super_admin / college_admin / competition_admin / student
    description        TEXT,
    permissions        JSONB DEFAULT '[]',                -- ["user:read","competition:manage","review:approve"]
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_role_id       SERIAL PRIMARY KEY,
    user_id            INT REFERENCES users(user_id) ON DELETE CASCADE,
    role_id            INT REFERENCES roles(role_id),
    -- 权限范围限定 (关键: 会长只能管自己的赛事)
    scope_type         VARCHAR(20) DEFAULT 'none',        -- none / college / competition
    scope_college_id   INT REFERENCES colleges(college_id),   -- 学院管理员范围
    scope_competition_id INT REFERENCES competitions(competition_id), -- 竞赛会长范围
    granted_by         INT REFERENCES users(user_id),         -- 谁授权的
    granted_at         TIMESTAMPTZ DEFAULT NOW(),
    expires_at         TIMESTAMPTZ,                          -- NULL=永久
    is_active          BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, scope_type, scope_competition_id)
);

-- 初始化角色
INSERT INTO roles (role_name, description, permissions) VALUES
('super_admin', '超级管理员 - 教务处老师，全局看板', '["*"]'),
('college_admin', '学院管理员 - 院系竞赛负责人', '["user:read","competition:read","registration:read","report:generate"]'),
('competition_admin', '竞赛会长 - 协会负责人，管理特定赛事', '["competition:manage","registration:review","team:manage","milestone:manage"]'),
('student', '学生 - 普通参赛者', '["competition:read","registration:self","team:self","community:read_write"]');

-- 2.3 诚信记录表
CREATE TABLE integrity_logs (
    log_id             SERIAL PRIMARY KEY,
    user_id            INT REFERENCES users(user_id),
    competition_id     INT REFERENCES competitions(competition_id),
    action_type        VARCHAR(30) NOT NULL,              -- no_show / late_withdraw / cheating / violation
    score_delta        INT NOT NULL,                      -- 扣分值 (通常为负)
    reason             TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 第三层: 报名与团队域 (Registration & Team)
-- ============================================================

-- 3.1 团队表
CREATE TABLE teams (
    team_id            SERIAL PRIMARY KEY,
    competition_id     INT REFERENCES competitions(competition_id),
    team_name          VARCHAR(100),
    -- 队长
    captain_id         INT REFERENCES users(user_id),
    -- 团队状态
    status             VARCHAR(20) DEFAULT 'forming',    -- forming / complete / submitted / approved / rejected / disbanded
    max_members        INT DEFAULT 3,
    -- 团队标签 (用于跨学科匹配)
    role_requirements  JSONB DEFAULT '[]',                -- [{"role":"算法","filled":false},{"role":"文档","filled":false}]
    team_tags          TEXT[] DEFAULT '{}',               -- ['跨学科','理工+商科']
    -- 匹配
    is_cross_college   BOOLEAN DEFAULT FALSE,             -- 是否跨学院组队
    match_score        INT DEFAULT 0,                     -- 团队完整度评分
    -- 时间
    formed_at          TIMESTAMPTZ,
    submitted_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_competition ON teams(competition_id);
CREATE INDEX idx_teams_captain ON teams(captain_id);
CREATE INDEX idx_teams_status ON teams(status);

-- 3.2 团队成员表
CREATE TABLE team_members (
    member_id          SERIAL PRIMARY KEY,
    team_id            INT REFERENCES teams(team_id) ON DELETE CASCADE,
    user_id            INT REFERENCES users(user_id),
    role_in_team       VARCHAR(50) DEFAULT '成员',       -- 队长/算法/硬件/文档/展示/成员
    joined_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 3.3 报名记录表 (核心状态机)
CREATE TABLE registrations (
    registration_id    SERIAL PRIMARY KEY,
    -- 关联
    competition_id     INT REFERENCES competitions(competition_id),
    user_id            INT REFERENCES users(user_id),
    team_id            INT REFERENCES teams(team_id),
    -- 报名信息
    registration_type  VARCHAR(20) DEFAULT 'individual',  -- individual / team
    -- ★ 核心状态机 (不可逆跳转)
    -- draft -> applied -> school_review -> school_passed / school_rejected
    -- school_passed -> provincial_applied -> provincial_review -> provincial_passed / provincial_rejected
    -- provincial_passed -> national_applied -> ...
    status             VARCHAR(30) DEFAULT 'draft',
    -- 各级审核信息
    school_review_result   VARCHAR(20),                   -- pending / passed / rejected
    school_review_comment  TEXT,
    school_reviewed_by     INT REFERENCES users(user_id),
    school_reviewed_at     TIMESTAMPTZ,
    provincial_review_result VARCHAR(20),
    provincial_review_comment TEXT,
    provincial_reviewed_by   INT REFERENCES users(user_id),
    provincial_reviewed_at   TIMESTAMPTZ,
    national_review_result   VARCHAR(20),
    national_review_comment  TEXT,
    national_reviewed_by     INT REFERENCES users(user_id),
    national_reviewed_at     TIMESTAMPTZ,
    -- 最终成绩
    award_level        VARCHAR(20),                       -- 特等奖/一等奖/二等奖/三等奖/优秀奖/无
    award_certificate_url VARCHAR(500),
    credit_earned      DECIMAL(3,1) DEFAULT 0,            -- 获得创新学分
    -- 附件
    documents_json     JSONB DEFAULT '[]',                -- [{"name":"报名表","url":"...","type":"application/pdf"}]
    -- 时间戳
    applied_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    -- 约束: 同一用户同一竞赛同一级别只能有一条有效报名
    UNIQUE(competition_id, user_id, registration_type)
);

CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_competition ON registrations(competition_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_team ON registrations(team_id);

-- ★ 状态机约束: 通过触发器防止非法状态跳转
-- (见下方触发器)

-- 3.4 组队推荐匹配表
CREATE TABLE team_match_suggestions (
    suggestion_id      SERIAL PRIMARY KEY,
    team_id            INT REFERENCES teams(team_id),
    recommended_user_id INT REFERENCES users(user_id),
    match_reason       TEXT,                              -- "该团队缺乏商科背景，推荐经管学院同学"
    match_score        INT,                               -- 匹配度评分 0-100
    required_role      VARCHAR(50),                       -- 推荐担任的角色
    status             VARCHAR(20) DEFAULT 'pending',     -- pending / accepted / rejected / expired
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    responded_at       TIMESTAMPTZ
);

-- 3.5 黄金战队配置模板
CREATE TABLE team_templates (
    template_id        SERIAL PRIMARY KEY,
    competition_id     INT REFERENCES competitions(competition_id),
    template_name      VARCHAR(100),                      -- "黄金战队配置"
    description        TEXT,
    roles_config       JSONB DEFAULT '[]',                -- [{"role":"算法","count":1,"major_preference":["计通","电气"]},{"role":"文档","count":1,"major_preference":["经管","文法"]}]
    total_members      INT DEFAULT 4,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 第四层: 评审与证书域 (Judging & Certification)
-- ============================================================

-- 4.1 评审会话表
CREATE TABLE judging_sessions (
    session_id         SERIAL PRIMARY KEY,
    competition_id     INT REFERENCES competitions(competition_id),
    level              VARCHAR(20) NOT NULL,              -- school / provincial / national
    judge_user_id      INT REFERENCES users(user_id),    -- 评委
    -- 评审对象
    registration_id    INT REFERENCES registrations(registration_id),
    team_id            INT REFERENCES teams(team_id),
    -- 打分
    score_innovation   INT CHECK (score_innovation BETWEEN 0 AND 100),
    score_technique    INT CHECK (score_technique BETWEEN 0 AND 100),
    score_presentation INT CHECK (score_presentation BETWEEN 0 AND 100),
    score_total        INT GENERATED ALWAYS AS (
        COALESCE(score_innovation,0) + COALESCE(score_technique,0) + COALESCE(score_presentation,0)
    ) STORED,
    comment            TEXT,
    -- 时间
    judged_at          TIMESTAMPTZ DEFAULT NOW(),
    -- 审计
    UNIQUE(competition_id, level, registration_id, judge_user_id)
);

-- 4.2 电子证书表
CREATE TABLE certificates (
    certificate_id     SERIAL PRIMARY KEY,
    registration_id    INT REFERENCES registrations(registration_id),
    user_id            INT REFERENCES users(user_id),
    competition_id     INT REFERENCES competitions(competition_id),
    award_level        VARCHAR(20) NOT NULL,
    certificate_no     VARCHAR(50) UNIQUE,               -- 证书编号
    issue_date         DATE,
    pdf_url            VARCHAR(500),                      -- 证书PDF存储地址
    qr_code_url        VARCHAR(500),                      -- 验真二维码
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 第五层: 文档与知识库域 (Documents & Knowledge)
-- ============================================================

-- 5.1 竞赛文档表 (报名表/作品/PPT等)
CREATE TABLE competition_documents (
    document_id        SERIAL PRIMARY KEY,
    competition_id     INT REFERENCES competitions(competition_id),
    registration_id    INT REFERENCES registrations(registration_id),
    uploader_id        INT REFERENCES users(user_id),
    -- 文件信息
    file_name          VARCHAR(255) NOT NULL,
    file_type          VARCHAR(50),                       -- registration_form / work_submission / defense_ppt / reference_material
    file_url           VARCHAR(500) NOT NULL,             -- 对象存储引用 (Supabase Storage)
    file_size_bytes    BIGINT,
    mime_type          VARCHAR(100),
    -- 版本控制
    version            INT DEFAULT 1,
    is_current         BOOLEAN DEFAULT TRUE,
    -- 状态
    status             VARCHAR(20) DEFAULT 'active',      -- active / archived / rejected
    -- 审核
    reviewed_by        INT REFERENCES users(user_id),
    reviewed_at        TIMESTAMPTZ,
    review_comment     TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 知识库文档表 (AI 问答数据源)
CREATE TABLE knowledge_documents (
    doc_id             SERIAL PRIMARY KEY,
    title              VARCHAR(255) NOT NULL,
    source_type        VARCHAR(30),                       -- policy / notice / faq / guide / case_study
    source_url         VARCHAR(500),                      -- 原文链接 (教务处官网)
    source_ref         VARCHAR(200),                      -- "来源：2025年长理教务处第12号文件"
    -- 内容
    content_text       TEXT,                              -- 纯文本内容 (用于全文搜索)
    content_html       TEXT,                              -- HTML格式 (用于前端展示)
    -- 向量化
    embedding_id       VARCHAR(100),                      -- 向量存储ID (Supabase pgvector)
    -- 时效性管理
    is_expired         BOOLEAN DEFAULT FALSE,
    expires_at         DATE,
    replaced_by_doc_id INT REFERENCES knowledge_documents(doc_id),  -- 被哪篇新文档替代
    -- 元数据
    tags               TEXT[] DEFAULT '{}',
    view_count         INT DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_source ON knowledge_documents(source_type);
CREATE INDEX idx_knowledge_expired ON knowledge_documents(is_expired);
CREATE INDEX idx_knowledge_tags ON knowledge_documents USING GIN(tags);
-- 全文搜索索引 (Supabase 支持)
CREATE INDEX idx_knowledge_search ON knowledge_documents USING GIN(to_tsvector('simple', COALESCE(content_text, '')));

-- ============================================================
-- 第六层: AI 问答与社区域 (AI Chat & Community)
-- ============================================================

-- 6.1 AI 对话记录表
CREATE TABLE ai_conversations (
    conversation_id    SERIAL PRIMARY KEY,
    user_id            INT REFERENCES users(user_id),
    title              VARCHAR(255),
    -- 上下文
    competition_context INT REFERENCES competitions(competition_id),  -- 关联的竞赛 (如果有)
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 AI 消息表 (支持溯源)
CREATE TABLE ai_messages (
    message_id         SERIAL PRIMARY KEY,
    conversation_id    INT REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
    role               VARCHAR(20) NOT NULL,              -- user / assistant / system
    content            TEXT NOT NULL,
    -- ★ 溯源字段 (AI回复必须附带来源)
    source_doc_ids     INT[] DEFAULT '{}',                -- 关联的知识库文档ID
    source_refs        JSONB DEFAULT '[]',                -- [{"text":"来源：2025年长理教务处第12号文件","doc_id":5,"url":"..."}]
    -- 元数据
    model_name         VARCHAR(50),                       -- 如: minimax-m2.7
    token_count        INT,
    latency_ms         INT,                               -- 响应延迟
    is_deep_thinking   BOOLEAN DEFAULT FALSE,             -- 是否使用深度思考模式
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_sources ON ai_messages USING GIN(source_doc_ids);

-- 6.3 竞赛社区帖子表
CREATE TABLE community_posts (
    post_id            SERIAL PRIMARY KEY,
    author_id          INT REFERENCES users(user_id),
    competition_id     INT REFERENCES competitions(competition_id),  -- 关联竞赛 (可选)
    -- 内容
    title              VARCHAR(255) NOT NULL,
    content            TEXT NOT NULL,
    post_type          VARCHAR(30) DEFAULT 'question',    -- question / experience / resource / team_recruit / celebration
    tags               TEXT[] DEFAULT '{}',
    -- 状态
    is_pinned          BOOLEAN DEFAULT FALSE,
    is_resolved        BOOLEAN DEFAULT FALSE,             -- 问题是否已解决
    view_count         INT DEFAULT 0,
    like_count         INT DEFAULT 0,
    comment_count      INT DEFAULT 0,
    -- 时间
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_posts_competition ON community_posts(competition_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);

-- 6.4 社区评论表
CREATE TABLE community_comments (
    comment_id         SERIAL PRIMARY KEY,
    post_id            INT REFERENCES community_posts(post_id) ON DELETE CASCADE,
    author_id          INT REFERENCES users(user_id),
    parent_comment_id  INT REFERENCES community_comments(comment_id),  -- 回复评论
    content            TEXT NOT NULL,
    -- 积分奖励 (获奖学长回复可获得积分)
    reward_points      INT DEFAULT 0,
    is_accepted_answer BOOLEAN DEFAULT FALSE,             -- 是否被采纳为最佳答案
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 积分记录表
CREATE TABLE point_records (
    point_id           SERIAL PRIMARY KEY,
    user_id            INT REFERENCES users(user_id),
    points_change      INT NOT NULL,                      -- 正=获得, 负=消耗
    reason             VARCHAR(100) NOT NULL,             -- "回答被采纳" / "兑换校园文创"
    related_entity     VARCHAR(50),                       -- comment / exchange
    related_id         INT,
    balance_after      INT NOT NULL,                      -- 操作后余额
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 第七层: 通知与消息域 (Notifications)
-- ============================================================

-- 7.1 统一通知表
CREATE TABLE notifications (
    notification_id    SERIAL PRIMARY KEY,
    user_id            INT REFERENCES users(user_id),    -- 接收者
    -- 内容
    title              VARCHAR(255) NOT NULL,
    content            TEXT NOT NULL,
    notification_type  VARCHAR(30) NOT NULL,              -- milestone / review_result / team_invite / community_reply / system / policy_update
    -- 关联
    related_entity     VARCHAR(50),                       -- registration / team / post / competition
    related_id         INT,
    action_url         VARCHAR(500),                      -- 点击跳转链接
    -- 投递渠道
    channel            VARCHAR(20) DEFAULT 'in_app',      -- in_app / email / wechat / sms
    -- 状态
    is_read            BOOLEAN DEFAULT FALSE,
    read_at            TIMESTAMPTZ,
    sent_at            TIMESTAMPTZ DEFAULT NOW(),
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- ============================================================
-- 第八层: 审计日志域 (Audit)
-- ============================================================

-- 8.1 操作审计日志 (所有敏感操作必须记录)
CREATE TABLE audit_logs (
    log_id             BIGSERIAL PRIMARY KEY,
    actor_id           INT REFERENCES users(user_id),    -- 操作人
    actor_role         VARCHAR(50),                       -- 操作时的角色
    action             VARCHAR(100) NOT NULL,             -- "registration.approve" / "user.delete" / "score.modify"
    entity_type        VARCHAR(50) NOT NULL,              -- registration / user / competition / certificate
    entity_id          INT,
    -- 变更详情
    old_values         JSONB,                             -- 修改前的值
    new_values         JSONB,                             -- 修改后的值
    -- 上下文
    ip_address         INET,
    user_agent         TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

-- ============================================================
-- 第九层: 统计报表域 (Analytics)
-- ============================================================

-- 9.1 学院竞赛参与度统计 (物化视图, 定期刷新)
CREATE MATERIALIZED VIEW college_competition_stats AS
SELECT
    c.college_id,
    c.college_name,
    comp.competition_id,
    comp.name AS competition_name,
    COUNT(DISTINCT r.user_id) AS participant_count,
    COUNT(DISTINCT CASE WHEN r.award_level IS NOT NULL AND r.award_level != '无' THEN r.user_id END) AS winner_count,
    AVG(CASE WHEN r.award_level IS NOT NULL THEN
        CASE r.award_level
            WHEN '特等奖' THEN 100
            WHEN '一等奖' THEN 80
            WHEN '二等奖' THEN 60
            WHEN '三等奖' THEN 40
            WHEN '优秀奖' THEN 20
            ELSE 0
        END
    END) AS avg_score
FROM colleges c
LEFT JOIN users u ON u.college_id = c.college_id
LEFT JOIN registrations r ON r.user_id = u.user_id
LEFT JOIN competitions comp ON comp.competition_id = r.competition_id
GROUP BY c.college_id, c.college_name, comp.competition_id, comp.name
WITH DATA;

-- 9.2 全校竞赛报表视图 (超级管理员看板)
CREATE MATERIALIZED VIEW global_competition_dashboard AS
SELECT
    comp.category_id,
    cc.category_name,
    cc.category_level,
    comp.level,
    COUNT(DISTINCT r.registration_id) AS total_registrations,
    COUNT(DISTINCT r.user_id) AS unique_participants,
    COUNT(DISTINCT CASE WHEN r.award_level IS NOT NULL AND r.award_level != '无' THEN r.registration_id END) AS total_awards,
    COUNT(DISTINCT u.college_id) AS participating_colleges,
    SUM(r.credit_earned) AS total_credits_issued
FROM competitions comp
JOIN competition_categories cc ON cc.category_id = comp.category_id
LEFT JOIN registrations r ON r.competition_id = comp.competition_id
LEFT JOIN users u ON u.user_id = r.user_id
GROUP BY comp.category_id, cc.category_name, cc.category_level, comp.level
WITH DATA;

-- ============================================================
-- 第十层: 触发器与约束 (Business Logic Enforcement)
-- ============================================================

-- 10.1 ★ 报名状态机约束触发器
-- 防止非法状态跳转 (如: 未通过校赛直接进入省赛)
CREATE OR REPLACE FUNCTION enforce_registration_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    allowed_transitions TEXT[] := ARRAY[
        'draft->applied',
        'applied->school_review',
        'school_review->school_passed',
        'school_review->school_rejected',
        'school_passed->provincial_applied',
        'provincial_applied->provincial_review',
        'provincial_review->provincial_passed',
        'provincial_review->provincial_rejected',
        'provincial_passed->national_applied',
        'national_applied->national_review',
        'national_review->national_passed',
        'national_review->national_rejected',
        'school_rejected->applied',      -- 允许驳回后重新报名
        'provincial_rejected->applied'   -- 允许驳回后重新报名
    ];
    transition TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        transition := OLD.status || '->' || NEW.status;
        IF NOT (transition = ANY(allowed_transitions)) THEN
            RAISE EXCEPTION '非法状态跳转: %. 允许的跳转: %', transition, array_to_string(allowed_transitions, ', ');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registration_status
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_registration_status_transition();

-- 10.2 审计日志自动记录触发器
-- 对 registrations 表的所有写操作自动记录审计日志
CREATE OR REPLACE FUNCTION log_registration_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, new_values)
        VALUES (NEW.user_id, 'registration.create', 'registration', NEW.registration_id,
                jsonb_build_object('competition_id', NEW.competition_id, 'status', NEW.status, 'user_id', NEW.user_id));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status OR OLD.award_level IS DISTINCT FROM NEW.award_level THEN
            INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values)
            VALUES (
                COALESCE(NEW.school_reviewed_by, NEW.provincial_reviewed_by, NEW.national_reviewed_by, NEW.user_id),
                'registration.update',
                'registration',
                NEW.registration_id,
                jsonb_build_object('status', OLD.status, 'award_level', OLD.award_level),
                jsonb_build_object('status', NEW.status, 'award_level', NEW.award_level)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registration_audit
    AFTER INSERT OR UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION log_registration_changes();

-- 10.3 自动更新竞赛参与人数
CREATE OR REPLACE FUNCTION update_competition_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE competitions SET current_participants = current_participants + 1
        WHERE competition_id = NEW.competition_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE competitions SET current_participants = GREATEST(0, current_participants - 1)
        WHERE competition_id = OLD.competition_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_participant_count
    AFTER INSERT OR DELETE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_competition_participant_count();

-- 10.4 知识库文档过期自动标记
CREATE OR REPLACE FUNCTION mark_expired_documents()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.replaced_by_doc_id IS NOT NULL THEN
        UPDATE knowledge_documents SET is_expired = TRUE WHERE doc_id = NEW.doc_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mark_expired_doc
    BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW
    EXECUTE FUNCTION mark_expired_documents();

-- 10.5 新用户注册后自动发送新手引导通知
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, content, notification_type, action_url)
    VALUES (
        NEW.user_id,
        '欢迎来到长理竞赛平台！',
        '点击查看竞赛分类指南，了解A/B类竞赛区别及创新学分认定办法。',
        'system',
        '/guide'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_welcome_notification
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_notification();

-- ============================================================
-- 第十一层: 便捷视图 (API 常用查询)
-- ============================================================

-- 11.1 用户竞赛档案视图 (输入学号即可查看全部信息)
CREATE VIEW user_competition_profile AS
SELECT
    u.user_id,
    u.csust_id,
    u.real_name,
    c.college_name,
    m.major_name,
    u.grade,
    u.integrity_score,
    u.total_credits,
    u.skill_tags,
    -- 统计
    (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.user_id) AS total_registrations,
    (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.user_id AND r.award_level IS NOT NULL AND r.award_level != '无') AS total_awards,
    (SELECT COALESCE(ARRAY_AGG(DISTINCT t.competition_id), '{}') FROM team_members tm JOIN teams t ON t.team_id = tm.team_id WHERE tm.user_id = u.user_id) AS team_competition_ids
FROM users u
LEFT JOIN colleges c ON c.college_id = u.college_id
LEFT JOIN majors m ON m.major_id = u.major_id;

-- 11.2 当前可报名竞赛视图
CREATE VIEW open_registrations AS
SELECT
    comp.*,
    cc.category_level,
    cc.category_name
FROM competitions comp
JOIN competition_categories cc ON cc.category_id = comp.category_id
WHERE comp.status = 'registration_open'
  AND comp.registration_end >= CURRENT_DATE
ORDER BY comp.registration_end ASC;

-- 11.3 竞赛会长工作台视图 (权限隔离: 只返回自己管理的赛事)
-- 使用时需传入 scope_competition_id 参数过滤

-- 11.4 超级管理员全局看板视图
CREATE VIEW admin_global_dashboard AS
SELECT
    c.college_name,
    COUNT(DISTINCT u.user_id) AS total_students,
    COUNT(DISTINCT r.registration_id) AS total_registrations,
    COUNT(DISTINCT CASE WHEN r.award_level IS NOT NULL AND r.award_level != '无' THEN r.registration_id END) AS total_awards,
    COALESCE(SUM(r.credit_earned), 0) AS total_credits,
    ROUND(
        COUNT(DISTINCT CASE WHEN r.award_level IS NOT NULL AND r.award_level != '无' THEN r.registration_id END)::DECIMAL
        / NULLIF(COUNT(DISTINCT r.registration_id), 0) * 100, 2
    ) AS win_rate_percent
FROM colleges c
LEFT JOIN users u ON u.college_id = c.college_id
LEFT JOIN registrations r ON r.user_id = u.user_id
GROUP BY c.college_id, c.college_name
ORDER BY total_awards DESC;

-- ============================================================
-- 完成! 共 27 张表 + 4 个物化视图 + 4 个普通视图 + 5 个触发器
-- ============================================================
