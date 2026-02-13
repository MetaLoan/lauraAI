#!/bin/bash

# 后端服务器启动脚本

echo "正在启动 SoulFace 后端服务..."

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在，使用默认配置"
    echo "请创建 .env 文件并配置以下变量："
    echo "  TELEGRAM_BOT_TOKEN=your_bot_token"
    echo "  GEMINI_API_KEY=your_gemini_api_key"
    echo "  POSTGRES_DSN=host=localhost user=postgres password=your_password dbname=soulface port=5432 sslmode=disable"
    echo "  PORT=8080"
    echo ""
fi

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "错误: Go 未安装，请先安装 Go"
    exit 1
fi

# 运行服务器
echo "启动服务器..."
# 从 .env 获取端口号，默认为 8081
PORT=$(grep '^PORT=' .env | cut -d '=' -f2)
PORT=${PORT:-8081}
echo "后端 API 运行在端口: $PORT"
go run cmd/server/main.go
