#!/bin/bash

# 测试后端启动脚本

echo "正在测试后端服务启动..."
echo ""

cd "$(dirname "$0")"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在"
    exit 1
fi

# 检查数据库连接
echo "检查数据库连接..."
psql -h localhost -U postgres -d soulface -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "⚠️  数据库连接失败，请检查 POSTGRES_DSN 配置"
fi

echo ""
echo "启动后端服务（按 Ctrl+C 停止）..."
echo ""

go run cmd/server/main.go
