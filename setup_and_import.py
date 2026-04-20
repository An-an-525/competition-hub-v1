#!/usr/bin/env python3
"""
Supabase 完整设置和导入脚本

使用方法:
  1. 先在 Supabase SQL Editor 中执行 ddl.sql
     URL: https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql
  2. 然后运行此脚本: python3 setup_and_import.py
  
  或者使用 --wait 参数自动等待表创建:
     python3 setup_and_import.py --wait
"""

import json
import sys
import time
import requests
import argparse

SUPABASE_URL = "https://fdbbcibmqaogsbasoqly.supabase.co"
SERVICE_ROLE_KEY = "sb_secret_0BNbo0EPklHfiHW0iJIOsg_K52XDX6z"
HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

REQUIRED_TABLES = ['official_notices', 'knowledge_docs', 'acp_logs', 'error_reports']


def check_tables():
    """检查所有需要的表是否存在，返回缺失的表列表"""
    missing = []
    for table in REQUIRED_TABLES:
        try:
            resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?select=id&limit=1",
                headers=HEADERS,
                timeout=10
            )
            if resp.status_code == 200:
                print(f"  [OK] {table}")
            else:
                print(f"  [--] {table}")
                missing.append(table)
        except Exception as e:
            print(f"  [??] {table} ({e})")
            missing.append(table)
    return missing


def wait_for_tables(interval=5, max_wait=300):
    """等待所有表创建完成"""
    print(f"\n等待表创建... (每 {interval} 秒检查一次, 最多等待 {max_wait} 秒)")
    start = time.time()
    while time.time() - start < max_wait:
        missing = check_tables()
        if not missing:
            print(f"\n所有表已就绪! (等待了 {int(time.time() - start)} 秒)")
            return True
        print(f"  缺少 {len(missing)} 个表，{interval} 秒后重试...")
        time.sleep(interval)
    print(f"\n超时! 已等待 {max_wait} 秒，表仍未创建。")
    return False


def import_notices(json_path):
    """导入通知数据"""
    print(f"\n{'='*60}")
    print(f"导入通知数据: {json_path}")
    print(f"{'='*60}")

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    notices = data.get('notices', [])
    print(f"共 {len(notices)} 条通知")

    success = 0
    errors = 0
    batch_size = 5

    for i in range(0, len(notices), batch_size):
        batch = notices[i:i + batch_size]
        rows = []
        for n in batch:
            source = n.get("source", "").strip() or "教务处"
            rows.append({
                "notice_id": str(n.get("id", "")),
                "title": n.get("title", ""),
                "publish_date": n.get("publish_date", None),
                "source": source,
                "url": n.get("url", ""),
                "content": n.get("content", ""),
                "attachments": n.get("attachments", []),
                "keywords": n.get("keywords", []),
            })

        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/official_notices",
                headers=HEADERS,
                json=rows,
                params={"on_conflict": "notice_id"},
                timeout=60
            )
            if resp.status_code in (200, 201):
                success += len(batch)
                bn = i // batch_size + 1
                tb = (len(notices) + batch_size - 1) // batch_size
                print(f"  [{bn}/{tb}] +{len(batch)} (累计 {success})")
            else:
                print(f"  批次失败 ({resp.status_code})，逐条重试...")
                for row in rows:
                    try:
                        r2 = requests.post(
                            f"{SUPABASE_URL}/rest/v1/official_notices",
                            headers=HEADERS,
                            json=row,
                            params={"on_conflict": "notice_id"},
                            timeout=30
                        )
                        if r2.status_code in (200, 201):
                            success += 1
                        else:
                            errors += 1
                            print(f"    失败 [{row['notice_id']}]: {r2.text[:100]}")
                    except Exception as e2:
                        errors += 1
                        print(f"    异常 [{row['notice_id']}]: {e2}")
        except Exception as e:
            print(f"  批次异常: {e}")
            errors += len(batch)

    print(f"\n结果: 成功 {success}, 失败 {errors}")
    return success, errors


def insert_knowledge_docs():
    """插入知识库文档"""
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

    ok = 0
    for doc in docs:
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/knowledge_docs",
                headers=HEADERS,
                json=doc,
                timeout=15
            )
            if resp.status_code in (200, 201):
                ok += 1
                print(f"  [OK] {doc['title']}")
            else:
                print(f"  [FAIL] {doc['title']}: {resp.text[:150]}")
        except Exception as e:
            print(f"  [ERROR] {doc['title']}: {e}")

    print(f"\n成功 {ok}/{len(docs)}")
    return ok


def verify():
    """验证导入结果"""
    print(f"\n{'='*60}")
    print(f"验证结果")
    print(f"{'='*60}")

    # official_notices
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/official_notices?select=notice_id,title,publish_date,source&order=publish_date.desc&limit=5",
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            items = resp.json()
            cr = resp.headers.get('content-range', '')
            print(f"\nofficial_notices ({cr}):")
            for item in items:
                t = item['title'][:40] + "..." if len(item['title']) > 40 else item['title']
                print(f"  [{item['notice_id']}] {t} ({item['publish_date']})")
        else:
            print(f"\nofficial_notices: 查询失败 ({resp.status_code})")
    except Exception as e:
        print(f"\nofficial_notices: {e}")

    # knowledge_docs
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/knowledge_docs?select=title,doc_type",
            headers=HEADERS,
            timeout=10
        )
        if resp.status_code == 200:
            items = resp.json()
            print(f"\nknowledge_docs ({len(items)} 条):")
            for item in items:
                print(f"  [{item['doc_type']}] {item['title']}")
        else:
            print(f"\nknowledge_docs: 查询失败 ({resp.status_code})")
    except Exception as e:
        print(f"\nknowledge_docs: {e}")


def main():
    parser = argparse.ArgumentParser(description='Supabase 数据导入脚本')
    parser.add_argument('--wait', action='store_true', help='等待表创建完成')
    parser.add_argument('--json', default='/data/user/work/csust_notices.json', help='通知数据 JSON 文件路径')
    args = parser.parse_args()

    print("=" * 60)
    print("Supabase 竞赛管理平台 - 数据导入")
    print(f"项目: {SUPABASE_URL}")
    print("=" * 60)

    # Step 1: 检查表
    print(f"\n[1/4] 检查表状态")
    missing = check_tables()

    if missing:
        if args.wait:
            if not wait_for_tables():
                print("\n请手动在 Supabase SQL Editor 中执行 DDL:")
                print("  https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql")
                sys.exit(1)
        else:
            print(f"\n[!] 以下表不存在: {', '.join(missing)}")
            print(f"\n请先执行以下步骤:")
            print(f"  1. 打开 Supabase SQL Editor:")
            print(f"     https://supabase.com/dashboard/project/fdbbcibmqaogsbasoqly/sql")
            print(f"  2. 复制并执行 ddl.sql 中的 SQL")
            print(f"  3. 重新运行此脚本: python3 setup_and_import.py")
            print(f"\n或者使用 --wait 参数自动等待:")
            print(f"  python3 setup_and_import.py --wait")
            sys.exit(1)

    # Step 2: 导入通知
    print(f"\n[2/4] 导入通知数据")
    s1, e1 = import_notices(args.json)

    # Step 3: 插入知识库
    print(f"\n[3/4] 插入知识库文档")
    s2 = insert_knowledge_docs()

    # Step 4: 验证
    print(f"\n[4/4] 验证结果")
    verify()

    print(f"\n{'='*60}")
    print(f"完成! official_notices: {s1}条, knowledge_docs: {s2}条")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
