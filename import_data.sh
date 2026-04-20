#!/bin/bash
# ============================================================
# Supabase 数据导入脚本 (curl 版本)
# 前提条件: 已在 Supabase SQL Editor 中执行 ddl.sql 创建表
# ============================================================

SUPABASE_URL="https://fdbbcibmqaogsbasoqly.supabase.co"
SERVICE_ROLE_KEY="sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z"

echo "============================================================"
echo "Supabase 数据导入脚本 (curl 版本)"
echo "============================================================"

# Step 1: 检查表是否存在
echo ""
echo "[Step 1] 检查表状态..."

check_table() {
    local table=$1
    local code=$(curl -s -o /dev/null -w "%{http_code}" \
        "${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    if [ "$code" = "200" ]; then
        echo "  [OK] ${table}"
        return 0
    else
        echo "  [MISSING] ${table}"
        return 1
    fi
}

ALL_OK=true
for table in official_notices knowledge_docs acp_logs error_reports; do
    if ! check_table "$table"; then
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = "false" ]; then
    echo ""
    echo "[ERROR] 部分表不存在，请先执行 DDL SQL"
    echo "  URL: https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql"
    echo "  文件: ddl.sql"
    exit 1
fi

echo ""
echo "[OK] 所有表已就绪"

# Step 2: 导入通知数据
echo ""
echo "[Step 2] 导入通知数据..."

# 使用 Python 来处理 JSON 数据（curl 单独处理 JSON 比较困难）
if command -v python3 &> /dev/null; then
    python3 -c "
import json, subprocess, sys

with open('csust_notices.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

notices = data.get('notices', [])
print(f'共 {len(notices)} 条通知')

success = 0
errors = 0
batch_size = 5

for i in range(0, len(notices), batch_size):
    batch = notices[i:i + batch_size]
    rows = []
    for n in batch:
        source = n.get('source', '').strip() or '教务处'
        rows.append({
            'notice_id': str(n.get('id', '')),
            'title': n.get('title', ''),
            'publish_date': n.get('publish_date', None),
            'source': source,
            'url': n.get('url', ''),
            'content': n.get('content', ''),
            'attachments': n.get('attachments', []),
            'keywords': n.get('keywords', []),
        })

    import requests
    try:
        resp = requests.post(
            '${SUPABASE_URL}/rest/v1/official_notices',
            headers={
                'apikey': '${SERVICE_ROLE_KEY}',
                'Authorization': 'Bearer ${SERVICE_ROLE_KEY}',
                'Content-Type': 'application/json'
            },
            json=rows,
            params={'on_conflict': 'notice_id'},
            timeout=60
        )
        if resp.status_code in (200, 201):
            success += len(batch)
            print(f'  批次 [{i//batch_size + 1}]: +{len(batch)} (累计 {success})')
        else:
            print(f'  批次失败: {resp.status_code} - {resp.text[:200]}')
            for row in rows:
                try:
                    r2 = requests.post(
                        '${SUPABASE_URL}/rest/v1/official_notices',
                        headers={
                            'apikey': '${SERVICE_ROLE_KEY}',
                            'Authorization': 'Bearer ${SERVICE_ROLE_KEY}',
                            'Content-Type': 'application/json'
                        },
                        json=row,
                        params={'on_conflict': 'notice_id'},
                        timeout=30
                    )
                    if r2.status_code in (200, 201):
                        success += 1
                    else:
                        errors += 1
                except:
                    errors += 1
    except Exception as e:
        print(f'  批次异常: {e}')
        errors += len(batch)

print(f'\\n结果: 成功 {success}, 失败 {errors}')
"
else
    echo "  [ERROR] 需要 python3 来处理 JSON 数据"
    echo "  请安装 python3 或使用 import_data.py 脚本"
    exit 1
fi

# Step 3: 插入知识库文档
echo ""
echo "[Step 3] 插入知识库文档..."

# 文档 1
curl -s -o /dev/null -w "  [%(http_code)s] 竞赛支持项目清单\n" \
    -X POST "${SUPABASE_URL}/rest/v1/knowledge_docs" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "长沙理工大学2026年竞赛支持项目清单",
        "doc_type": "school_policy",
        "source_url": "https://www.csust.edu.cn/__local/9/8B/76/",
        "source_name": "长沙理工大学教务处",
        "content": "包含A类3项、B+类37项、B-类32项、C类21项，共93项国家级学科竞赛。A类竞赛包括：中国国际大学生创新大赛（原互联网+）、挑战杯全国大学生课外学术科技作品竞赛、挑战杯中国大学生创业计划竞赛。B+类包括全国大学生数学建模竞赛、ACM-ICPC国际大学生程序设计竞赛等37项。B-类包括全国大学生英语竞赛、全国大学生物理实验竞赛等32项。C类包括全国大学生化工设计竞赛等21项。"
    }'

# 文档 2
curl -s -o /dev/null -w "  [%(http_code)s] 竞赛奖励管理办法\n" \
    -X POST "${SUPABASE_URL}/rest/v1/knowledge_docs" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "长沙理工大学高水平学科竞赛学生奖励管理办法",
        "doc_type": "school_policy",
        "source_url": "https://www.csust.edu.cn/__local/D/52/19/",
        "source_name": "长沙理工大学教务处",
        "content": "奖励标准：A类国家级一等奖30000元/队，二等奖20000元/队，三等奖10000元/队；B+类国家级一等奖5400元/队，二等奖3600元/队，三等奖1800元/队；B-类国家级一等奖4200元/队，二等奖2800元/队，三等奖1400元/队；C类国家级一等奖3000元/队，二等奖2000元/队，三等奖1000元/队。省级奖项按国家级同等级别的50%奖励。同一赛事同一级别只奖励最高奖项。"
    }'

# 文档 3
curl -s -o /dev/null -w "  [%(http_code)s] 竞赛报名流程指南\n" \
    -X POST "${SUPABASE_URL}/rest/v1/knowledge_docs" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "竞赛报名流程指南",
        "doc_type": "guide",
        "content": "报名流程：1. 注册账号：使用学号和密码登录竞赛管理平台；2. 浏览竞赛：在竞赛列表中查看当前可报名的竞赛；3. 查看详情：点击竞赛卡片查看竞赛详情、报名要求和截止时间；4. 一键报名：点击报名按钮，填写报名信息（个人赛填写个人信息，团队赛需先创建或加入团队）；5. 查看状态：在我的报名页面查看报名审核状态。注意事项：报名截止后不可修改信息，请务必在截止前确认信息无误。"
    }'

# Step 4: 验证
echo ""
echo "[Step 4] 验证导入结果..."

echo ""
echo "official_notices 最新5条:"
curl -s "${SUPABASE_URL}/rest/v1/official_notices?select=notice_id,title,publish_date&order=publish_date.desc&limit=5" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    title = item['title'][:40] + '...' if len(item['title']) > 40 else item['title']
    print(f\"  [{item['notice_id']}] {title} ({item['publish_date']})\")
"

echo ""
echo "knowledge_docs:"
curl -s "${SUPABASE_URL}/rest/v1/knowledge_docs?select=title,doc_type" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data:
    print(f\"  [{item['doc_type']}] {item['title']}\")
"

echo ""
echo "============================================================"
echo "导入完成!"
echo "============================================================"
