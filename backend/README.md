# LauraAI Backend

Go 语言后端服务，提供 Telegram Mini App 认证、Gemini AI 聊天和图片生成功能。

## 功能特性

- Telegram Mini App 认证（initData 验证）
- 用户信息管理
- AI 角色管理（Soulmate、Mini Me、Future Family 等）
- Gemini Chat API 集成（支持流式响应）
- Gemini Imagen 3 图片生成
- PostgreSQL 数据库

## 技术栈

- Go 1.21+
- Gin Web 框架
- GORM ORM
- PostgreSQL
- Google Gemini API

## 快速开始

### 1. 安装依赖

```bash
go mod download
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
TELEGRAM_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_api_key
POSTGRES_DSN=host=localhost user=lauraai password=password dbname=lauraai port=5432 sslmode=disable
PORT=8080
```

### 3. 启动数据库

确保 PostgreSQL 已安装并运行：

```bash
# 创建数据库
createdb lauraai

# 或使用 psql
psql -U postgres
CREATE DATABASE lauraai;
```

### 4. 运行服务

```bash
go run cmd/server/main.go
```

服务将在 `http://localhost:8080` 启动。

## API 文档

### 认证

#### POST /api/auth/telegram
Telegram initData 认证

**请求头:**
```
X-Telegram-Init-Data: <initData>
```

### 用户

#### GET /api/users/me
获取当前用户信息（需要认证）

#### PUT /api/users/me
更新用户信息（需要认证）

**请求体:**
```json
{
  "name": "John Doe",
  "gender": "Male",
  "birth_date": "1990-01-01",
  "birth_time": "12:00",
  "birth_place": "New York",
  "ethnicity": "White"
}
```

### 角色

#### POST /api/characters
创建新角色（需要认证）

**请求体:**
```json
{
  "type": "soulmate",
  "title": "Your Soulmate",
  "gender": "Female",
  "ethnicity": "East Asian"
}
```

#### GET /api/characters
获取用户的所有角色（需要认证）

#### GET /api/characters/:id
获取角色详情（需要认证）

### 聊天

#### POST /api/characters/:id/chat
发送消息（流式响应，需要认证）

**请求体:**
```json
{
  "message": "Hello!"
}
```

**响应:** Server-Sent Events (SSE)

#### GET /api/characters/:id/messages
获取聊天历史（需要认证）

**查询参数:**
- `limit`: 返回消息数量（默认 50）

### 图片生成

#### POST /api/characters/:id/generate-image
生成角色图片（需要认证）

## 开发

### 项目结构

```
backend/
├── cmd/server/          # 入口文件
├── internal/
│   ├── config/          # 配置管理
│   ├── handler/        # HTTP 处理器
│   ├── middleware/      # 中间件
│   ├── model/          # 数据模型
│   ├── repository/     # 数据访问层
│   └── service/        # 业务逻辑层
└── pkg/response/       # 响应工具
```

## 许可证

MIT
