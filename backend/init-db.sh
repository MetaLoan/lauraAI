#!/bin/bash

# 数据库初始化脚本

echo "正在创建数据库 soulface..."

# 尝试使用 postgres 用户创建数据库
psql -U postgres -c "CREATE DATABASE soulface;" 2>/dev/null && echo "数据库创建成功" || {
    echo "尝试使用当前用户创建数据库..."
    createdb soulface 2>/dev/null && echo "数据库创建成功" || {
        echo "数据库创建失败，请手动执行："
        echo "  createdb soulface"
        echo "或"
        echo "  psql -U postgres -c 'CREATE DATABASE soulface;'"
    }
}

echo ""
echo "数据库初始化完成！"
echo "请确保 .env 文件中的 POSTGRES_DSN 配置正确。"
