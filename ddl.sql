-- ============================================================
-- Supabase DDL: 创建竞赛管理相关表
-- 项目: fdbbcibmqaogsbasoqly
-- 执行方式: 在 Supabase SQL Editor 中运行
-- URL: https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql
-- ============================================================

-- 1. official_notices - 官方竞赛通知
CREATE TABLE IF NOT EXISTS official_notices (
  id BIGSERIAL PRIMARY KEY,
  notice_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  publish_date DATE,
  source TEXT DEFAULT '教务处',
  url TEXT NOT NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  keywords TEXT[] DEFAULT '{}',
  category TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by BIGINT,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_official_notices_keywords ON official_notices USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_official_notices_publish_date ON official_notices (publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_official_notices_title ON official_notices USING GIN (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_official_notices_content ON official_notices USING GIN (to_tsvector('simple', coalesce(content, '')));

-- 2. knowledge_docs - 知识库文档
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  content TEXT,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. acp_logs - ACP 审计日志
CREATE TABLE IF NOT EXISTS acp_logs (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'allowed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acp_logs_client ON acp_logs (client_id);
CREATE INDEX IF NOT EXISTS idx_acp_logs_created ON acp_logs (created_at DESC);

-- 4. error_reports - 用户纠错报告
CREATE TABLE IF NOT EXISTS error_reports (
  id BIGSERIAL PRIMARY KEY,
  notice_id TEXT,
  notice_title TEXT,
  user_description TEXT NOT NULL,
  contact TEXT,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 启用 RLS (Row Level Security) 并设置策略
ALTER TABLE official_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE acp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取 official_notices
CREATE POLICY "Anyone can read official_notices" ON official_notices
  FOR SELECT USING (true);

-- 允许匿名用户读取 knowledge_docs (仅 active 的)
CREATE POLICY "Anyone can read active knowledge_docs" ON knowledge_docs
  FOR SELECT USING (is_active = true);

-- 允许认证用户提交 error_reports
CREATE POLICY "Authenticated users can insert error_reports" ON error_reports
  FOR INSERT WITH CHECK (true);

-- 允许匿名用户读取 error_reports
CREATE POLICY "Anyone can read error_reports" ON error_reports
  FOR SELECT USING (true);

-- service_role 拥有完全访问权限 (通过 Supabase 自动处理)
-- 注意: service_role key 绕过 RLS，所以不需要额外的策略

-- 6. 创建 updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_official_notices_updated_at
  BEFORE UPDATE ON official_notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_knowledge_docs_updated_at
  BEFORE UPDATE ON knowledge_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_error_reports_updated_at
  BEFORE UPDATE ON error_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
