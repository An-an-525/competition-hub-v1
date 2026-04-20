# 竞赛助手平台 - 更新文件包

## 更新时间
2026-04-20

## 包含文件

```
update-files/
├── js/
│   ├── ai-chat.js          # AI问答系统（SSE格式兼容+系统提示词）
│   ├── auth.js             # 登录注册系统（修复注册后token获取）
│   ├── competition-hub.js  # 竞赛数据（修复报名统计来源）
│   ├── app.js              # 页面路由（管理面板v2）
│   ├── search.js           # 全局搜索（支持Hub数据+初始搜索词）
│   ├── utils.js            # 工具函数（XSS防护+info类型颜色）
│   ├── effects.js          # 动画效果（页面不可见时暂停）
│   ├── pages-competition.js # 竞赛页面（收藏区分用户）
│   └── registration-v2.js  # 报名系统（文件上传修复）
├── css/
│   └── style.css           # 样式（深色主题状态徽章）
└── index.html              # HTML（label for属性+ARIA）
```

## 部署步骤

### 1. 上传文件到服务器
```bash
# 在本地电脑执行
scp -r update-files root@149.28.143.114:/tmp/
```

### 2. SSH登录服务器
```bash
ssh root@149.28.143.114
```

### 3. 备份现有文件
```bash
cd /var/www/competition-hub
tar czf backup_$(date +%Y%m%d_%H%M%S).tar.gz js css index.html
```

### 4. 覆盖文件
```bash
cp /tmp/update-files/js/* /var/www/competition-hub/js/
cp /tmp/update-files/css/* /var/www/competition-hub/css/
cp /tmp/update-files/index.html /var/www/competition-hub/
```

### 5. 重启服务
```bash
pm2 restart all
nginx -s reload
```

## 主要修复内容

| 问题 | 文件 | 修复 |
|------|------|------|
| AI回复不显示 | ai-chat.js | SSE格式兼容 |
| AI回答质量差 | ai-chat.js | 添加系统提示词 |
| 注册后AI不可用 | auth.js | 直接获取JWT token |
| 报名人数永远为0 | competition-hub.js | 查询applications表 |
| 管理员看不到v2报名 | app.js | 使用renderAdminV2 |
| 搜索不查Hub数据 | search.js | 同时查询Hub数据 |
| 深色主题状态徽章不可见 | style.css | 添加深色适配 |
| 收藏不区分用户 | pages-competition.js | 按用户ID存储 |

## 后端修改（需要手动）

后端文件 `/root/competition-api/server.js` 需要添加系统提示词：

```javascript
// 在 /api/chat 路由中，构建messages时添加：
const SYSTEM_PROMPT = `你是"竞赛助手"的AI智能问答助手，专门为长沙理工大学(CSUST)学生服务。

你的核心能力：
1. 竞赛咨询：解答各类学科竞赛的报名流程、参赛要求、备赛策略、获奖经验
2. 学业指导：提供专业选择、课程学习、考研保研等建议
3. 校园生活：解答食堂、宿舍、图书馆、交通等校园生活问题
4. 报名指导：帮助学生了解竞赛报名流程、材料准备、截止时间

回答要求：
- 使用简洁清晰的中文回答
- 如果是竞赛相关问题，尽量提供具体有用的信息
- 如果不确定，诚实说明并建议查询官方渠道
- 适当使用列表和分段提高可读性`;

if (!messages || messages.length === 0 || messages[0].role !== 'system') {
    messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...(messages || [])];
}
```

修改后执行 `pm2 restart all`
