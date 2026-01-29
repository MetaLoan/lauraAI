#!/bin/bash

# 使用 ngrok 内网穿透的本地开发服务器启动脚本

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 启动本地开发环境（使用 ngrok 内网穿透）...${NC}"
echo ""

# 检查 ngrok 是否安装
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok 未安装${NC}"
    echo ""
    echo "请先安装 ngrok:"
    echo "  macOS: brew install ngrok/ngrok/ngrok"
    echo "  或访问: https://ngrok.com/download"
    echo ""
    exit 1
fi

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

# 检查 ngrok 是否在运行
NGROK_PID=$(pgrep -f "ngrok http $BACKEND_PORT" || true)
if [ ! -z "$NGROK_PID" ]; then
    echo -e "${YELLOW}⚠️  检测到 ngrok 已在运行，正在关闭...${NC}"
    kill $NGROK_PID 2>/dev/null
    sleep 1
fi

# 创建临时目录存储 ngrok URL
TMP_DIR="/tmp/lauraai-dev"
mkdir -p "$TMP_DIR"

# 启动后端服务器
echo -e "${GREEN}📦 启动后端服务器（端口 $BACKEND_PORT）...${NC}"
cd backend
go build -o server ./cmd/server 2>/dev/null || {
    echo -e "${RED}❌ 后端编译失败${NC}"
    exit 1
}
# 同时将日志输出到文件和终端（使用 tail 实时显示）
touch "$TMP_DIR/backend.log"
./server > "$TMP_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
# 实时显示后端日志中的 DEBUG 信息
tail -f "$TMP_DIR/backend.log" | grep --line-buffered "DEBUG" &
TAIL_PID=$!
cd ..
sleep 2

# 检查后端是否启动成功
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ 后端启动失败${NC}"
    echo "查看日志: cat $TMP_DIR/backend.log"
    exit 1
fi

echo -e "${GREEN}✅ 后端服务器已启动 (PID: $BACKEND_PID)${NC}"

# 启动 ngrok
echo -e "${GREEN}🌐 启动 ngrok 内网穿透...${NC}"
ngrok http $BACKEND_PORT --log=stdout > "$TMP_DIR/ngrok.log" 2>&1 &
NGROK_PID=$!
sleep 3

# 获取 ngrok URL
NGROK_URL=""
for i in {1..10}; do
    # 使用 python 解析 JSON（macOS 兼容）
    if command -v python3 &> /dev/null; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') and len(data['tunnels']) > 0 else '')" 2>/dev/null)
    else
        # 备用方案：使用 sed 提取 URL（macOS 兼容）
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | sed -n 's/.*"public_url":"\(https:\/\/[^"]*\)".*/\1/p' | head -1)
    fi
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ 无法获取 ngrok URL${NC}"
    echo "请检查 ngrok 是否正常运行"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    exit 1
fi

# 保存 ngrok URL
echo "$NGROK_URL" > "$TMP_DIR/ngrok_url.txt"
API_URL="${NGROK_URL}/api"

echo -e "${GREEN}✅ ngrok 已启动${NC}"
echo -e "${BLUE}📡 API 地址: $API_URL${NC}"
echo ""

# 检查前端依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  前端依赖未安装，正在安装...${NC}"
    npm install
    echo ""
fi

# 创建临时 .env.local 文件
echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.local
echo -e "${GREEN}✅ 已创建 .env.local 文件${NC}"
echo "   NEXT_PUBLIC_API_URL=$API_URL"
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
    kill $BACKEND_PID $NGROK_PID $TAIL_PID 2>/dev/null
    pkill -f "ngrok http" 2>/dev/null
    pkill -f "./server" 2>/dev/null
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
    exit 0
}

# 捕获 Ctrl+C
trap cleanup INT TERM

# 启动前端（前台运行）
npm run dev
