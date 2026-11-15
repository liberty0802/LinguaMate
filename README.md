# LinguaMate — AI 英语表达学习助手

LinguaMate 是一个基于大语言模型的 AI 英语表达学习助手。用户输入中文表达，系统利用 AI 生成自然、地道的英文表达，并提供重点词汇、常用搭配和句式结构解析，帮助用户提升英语表达能力。

## 项目功能

- **AI 智能翻译**：将中文表达转换为自然、地道的英文。
- **词汇解析**：提取重点词汇，展示释义及相关信息。
- **固定搭配**：整理实用英语短语和常见搭配。
- **句式学习**：解析英文表达中的重要句型。
- **语音朗读**：支持英文表达和重点词汇的发音朗读。
- **历史记录**：保存历史翻译结果，方便回顾学习。
- **主题切换**：支持多种界面主题。

## 技术栈

| 模块 | 技术 |
|---|---|
| 前端 | React、TypeScript、Vite |
| 后端 | Python、FastAPI |
| AI 模型 | DeepSeek API |
| API 调用 | OpenAI Python SDK |
| 数据存储 | localStorage |
| 语音功能 | Web Speech API |

## 项目结构

```text
LinguaMate/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   └── package.json
│
├── backend/
│   └── main.py
│
└── .gitignore
```

## 本地运行

### 1. 克隆项目

```bash
git clone https://github.com/liberty0802/LinguaMate.git
cd LinguaMate
```

### 2. 启动后端

```bash
cd backend
```

创建并激活 Python 虚拟环境，安装项目依赖。

配置 `.env` 文件，填写自己的 DeepSeek API Key。

```env
DEEPSEEK_API_KEY=your_api_key
```

启动服务：

```bash
python -m uvicorn main:app --reload --port 8000
```

### 3. 启动前端

在另一个终端中执行：

```bash
cd frontend
npm install
npm run dev
```

打开浏览器访问：

http://localhost:5173

## 项目说明

本项目采用前后端分离架构。前端负责用户交互和学习结果展示，后端通过 FastAPI 接收请求并调用 DeepSeek API，完成 AI 英语表达生成与解析。

## 后续优化方向

- 优化 AI 生成结果的稳定性和准确性
- 增加更多英语学习场景
- 完善用户学习数据管理
- 优化移动端交互体验
