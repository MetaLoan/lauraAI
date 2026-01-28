#!/bin/bash

# 部署测试脚本
# 用于验证项目是否可以成功构建和部署

set -e  # 遇到错误时退出

echo "🚀 开始部署测试..."
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
node_version=$(node -v)
echo "   Node.js: $node_version"
echo ""

# 检查包管理器
echo "📦 检查包管理器..."
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo "   使用: pnpm"
elif command -v yarn &> /dev/null; then
    PKG_MANAGER="yarn"
    echo "   使用: yarn"
else
    PKG_MANAGER="npm"
    echo "   使用: npm"
fi
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules 不存在，正在安装依赖..."
    $PKG_MANAGER install
    echo ""
fi

# 运行 lint 检查
echo "🔍 运行代码检查..."
if npm run lint 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠️  代码检查发现一些问题，但继续构建测试...${NC}"
else
    echo -e "${GREEN}✅ 代码检查通过${NC}"
fi
echo ""

# 运行构建测试
echo "🏗️  开始构建测试..."
if npm run build; then
    echo ""
    echo -e "${GREEN}✅ 构建成功！${NC}"
    echo ""
    
    # 检查构建输出
    if [ -d ".next" ]; then
        echo -e "${GREEN}✅ .next 目录已生成${NC}"
        echo "   构建输出大小:"
        du -sh .next 2>/dev/null || echo "   无法计算大小"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 部署测试通过！项目可以成功构建。${NC}"
    echo ""
    echo "下一步："
    echo "  1. 运行 'npm run start' 启动生产服务器"
    echo "  2. 或部署到 Vercel/其他平台"
else
    echo ""
    echo -e "${RED}❌ 构建失败！请检查错误信息。${NC}"
    exit 1
fi
