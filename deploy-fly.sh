#!/usr/bin/env bash
# 一键部署 RPC 节点 + 后端到 Fly.io（新建机器）
# 使用: ./deploy-fly.sh [rpc|backend|all]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

usage() {
  echo "Usage: $0 [rpc|backend|all]"
  echo "  rpc     - 仅部署 RPC 节点 (Anvil)"
  echo "  backend - 仅部署后端 (Go API)"
  echo "  all     - 先 RPC 再 Backend（默认）"
  exit 1
}

deploy_rpc() {
  echo ">>> 部署 RPC 节点 (lauraai-rpc)..."
  cd "$SCRIPT_DIR/rpc-node"
  if ! fly status 2>/dev/null; then
    echo "首次需先: cd rpc-node && fly launch --no-deploy --name lauraai-rpc --region sin"
    exit 1
  fi
  fly deploy
  echo ">>> RPC 节点地址: https://lauraai-rpc.fly.dev"
}

deploy_backend() {
  echo ">>> 部署后端 (lauraai-backend)..."
  cd "$SCRIPT_DIR/backend"
  if ! fly status 2>/dev/null; then
    echo "首次需先: cd backend && fly launch --no-deploy --name lauraai-backend --region sin"
    echo "并创建 volume: fly volumes create uploads_data --size 10 --region sin"
    echo "并设置 secrets: fly secrets set GEMINI_API_KEY=... POSTGRES_DSN=... UPLOADS_DIR=/root/uploads"
    exit 1
  fi
  fly deploy
  echo ">>> 后端 API 地址: https://lauraai-backend.fly.dev/api"
}

case "${1:-all}" in
  rpc)     deploy_rpc ;;
  backend) deploy_backend ;;
  all)     deploy_rpc; deploy_backend ;;
  *)       usage ;;
esac
