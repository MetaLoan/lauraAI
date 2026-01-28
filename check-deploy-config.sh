#!/bin/bash

# 快速部署配置检查脚本
# 不安装依赖，只检查配置文件

set -e

echo "🔍 检查部署配置..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查必要文件
echo "📄 检查必要文件..."

files=(
  "package.json"
  "next.config.mjs"
  "tsconfig.json"
  ".gitignore"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅${NC} $file"
  else
    echo -e "  ${RED}❌${NC} $file (缺失)"
    exit 1
  fi
done

# 检查 package.json 中的脚本
echo ""
echo "📦 检查 package.json 脚本..."
if grep -q '"build"' package.json; then
  echo -e "  ${GREEN}✅${NC} build 脚本存在"
else
  echo -e "  ${RED}❌${NC} build 脚本缺失"
  exit 1
fi

# 检查 Next.js 配置
echo ""
echo "⚙️  检查 Next.js 配置..."
if [ -f "next.config.mjs" ]; then
  echo -e "  ${GREEN}✅${NC} next.config.mjs 存在"
  echo "  配置内容:"
  cat next.config.mjs | sed 's/^/    /'
fi

# 检查 Vercel 配置
echo ""
echo "🚀 检查 Vercel 配置..."
if [ -f "vercel.json" ]; then
  echo -e "  ${GREEN}✅${NC} vercel.json 存在"
else
  echo -e "  ${YELLOW}⚠️${NC}  vercel.json 不存在（可选）"
fi

# 检查 GitHub Actions
echo ""
echo "🔄 检查 GitHub Actions..."
if [ -f ".github/workflows/deploy-test.yml" ]; then
  echo -e "  ${GREEN}✅${NC} GitHub Actions workflow 存在"
else
  echo -e "  ${YELLOW}⚠️${NC}  GitHub Actions workflow 不存在（可选）"
fi

# 检查环境变量文件示例
echo ""
echo "🔐 检查环境变量配置..."
if [ -f ".env.example" ] || [ -f ".env.local.example" ]; then
  echo -e "  ${GREEN}✅${NC} 环境变量示例文件存在"
else
  echo -e "  ${YELLOW}⚠️${NC}  环境变量示例文件不存在（可选）"
fi

echo ""
echo -e "${GREEN}✅ 部署配置检查完成！${NC}"
echo ""
echo "下一步："
echo "  1. 运行 './test-deploy.sh' 进行完整构建测试"
echo "  2. 或查看 DEPLOY.md 了解部署详情"
