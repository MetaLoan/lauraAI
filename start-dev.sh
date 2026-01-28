#!/bin/bash

# 启动本地开发服务器脚本

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 启动本地开发服务器..."
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  依赖未安装，正在安装...${NC}"
    echo "   这可能需要几分钟时间..."
    npm install
    echo ""
fi

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  端口 3000 已被占用${NC}"
    echo "   请关闭占用端口的程序，或修改 package.json 中的端口配置"
    echo ""
    echo "   查看占用端口的进程："
    lsof -i :3000
    exit 1
fi

echo -e "${GREEN}✅ 启动开发服务器...${NC}"
echo ""
echo "   访问地址: http://localhost:3000"
echo "   按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev
