#!/usr/bin/env python3
"""
Supabase 数据导入脚本
- 导入 75 条通知数据到 official_notices 表
- 插入初始知识库文档到 knowledge_docs 表
- 验证导入结果

前提条件: 已在 Supabase SQL Editor 中执行 ddl.sql 创建表
"""

import json
import sys
import requests
import time

SUPABASE_URL = "https://fdbbcibmqaogsbasoqly.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z"
HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}


def check_table_exists(table_name):
    """检查表是否存在"""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?select=id&limit=1",
            headers=HEADERS,
            timeout=10
        )
        return resp.status_code == 200
    except Exception as e:
        print(f"  检查表 {table_name} 失败: {e}")
        return False


def check_all_tables():
    """检查所有需要的表是否存在"""
    tables = ['official_notices', 'knowledge_docs', 'acp_logs', 'error_reports']
    missing = []
    for table in tables:
        if check_table_exists(table):
            print(f"  [OK] {table}")
        else:
            print(f"  [MISSING] {table}")
            missing.append(table)
    return missing


def import_notices(json_path):
    """导入通知数据到 official_notices 表"""
    print(f"\n{'='*60}")
    print(f"导入通知数据")
    print(f"{'='*60}")
    print(f"读取文件: {json_path}")

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    notices = data.get('notices', [])
    print(f"共 {len(notices)} 条通知待导入")

    success_count = 0
    error_count = 0
    error_details = []
    batch_size = 5  # 使用较小的批次以避免超时

    for i in range(0, len(notices), batch_size):
        batch = notices[i:i + batch_size]
        rows = []
        for notice in batch:
            source = notice.get("source", "").strip()
            if not source:
                source = "教务处"
            row = {
                "notice_id": str(notice.get("id", "")),
                "title": notice.get("title", ""),
                "publish_date": notice.get("publish_date", None),
                "source": source,
                "url": notice.get("url", ""),
                "content": notice.get("content", ""),
                "attachments": notice.get("attachments", []),
                "keywords": notice.get("keywords", []),
            }
            rows.append(row)

        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/official_notices",
                headers=HEADERS,
                json=rows,
                params={"on_conflict": "notice_id"},
                timeout=60
            )
            if resp.status_code in (200, 201):
                success_count += len(batch)
                batch_num = i // batch_size + 1
                total_batches = (len(notices) + batch_size - 1) // batch_size
                print(f"  批次 [{batch_num}/{total_batches}]: +{len(batch)} 条 (累计 {success_count})")
            else:
                # 批量插入失败，尝试逐条插入
                print(f"  批次 [{i//batch_size + 1}] 批量失败 ({resp.status_code})，尝试逐条插入...")
                for row in rows:
                    try:
                        resp2 = requests.post(
                            f"{SUPABASE_URL}/rest/v1/official_notices",
                            headers=HEADERS,
                            json=row,
                            params={"on_conflict": "notice_id"},
                            timeout=30
                        )
                        if resp2.status_code in (200, 201):
                            success_count += 1
                        else:
                            error_count += 1
                            err_msg = resp2.text[:150]
                            error_details.append(f"    [{row['notice_id']}] {err_msg}")
                            print(f"    失败 [{row['notice_id']}]: {err_msg}")
                    except Exception as e2:
                        error_count += 1
                        error_details.append(f"    [{row['notice_id']}] {e2}")
                        print(f"    异常 [{row['notice_id']}]: {e2}")
        except requests.exceptions.Timeout:
            print(f"  批次 [{i//batch_size + 1}] 超时，尝试逐条插入...")
            for row in rows:
                try:
                    resp2 = requests.post(
                        f"{SUPABASE_URL}/rest/v1/official_notices",
                        headers=HEADERS,
                        json=row,
                        params={"on_conflict": "notice_id"},
                        timeout=30
                    )
                    if resp2.status_code in (200, 201):
                        success_count += 1
                    else:
                        error_count += 1
                        print(f"    失败 [{row['notice_id']}]: {resp2.text[:150]}")
                except Exception as e2:
                    error_count += 1
                    print(f"    异常 [{row['notice_id']}]: {e2}")
        except Exception as e:
            error_count += len(batch)
            print(f"  批次异常: {e}")

    print(f"\n导入结果: 成功 {success_count}, 失败 {error_count}, 总计 {len(notices)}")
    if error_details:
        print(f"\n失败详情:")
        for detail in error_details[:10]:
            print(detail)
        if len(error_details) > 10:
            print(f"  ... 还有 {len(error_details) - 10} 条失败记录")

    return success_count, error_count


def insert_knowledge_docs():
    """插入初始知识库文档"""
    print(f"\n{'='*60}")
    print(f"插入知识库文档")
    print(f"{'='*60}")

    docs = [
        {
            "title": "长沙理工大学2026年竞赛支持项目清单",
            "doc_type": "school_policy",
            "source_url": "https://www.csust.edu.cn/__local/9/8B/76/",
            "source_name": "长沙理工大学教务处",
            "content": "包含A类3项、B+类37项、B-类32项、C类21项，共93项国家级学科竞赛。A类竞赛包括：中国国际大学生创新大赛（原互联网+）、\"挑战杯\"全国大学生课外学术科技作品竞赛、\"挑战杯\"中国大学生创业计划竞赛。B+类包括全国大学生数学建模竞赛、ACM-ICPC国际大学生程序设计竞赛等37项。B-类包括全国大学生英语竞赛、全国大学生物理实验竞赛等32项。C类包括全国大学生化工设计竞赛等21项。"
        },
        {
            "title": "长沙理工大学高水平学科竞赛学生奖励管理办法",
            "doc_type": "school_policy",
            "source_url": "https://www.csust.edu.cn/__local/D/52/19/",
            "source_name": "长沙理工大学教务处",
            "content": "奖励标准：A类国家级一等奖30000元/队，二等奖20000元/队，三等奖10000元/队；B+类国家级一等奖5400元/队，二等奖3600元/队，三等奖1800元/队；B-类国家级一等奖4200元/队，二等奖2800元/队，三等奖1400元/队；C类国家级一等奖3000元/队，二等奖2000元/队，三等奖1000元/队。省级奖项按国家级同等级别的50%奖励。同一赛事同一级别只奖励最高奖项。"
        },
        {
            "title": "竞赛报名流程指南",
            "doc_type": "guide",
            "content": "报名流程：1. 注册账号：使用学号和密码登录竞赛管理平台；2. 浏览竞赛：在竞赛列表中查看当前可报名的竞赛；3. 查看详情：点击竞赛卡片查看竞赛详情、报名要求和截止时间；4. 一键报名：点击报名按钮，填写报名信息（个人赛填写个人信息，团队赛需先创建或加入团队）；5. 查看状态：在\"我的报名\"页面查看报名审核状态。注意事项：报名截止后不可修改信息，请务必在截止前确认信息无误。"
        }
    ]

    success = 0
    for doc in docs:
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/knowledge_docs",
                headers=HEADERS,
                json=doc,
                timeout=15
            )
            if resp.status_code in (200, 201):
                success += 1
                print(f"  [OK] {doc['title']}")
            else:
                print(f"  [FAIL] {doc['title']}: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            print(f"  [ERROR] {doc['title']}: {e}")

    print(f"\n知识库文档: 成功 {success}/{len(docs)}")
    return success


def verify_data():
    """验证导入的数据"""
    print(f"\n{'='*60}")
    print(f"验证导入结果")
    print(f"{'='*60}")

    # 检查 official_notices 总数
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/official_notices?select=notice_id&limit=1",
            headers=HEADERS,
            timeout=10,
            headers_extra={"Prefer": "count=exact"}
        )
        if resp.status_code == 200:
            content_range = resp.headers.get('content-range', '')
            print(f"\nofficial_notices:")
            print(f"  Content-Range: {content_range}")
        else:
            print(f"  查询失败: {resp.status_code}")
    except Exception as e:
        print(f"  异常: {e}")

    # 查询最新 5 条通知
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/official_notices?select=notice_id,title,publish_date,source&order=publish_date.desc&limit=5",
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"\n  最新 5 条通知:")
            for item in data:
                title = item['title'][:35] + "..." if len(item['title']) > 35 else item['title']
                print(f"    [{item['notice_id']}] {title} ({item['publish_date']}) - {item['source']}")
        else:
            print(f"  查询失败: {resp.status_code}")
    except Exception as e:
        print(f"  异常: {e}")

    # 查询最早 5 条通知
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/official_notices?select=notice_id,title,publish_date&order=publish_date.asc&limit=5",
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"\n  最早 5 条通知:")
            for item in data:
                title = item['title'][:35] + "..." if len(item['title']) > 35 else item['title']
                print(f"    [{item['notice_id']}] {title} ({item['publish_date']})")
        else:
            print(f"  查询失败: {resp.status_code}")
    except Exception as e:
        print(f"  异常: {e}")

    # 检查 knowledge_docs
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/knowledge_docs?select=title,doc_type,source_name",
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            print(f"\nknowledge_docs ({len(data)} 条):")
            for item in data:
                print(f"  [{item['doc_type']}] {item['title']} (来源: {item.get('source_name', 'N/A')})")
        else:
            print(f"  查询失败: {resp.status_code}")
    except Exception as e:
        print(f"  异常: {e}")

    # 检查 acp_logs 和 error_reports (应该为空)
    for table in ['acp_logs', 'error_reports']:
        try:
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1",
                headers=HEADERS,
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                print(f"\n{table}: {len(data)} 条记录 (预期为空)")
            else:
                print(f"\n{table}: 查询失败 ({resp.status_code})")
        except Exception as e:
            print(f"\n{table}: 异常 ({e})")


def main():
    print("=" * 60)
    print("Supabase 数据导入脚本")
    print(f"项目: {SUPABASE_URL}")
    print("=" * 60)

    # Step 1: 检查表是否存在
    print(f"\n[Step 1] 检查表状态")
    missing = check_all_tables()

    if missing:
        print(f"\n[ERROR] 以下表不存在: {', '.join(missing)}")
        print(f"\n请先在 Supabase SQL Editor 中执行 DDL SQL:")
        print(f"  URL: https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql")
        print(f"  文件: /data/user/work/ddl.sql")
        print(f"\n执行完成后重新运行此脚本。")
        sys.exit(1)

    print(f"\n[OK] 所有表已就绪")

    # Step 2: 导入通知数据
    print(f"\n[Step 2] 导入通知数据")
    s1, e1 = import_notices('/data/user/work/csust_notices.json')

    # Step 3: 插入知识库文档
    print(f"\n[Step 3] 插入知识库文档")
    s2 = insert_knowledge_docs()

    # Step 4: 验证
    print(f"\n[Step 4] 验证导入结果")
    verify_data()

    # 总结
    print(f"\n{'='*60}")
    print(f"导入完成!")
    print(f"  official_notices: {s1} 条成功, {e1} 条失败")
    print(f"  knowledge_docs: {s2} 条成功")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
