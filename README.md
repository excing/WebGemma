# Gemma AI 助手

一个现代化的本地离线 AI 对话应用，使用 Google Gemma 模型，支持文本、图片和音频输入。

## ✨ 特性

- 🤖 **本地离线运行** - 无需网络连接，保护隐私
- 🎯 **多模态支持** - 支持文本、图片和音频输入
- 🎤 **实时录音** - 内置录音功能，支持语音交互
- 💬 **多轮对话** - 智能上下文记忆，连贯对话体验
- 📁 **本地模型加载** - 支持从设备直接加载模型文件
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **高性能** - 使用 Svelte 5 + TailwindCSS 4 构建
- 🎨 **现代化界面** - 简洁美观的用户界面
- 🔧 **可配置** - 支持模型参数调节
- 🚀 **PWA 支持** - 可安装为桌面应用

## 🛠️ 技术栈

- **前端框架**: Svelte 5
- **样式**: TailwindCSS 4
- **AI 引擎**: MediaPipe Tasks GenAI
- **模型**: Google Gemma 系列
- **构建工具**: Vite
- **类型检查**: TypeScript

## 📦 安装与运行

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd WebGemma
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:3600`

## 📥 模型下载

应用支持以下 Gemma 模型：

### 文本模型
- **Gemma2-2B-IT** (推荐新手)
  - 大小: ~1.2GB
  - 下载: [Hugging Face](https://huggingface.co/litert-community/Gemma2-2B-IT/tree/main)
  - 文件名: `gemma2-2b-it-int8-web.task.bin`

- **Gemma3-1B-IT** (最新轻量)
  - 大小: ~800MB
  - 下载: [Hugging Face](https://huggingface.co/litert-community/Gemma3-1B-IT/tree/main)
  - 文件名: `gemma3-1b-it-int4-web.task`

### 多模态模型
- **Gemma-3n-E2B** (支持图片+音频)
  - 大小: ~2.5GB
  - 下载: [Hugging Face](https://huggingface.co/google/gemma-3n-E2B-it-litert-lm/tree/main)
  - 文件名: `gemma-3n-E2B-it-litert-lm-web.task`

- **Gemma-3n-E4B** (高性能多模态)
  - 大小: ~4.2GB
  - 下载: [Hugging Face](https://huggingface.co/google/gemma-3n-E4B-it-litert-lm/tree/main)
  - 文件名: `gemma-3n-E4B-it-litert-lm-web.task`

### 下载步骤

#### 方法一：放置在项目中（传统方式）
1. 访问对应的 Hugging Face 页面
2. 下载文件名包含 "web" 的 `.task` 或 `.task.bin` 文件
3. 将文件重命名为上述指定的文件名
4. 放置在项目的 `static/` 目录中
5. 刷新页面即可在应用中选择模型

#### 方法二：本地文件加载（推荐）
1. 访问对应的 Hugging Face 页面
2. 下载文件名包含 "web" 的 `.task` 或 `.task.bin` 文件
3. 在应用中点击 **设置** → **从本地加载模型文件**
4. 选择下载的模型文件即可直接使用

> 💡 **推荐使用本地文件加载**：无需修改项目文件，更加灵活便捷

## 🎮 使用指南

### 基本对话
1. 首次使用需要选择并加载模型
2. 在输入框中输入消息
3. 按 Enter 发送，Shift+Enter 换行
4. AI 会实时生成回复

### 本地模型加载
1. 点击右上角的 **设置** 按钮
2. 点击 **"从本地加载模型文件"**
3. 选择或拖拽模型文件到上传区域
4. 设置模型名称（可选）
5. 点击 **"加载模型"** 开始使用

### 多轮对话设置
1. 点击右上角的 **聊天气泡** 图标
2. 调整 **上下文长度**（1-50 轮对话）
3. 开启/关闭 **上下文记忆** 功能
4. 可随时 **清除聊天历史** 重新开始

### 多模态输入
对于支持多模态的模型（E2B/E4B）：
- 点击附件按钮上传图片或音频文件
- 点击麦克风按钮进行实时录音
- 支持拖拽文件到输入区域
- 可同时发送文本+图片+音频

### 录音功能
1. 点击输入框旁的 **麦克风** 图标
2. 允许浏览器访问麦克风权限
3. 使用录音控制面板：
   - **暂停/继续** 录音
   - **停止** 完成录音
   - **取消** 放弃录音
4. 录音完成后自动添加到消息附件

### 模型配置
在设置面板中可以调节：
- **最大令牌数**: 控制回复长度
- **温度**: 控制创造性（0.1保守 - 2.0创造）
- **Top-K**: 控制词汇选择范围
- **随机种子**: 控制输出的随机性

## 🏗️ 项目结构

```
src/
├── lib/
│   ├── components/          # UI 组件
│   │   ├── ChatInterface.svelte
│   │   ├── ChatMessage.svelte
│   │   ├── MessageInput.svelte
│   │   ├── ModelSelector.svelte
│   │   └── ...
│   ├── services/           # 业务逻辑
│   │   └── AIService.ts
│   ├── stores/             # 状态管理
│   │   └── ChatStore.ts
│   ├── types/              # 类型定义
│   │   └── index.ts
│   └── utils/              # 工具函数
│       └── fileUtils.ts
├── routes/                 # 页面路由
│   ├── +layout.svelte
│   └── +page.svelte
└── app.html               # HTML 模板
```

## 🔧 开发

### 可用脚本

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 类型检查
npm run check

# 类型检查（监听模式）
npm run check:watch
```

### 代码规范

项目遵循以下规范：
- TypeScript 严格模式
- Svelte 5 最新语法
- 响应式设计原则
- 无障碍访问标准
- 现代 ES 模块

## 🚀 部署

### 静态部署

```bash
# 构建
npm run build

# 部署 build/ 目录到静态服务器
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3600
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Google Gemma](https://ai.google.dev/gemma) - AI 模型
- [MediaPipe](https://mediapipe.dev/) - AI 推理引擎
- [Svelte](https://svelte.dev/) - 前端框架
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架