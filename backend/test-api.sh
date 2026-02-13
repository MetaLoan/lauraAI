#!/bin/bash

# API 测试脚本

BASE_URL="http://localhost:8081"

echo "=== SoulFace 后端 API 测试 ==="
echo ""

# 测试健康检查
echo "1. 测试健康检查端点..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if [ $? -eq 0 ]; then
    echo "✅ 健康检查成功: $HEALTH_RESPONSE"
else
    echo "❌ 健康检查失败，请确保后端服务已启动"
    exit 1
fi

echo ""
echo "2. 测试 Telegram 认证端点（需要 initData）..."
echo "   注意: 此端点需要有效的 Telegram initData"
echo "   在 Telegram Mini App 环境中会自动提供"

echo ""
echo "3. 测试需要认证的端点..."
echo "   这些端点需要 Telegram initData 认证"
echo "   - GET /api/users/me"
echo "   - GET /api/characters"
echo "   - POST /api/characters"

echo ""
echo "=== 测试完成 ==="
echo ""
echo "提示:"
echo "- 在浏览器中打开: http://localhost:8081/health"
echo "- 查看 API 文档: backend/README.md"
