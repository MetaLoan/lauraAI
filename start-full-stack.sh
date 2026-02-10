#!/bin/bash

# LauraAI Backend + Frontend 完整启动脚本

echo "🚀 Starting LauraAI Full Stack..."

# 1. 启动后端
echo "📡 Starting Backend Server..."
cd backend
./server &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# 等待后端启动
sleep 3

# 2. 启动前端
echo "🎨 Starting Frontend..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ LauraAI is now running!"
echo "📡 Backend: http://localhost:8080"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# 捕获退出信号
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 保持脚本运行
wait
