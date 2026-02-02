#!/bin/bash
# 测试远端API返回的图片URL格式

echo "测试远端API..."
echo ""

# 注意：这个API需要认证，但我们可以查看返回的数据结构
curl -s "https://lauraai-backend.fly.dev/health" | jq .

echo ""
echo "如果需要测试characters API，需要提供有效的Telegram initData"
echo "或者可以通过fly.io web界面查看日志"
