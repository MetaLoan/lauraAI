# 🎯 下一步行动计划

## 📊 当前状态

### ✅ 已完成
1. ✅ 后端开发完成（Go + PostgreSQL + Gemini API）
2. ✅ 数据库表已创建
3. ✅ API 客户端已创建 (`lib/api.ts`)
4. ✅ ChatWindow 组件已集成后端 API
5. ✅ 后端服务可以正常启动

### ⏳ 待完成
1. ⏳ 用户引导流程完成后保存用户信息到后端
2. ⏳ 角色创建时调用后端 API
3. ⏳ Dashboard 从后端加载角色列表
4. ⏳ Profile 页面从后端加载用户信息
5. ⏳ 配置 Telegram Bot Token
6. ⏳ 测试完整流程

## 🚀 立即开始（按优先级）

### 优先级 1: 配置和启动服务

#### 1.1 配置 Telegram Bot Token

```bash
# 1. 从 @BotFather 获取 Bot Token
# 2. 编辑 backend/.env 文件
cd backend
nano .env  # 或使用你喜欢的编辑器

# 3. 更新 TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_TOKEN=你的实际token
```

#### 1.2 启动后端服务

```bash
cd backend
go run cmd/server/main.go
```

验证：访问 `http://localhost:8081/health` 应该返回 `{"status":"ok"}`

#### 1.3 启动前端服务

```bash
npm run dev
```

前端将在 `http://localhost:3000` 启动

---

### 优先级 2: 前端后端集成

#### 2.1 用户信息保存（在引导流程完成后）

**位置**: `app/page.tsx` - 在 `ResultsCard` 组件之后（step 8）

**需要做的**:
- 在 `ResultsCard` 的 `onNext` 回调中，调用 `apiClient.updateMe()` 保存用户信息
- 格式化日期和时间数据

**代码位置**: 
- 文件: `app/page.tsx`
- 大约在第 116 行，`ResultsCard` 组件

#### 2.2 角色创建（在角色选择完成后）

**位置**: `app/page.tsx` - 在 `SoulmateEthnicitySelect` 之后（step 11）

**需要做的**:
- 在 `DrawingLoading` 组件显示时，调用 `apiClient.createCharacter()` 创建角色
- 创建成功后，调用 `apiClient.generateImage()` 生成角色图片
- 将创建的角色数据保存到 `selectedCharacterData`

**代码位置**:
- 文件: `app/page.tsx`
- 大约在第 119 行，`DrawingLoading` 组件

#### 2.3 Dashboard 加载角色列表

**位置**: `components/dashboard.tsx`

**需要做的**:
- 在组件加载时调用 `apiClient.getCharacters()` 获取所有角色
- 替换 `mockCharacters` 为从后端获取的数据
- 处理加载状态和错误

**代码位置**:
- 文件: `components/dashboard.tsx`
- 大约在第 35-42 行

#### 2.4 Profile 页面加载用户信息

**位置**: `components/profile.tsx`

**需要做的**:
- 在组件加载时调用 `apiClient.getMe()` 获取用户信息
- 使用后端返回的数据替换 props

**代码位置**:
- 文件: `components/profile.tsx`

---

### 优先级 3: 测试和优化

#### 3.1 本地测试
- 在浏览器中测试前端界面
- 检查浏览器控制台的错误
- 测试 API 调用

#### 3.2 Telegram Mini App 测试
- 部署前端到可访问的 URL（Vercel/Netlify）
- 在 Telegram Bot 中设置 Web App URL
- 在 Telegram Mini App 中测试完整流程

#### 3.3 错误处理
- 添加 API 调用的错误处理
- 添加加载状态提示
- 添加重试机制

---

## 📝 详细实施步骤

### 步骤 1: 用户信息保存集成

**文件**: `app/page.tsx`

在 `handleNext` 函数中，当 `step === 8`（ResultsCard 之后）时：

```typescript
// 添加 useEffect 或修改 handleNext
useEffect(() => {
  if (step === 8) {
    // 用户引导完成，保存用户信息
    const saveUserInfo = async () => {
      try {
        const birthDate = formData.birthDate.year && formData.birthDate.month && formData.birthDate.day
          ? `${formData.birthDate.year}-${String(parseInt(formData.birthDate.month) + 1).padStart(2, '0')}-${formData.birthDate.day.padStart(2, '0')}`
          : undefined
        
        const birthTime = formData.birthTime.hour && formData.birthTime.minute
          ? `${formData.birthTime.hour}:${formData.birthTime.minute}`
          : undefined

        await apiClient.updateMe({
          name: formData.name,
          gender: formData.gender,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_place: formData.birthPlace,
          ethnicity: formData.ethnicity,
        })
      } catch (error) {
        console.error('保存用户信息失败:', error)
        // 可以选择继续流程或显示错误
      }
    }
    saveUserInfo()
  }
}, [step])
```

### 步骤 2: 角色创建集成

**文件**: `app/page.tsx`

在 `DrawingLoading` 组件显示时（step 11）：

```typescript
useEffect(() => {
  if (step === 11) {
    // 开始创建角色
    const createCharacter = async () => {
      try {
        // 创建角色
        const character = await apiClient.createCharacter({
          type: 'soulmate',
          title: 'Your Soulmate',
          gender: formData.soulmateGender,
          ethnicity: formData.soulmateEthnicity,
        })

        // 生成角色图片
        if (character.id) {
          const imageResult = await apiClient.generateImage(character.id.toString())
          character.image_url = imageResult.image_url
        }

        // 保存角色数据
        setSelectedCharacterData(character)
      } catch (error) {
        console.error('创建角色失败:', error)
      }
    }
    createCharacter()
  }
}, [step])
```

### 步骤 3: Dashboard 集成

**文件**: `components/dashboard.tsx`

```typescript
const [characters, setCharacters] = useState<CharacterCard[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const loadCharacters = async () => {
    try {
      const data = await apiClient.getCharacters()
      // 转换后端数据格式为前端需要的格式
      setCharacters(data)
    } catch (error) {
      console.error('加载角色失败:', error)
      // 使用 mock 数据作为后备
      setCharacters([...mockCharacters.soulmate, ...mockCharacters.companions])
    } finally {
      setLoading(false)
    }
  }
  loadCharacters()
}, [])
```

### 步骤 4: Profile 集成

**文件**: `components/profile.tsx`

```typescript
const [userData, setUserData] = useState(null)

useEffect(() => {
  const loadUserData = async () => {
    try {
      const data = await apiClient.getMe()
      setUserData(data)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }
  loadUserData()
}, [])
```

---

## 🔧 开发工具

### 测试 API

```bash
# 健康检查
curl http://localhost:8081/health

# 使用测试脚本
cd backend
./test-api.sh
```

### 查看日志

- **后端**: 直接在控制台查看
- **前端**: 浏览器开发者工具 Console 和 Network 标签

---

## 📚 参考文档

- `backend/README.md` - API 文档
- `lib/api.ts` - API 客户端代码
- `TEST_GUIDE.md` - 测试指南
- `START_TEST.md` - 快速开始测试

---

## ⚠️ 注意事项

1. **错误处理**: 所有 API 调用都应该有 try-catch
2. **加载状态**: 显示加载指示器，提升用户体验
3. **数据格式**: 注意前后端数据格式的转换
4. **Telegram 环境**: 某些功能只在 Telegram Mini App 中可用
5. **日期格式**: 注意日期和时间的格式化

---

## 🎯 完成标准

当以下所有功能都能正常工作时，集成完成：

- [ ] 用户引导流程完成后，用户信息保存到后端
- [ ] 角色创建时，调用后端 API 创建角色
- [ ] 角色图片生成成功
- [ ] Dashboard 显示从后端加载的角色列表
- [ ] Profile 页面显示从后端加载的用户信息
- [ ] 聊天功能正常工作（已集成）
- [ ] 在 Telegram Mini App 中测试完整流程

---

开始实施吧！建议按照优先级顺序逐步完成。🚀
