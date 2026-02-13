#!/bin/bash

# 服务端运行脚本
# 用于生产环境或本地测试

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 启动 SoulFace 后端服务...${NC}"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在${NC}"
    echo ""
    echo "请创建 .env 文件并配置以下变量："
    echo "  TELEGRAM_BOT_TOKEN=your_bot_token"
    echo "  GEMINI_API_KEY=your_gemini_api_key"
    echo "  POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=soulface port=5432 sslmode=disable"
    echo "  PORT=8081"
    echo "  DEV_MODE=true"
    echo ""
    exit 1
fi

# 加载环境变量
source .env

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go 未安装，请先安装 Go${NC}"
    exit 1
fi

# 设置默认端口
PORT=${PORT:-8081}

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 $PORT 已被占用${NC}"
    echo "正在尝试关闭占用端口的进程..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

# 编译服务器
echo -e "${GREEN}📦 编译服务器...${NC}"
go build -o server ./cmd/server
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 编译失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 编译成功${NC}"
echo ""

# 显示配置信息
echo -e "${GREEN}📋 配置信息:${NC}"
echo "  端口: $PORT"
echo "  开发模式: ${DEV_MODE:-false}"
if [ ! -z "$GEMINI_API_KEY" ]; then
    echo "  Gemini API: 已配置"
else
    echo -e "  ${YELLOW}Gemini API: 未配置${NC}"
fi
if [ ! -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "  Telegram Bot: 已配置"
else
    echo -e "  ${YELLOW}Telegram Bot: 未配置${NC}"
fi
echo ""

# 启动服务器
echo -e "${GREEN}✅ 启动服务器...${NC}"
echo -e "${YELLOW}   访问地址: http://localhost:$PORT${NC}"
echo -e "${YELLOW}   健康检查: http://localhost:$PORT/health${NC}"
echo -e "${YELLOW}   按 Ctrl+C 停止服务器${NC}"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止服务器...${NC}"
    pkill -f "./server" 2>/dev/null
    echo -e "${GREEN}✅ 服务器已停止${NC}"
    exit 0
}

# 捕获 Ctrl+C
trap cleanup INT TERM

# 运行服务器
./server
