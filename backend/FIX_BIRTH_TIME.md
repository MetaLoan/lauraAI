# 修复 birth_time 字段类型错误

## 问题描述

错误信息：`ERROR: invalid input syntax for type timestamp with time zone: "19:15"`

数据库中的 `birth_time` 字段被错误地创建为 `timestamp with time zone` 类型，而不是 `time` 类型。

## 解决方案

### 方法 1: 使用 GORM 自动修复（推荐）

后端代码已经包含了自动修复逻辑（在 `internal/repository/db.go` 中）。重启后端服务后，应该会自动修复。

如果自动修复失败，使用方法 2。

### 方法 2: 手动修复 SQL

连接到数据库并执行：

```sql
-- 连接到数据库
psql -h localhost -U postgres -d soulface

-- 修复字段类型
ALTER TABLE users ALTER COLUMN birth_time TYPE time without time zone USING birth_time::text::time;
```

如果上述方法失败（字段中有数据无法转换），使用：

```sql
-- 删除并重新创建字段
ALTER TABLE users DROP COLUMN IF EXISTS birth_time;
ALTER TABLE users ADD COLUMN birth_time time without time zone;
```

### 方法 3: 使用修复脚本

运行修复脚本：

```bash
cd backend
psql -h localhost -U postgres -d soulface -f fix-birth-time.sql
```

## 验证修复

修复后，测试 API：

```bash
curl -X PUT http://localhost:8081/api/users/me \
  -H "Content-Type: application/json" \
  -d '{"birth_time": "19:15"}'
```

应该返回成功响应，而不是错误。

## 预防措施

模型定义已更新为使用 `time without time zone` 类型：

```go
BirthTime  *string    `gorm:"type:time without time zone" json:"birth_time,omitempty"`
```

新的数据库表会自动使用正确的类型。
