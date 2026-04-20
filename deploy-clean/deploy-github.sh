#!/bin/bash
# ========================================
# StartupDNA 一键部署到 GitHub Pages
# ========================================
# 使用方法：
#   1. 确保已安装 git 和 gh CLI
#   2. 运行: bash deploy-github.sh
#   3. 按提示登录 GitHub
#   4. 等待部署完成，获取外网链接
# ========================================

set -e

echo "🚀 StartupDNA GitHub Pages 一键部署"
echo "===================================="

# 检查依赖
command -v git >/dev/null 2>&1 || { echo "❌ 请先安装 git: https://git-scm.com"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "❌ 请先安装 gh: https://cli.github.com"; exit 1; }

# 检查登录状态
if ! gh auth status >/dev/null 2>&1; then
  echo "📋 正在登录 GitHub..."
  gh auth login -p https -w
fi

USER=$(gh api user --jq .login)
echo "✅ 已登录: $USER"

# 创建临时目录
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# 复制文件
cp "$(dirname "$0")/index.html" "$TMPDIR/"
cp "$(dirname "$0")/manifest.json" "$TMPDIR/"

# 创建404.html（SPA路由支持）
cat > "$TMPDIR/404.html" << 'HTMLEOF'
<!DOCTYPE html><html><head><meta charset="utf-8">
<script>
var s=location.pathname.replace(/^\/[^\/]+/,'');
if(s)location.replace(location.protocol+'//'+location.host+'/#'+s);
else location.replace(location.protocol+'//'+location.host+'/');
</script></head><body></body></html>
HTMLEOF

# 初始化git
cd "$TMPDIR"
git init
git checkout -b main
git add .
git commit -m "StartupDNA - 创业DNA平台"

# 创建仓库并推送
REPO_NAME="startupdna-$(date +%s)"
echo "📦 创建仓库: $USER/$REPO_NAME..."
gh repo create "$REPO_NAME" --public --source=. --push --description "StartupDNA - 创业DNA平台" 2>/dev/null || {
  # 如果仓库已存在，直接推送
  git remote add origin "https://github.com/$USER/$REPO_NAME.git" 2>/dev/null || true
  git push -u origin main --force 2>/dev/null
}

# 启用GitHub Pages
echo "🌐 启用 GitHub Pages..."
gh api "repos/$USER/$REPO_NAME/pages" -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>/dev/null || true

# 等待部署
echo "⏳ 等待部署（约30秒）..."
sleep 30

URL="https://$USER.github.io/$REPO_NAME/"
echo ""
echo "===================================="
echo "✅ 部署成功！"
echo "🌐 网址: $URL"
echo "===================================="
echo ""
echo "提示："
echo "  - 如果打不开，请等待1-2分钟让GitHub完成部署"
echo "  - 仓库地址: https://github.com/$USER/$REPO_NAME"
echo "  - AI功能需要网络连接（直连MiniMax API）"
