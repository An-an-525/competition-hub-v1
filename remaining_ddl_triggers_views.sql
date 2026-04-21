-- ============================================================
-- 剩余 DDL: 触发器 + 便捷视图
-- 请在 Supabase SQL Editor 中执行此文件的全部内容
-- ============================================================

-- ============================================================
-- 10.2 审计日志自动记录触发器
-- 对 registrations 表的所有写操作自动记录审计日志
-- ============================================================
CREATE OR REPLACE FUNCTION log_registration_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
        VALUES (NEW.user_id, 'registration.create', 'registration', NEW.registration_id,
                jsonb_build_object('competition_id', NEW.competition_id, 'status', NEW.status, 'user_id', NEW.user_id));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status OR OLD.award_level IS DISTINCT FROM NEW.award_level THEN
            INSERT INTO audit_logs (actor_id, action, target_type, target_id, details)
            VALUES (
                COALESCE(NEW.school_reviewed_by, NEW.provincial_reviewed_by, NEW.national_reviewed_by, NEW.user_id),
                'registration.update',
                'registration',
                NEW.registration_id,
                jsonb_build_object(
                    'old_status', OLD.status, 'new_status', NEW.status,
                    'old_award', OLD.award_level, 'new_award', NEW.award_level
                )
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

-- ============================================================
-- 10.3 自动更新竞赛参与人数
-- ============================================================
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

-- ============================================================
-- 10.4 知识库文档过期自动标记
-- ============================================================
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

-- ============================================================
-- 10.5 新用户注册后自动发送新手引导通知
-- ============================================================
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, content, type, action_url)
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

-- 11.3 超级管理员全局看板视图
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
-- 验证查询
-- ============================================================
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
