#!/bin/bash

# 本地开发服务器启动脚本（纯本地模式）

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 启动本地开发环境...${NC}"
echo ""

# 检查后端目录
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ backend 目录不存在${NC}"
    exit 1
fi

# 检查后端 .env 文件
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env 文件不存在${NC}"
    echo "请创建 backend/.env 文件"
    exit 1
fi

# 加载后端环境变量
source backend/.env

# 设置默认端口
BACKEND_PORT=${PORT:-8081}

# 检查后端端口是否被占用
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  后端端口 $BACKEND_PORT 已被占用${NC}"
    echo "正在尝试关闭..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

# 检查前端端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  前端端口 3000 已被占用${NC}"
    echo "正在尝试关闭..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# 创建临时目录存储日志
TMP_DIR="/tmp/lauraai-dev"
mkdir -p "$TMP_DIR"

# 启动后端服务器
echo -e "${GREEN}📦 启动后端服务器（端口 $BACKEND_PORT，DEV 模式）...${NC}"
cd backend
go build -o server ./cmd/server 2>/dev/null || {
    echo -e "${RED}❌ 后端编译失败${NC}"
    exit 1
}

# 启动后端，开启 DEV 模式
touch "$TMP_DIR/backend.log"
export DEV_MODE=true
./server 2>&1 | tee "$TMP_DIR/backend.log" &
BACKEND_PID=$!
cd ..
sleep 2

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ 后端启动失败${NC}"
    echo "查看日志: cat $TMP_DIR/backend.log"
    exit 1
fi

echo -e "${GREEN}✅ 后端服务器已启动 (PID: $BACKEND_PID)${NC}"
echo ""

# 设置 API 地址为本地
API_URL="http://localhost:$BACKEND_PORT/api"

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  前端依赖未安装，正在安装...${NC}"
    npm install
    echo ""
fi

# 创建 .env.local 文件
echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.local
echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local
echo -e "${GREEN}✅ 已创建 .env.local 文件${NC}"
echo "   NEXT_PUBLIC_API_URL=$API_URL"
echo "   NEXT_PUBLIC_DEV_MODE=true"
echo ""

# 启动前端开发服务器
echo -e "${GREEN}🎨 启动前端开发服务器...${NC}"
echo -e "${BLUE}   前端地址: http://localhost:3000${NC}"
echo -e "${BLUE}   API 地址: $API_URL${NC}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止所有服务...${NC}"
    kill $BACKEND_PID 2>/dev/null
    pkill -f "./server" 2>/dev/null
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
    exit 0
}

# 捕获 Ctrl+C
trap cleanup INT TERM

# 启动前端（前台运行）
npm run dev
