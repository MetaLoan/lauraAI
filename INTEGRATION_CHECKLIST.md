# ✅ 前端后端集成检查清单

## 配置阶段

- [ ] 配置 Telegram Bot Token (`backend/.env`)
- [ ] 确认 PostgreSQL 数据库连接正常
- [ ] 确认后端服务可以启动 (`http://localhost:8081/health`)
- [ ] 确认前端环境变量配置 (`.env.local`)

## 集成阶段

### 1. 用户信息保存
- [ ] 在 `app/page.tsx` 中添加用户信息保存逻辑
- [ ] 在引导流程完成后（step 8）调用 `apiClient.updateMe()`
- [ ] 格式化日期和时间数据
- [ ] 添加错误处理
- [ ] 测试用户信息保存功能

### 2. 角色创建
- [ ] 在 `app/page.tsx` 中添加角色创建逻辑
- [ ] 在角色选择完成后（step 11）调用 `apiClient.createCharacter()`
- [ ] 调用 `apiClient.generateImage()` 生成角色图片
- [ ] 保存角色数据到 `selectedCharacterData`
- [ ] 添加错误处理
- [ ] 测试角色创建功能

### 3. Dashboard 集成
- [ ] 在 `components/dashboard.tsx` 中添加数据加载逻辑
- [ ] 调用 `apiClient.getCharacters()` 获取角色列表
- [ ] 转换数据格式
- [ ] 添加加载状态
- [ ] 添加错误处理（使用 mock 数据作为后备）
- [ ] 测试 Dashboard 加载功能

### 4. Profile 集成
- [ ] 在 `components/profile.tsx` 中添加数据加载逻辑
- [ ] 调用 `apiClient.getMe()` 获取用户信息
- [ ] 添加加载状态
- [ ] 添加错误处理
- [ ] 测试 Profile 加载功能

### 5. ChatWindow（已完成）
- [x] ChatWindow 已集成后端 API
- [ ] 测试聊天功能
- [ ] 测试流式响应

## 测试阶段

### 本地测试
- [ ] 后端服务正常启动
- [ ] 前端服务正常启动
- [ ] 健康检查通过
- [ ] 用户信息保存测试
- [ ] 角色创建测试
- [ ] Dashboard 加载测试
- [ ] Profile 加载测试
- [ ] 聊天功能测试

### Telegram Mini App 测试
- [ ] 部署前端到可访问的 URL
- [ ] 配置 Telegram Bot Web App URL
- [ ] 在 Telegram Mini App 中打开应用
- [ ] 测试完整用户引导流程
- [ ] 测试角色创建
- [ ] 测试聊天功能
- [ ] 测试所有功能

## 优化阶段

- [ ] 添加全局错误处理
- [ ] 添加加载状态提示
- [ ] 优化错误消息显示
- [ ] 添加重试机制
- [ ] 优化 API 调用性能
- [ ] 添加数据缓存

## 完成标准

当所有检查项都完成时，前端后端集成完成！

---

**提示**: 可以逐个完成检查项，每完成一项就打勾 ✅
