<div align="center">

# Content Workbench

**抖音内容跨平台分发工作台 -- 从发现到编辑，一站式手动搬运**

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://typescriptlang.org)
[![Node](https://img.shields.io/badge/Node-22_LTS-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Private-red.svg)](#)

</div>

---

## 痛点

做内容搬运的人都知道：抖音上发现好内容后，要手动下载视频、提取文案、再为小红书/B站/微信各写一份适配内容。每个平台的标题、文案格式、封面要求都不同，来回切换窗口极易遗漏。没有一个工具能把 "发现 -> 筛选 -> 准备素材 -> 逐平台编辑" 这条链路串起来。

## 解决方案

Content Workbench 把整条搬运流程变成一个 4 步工作流：粘贴抖音链接 -> 浏览候选视频并打分筛选 -> 自动下载/转录素材 -> 在 Studio 里逐平台编辑草稿和 checklist。Local-first，无需数据库，`npm run dev` 即可使用。

## 架构

```
┌──────────────────────────────────────────────────────┐
│  Presentation (App Router Pages + Components)        │
│  Intake / Session / Preparation / Studio             │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  Application Services                                │
│  discovery-service / prepare-service                 │
└───────────┬────────────────────────────┬─────────────┘
            │                            │
┌───────────▼──────────┐  ┌──────────────▼─────────────┐
│  Adapters            │  │  Repositories              │
│  Discovery (Douyin)  │  │  session / item / draft    │
│  Preparation (DL)    │  │  (owner-scoped)            │
└──────────────────────┘  └──────────────┬─────────────┘
                                         │
                          ┌──────────────▼─────────────┐
                          │  Persistence               │
                          │  V1: data/workspaces/ JSON  │
                          │  V2: Supabase + R2 (计划中) │
                          └────────────────────────────┘
```

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/zinan92/content-workbench.git
cd content-workbench

# 2. 安装依赖 (需要 Node 22 LTS)
npm install

# 3. 启动开发服务器 (无需配置环境变量，默认 fixture 模式)
npm run dev
```

打开 [http://localhost:3100](http://localhost:3100) 开始使用。

> V1 默认使用 fixture 模式，所有数据为本地模拟，无需外部服务。

## 工作流程

```
粘贴抖音链接 ──▶ 候选视频列表 ──▶ 勾选后下载/转录 ──▶ Studio 逐平台编辑
   Intake          Discovery         Preparation          Studio
```

1. **Intake** -- 粘贴抖音创作者主页或单条视频链接，自动识别类型
2. **Discovery** -- 浏览候选视频，查看播放量/点赞数，透明评分排序
3. **Preparation** -- 选中的视频自动下载 + 语音转文字，逐条追踪状态，失败可重试
4. **Studio** -- 源视频参考面板 + 5 个平台标签页，每个平台独立草稿 + checklist

## 功能一览

| 功能 | 说明 | 状态 |
|------|------|------|
| 链接识别 | 自动分类创作者主页 / 单条视频 / 不支持的链接 | 已完成 |
| 候选发现 | 浏览创作者视频列表，含播放/点赞/评论指标 | 已完成 |
| 透明评分 | 基于互动数据的简单评分，无黑箱推荐 | 已完成 |
| 素材准备 | 视频下载 + 语音转录，逐条隔离失败 | 已完成 |
| 失败重试 | 单条素材准备失败后可独立重试 | 已完成 |
| 多平台 Studio | 小红书/B站/微信视频号/公众号/X 五个平台标签页 | 已完成 |
| 平台草稿 | 每个平台独立标题、正文、封面备注 | 已完成 |
| Checklist | 每个平台独立发布检查清单 | 已完成 |
| 本地持久化 | JSON 文件存储，跨重启保持数据 | 已完成 |
| Auth 层 | Supabase Auth + local-operator fallback | 已完成 |
| Owner 隔离 | Repository 层级的用户数据隔离 | 已完成 |
| 托管部署 | Vercel + Supabase + R2 | 计划中 |

## 目标平台 (V1)

| 平台 | 输出内容 |
|------|----------|
| **小红书** (主平台) | 搜索关键词标题 + 文案草稿 + 封面/关键帧候选 |
| **B站** | 转载标题 + 描述 |
| **微信视频号** | 转载标题 + 描述 |
| **微信公众号** | 文章标题 + 正文草稿 |
| **X** | 短文案草稿 |

## API 参考

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/intake` | 提交抖音链接，创建 session |
| `GET` | `/api/sessions/:sessionId` | 获取 session 详情 + 候选列表 |
| `POST` | `/api/sessions/:sessionId/selection` | 提交选中的视频 |
| `POST` | `/api/sessions/:sessionId/prepare` | 启动素材准备 |
| `POST` | `/api/sessions/:sessionId/prepare/:itemId/retry` | 重试单条失败的准备 |
| `GET` | `/api/items/:itemId` | 获取单条内容详情 |
| `PUT` | `/api/items/:itemId/drafts` | 保存平台草稿 |

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | 全栈 Web 框架 |
| UI | React 19 + Tailwind CSS | 组件渲染 + 样式 |
| 语言 | TypeScript 5.7 | 类型安全 |
| 运行时 | Node.js 22 LTS | 服务端运行 |
| 测试 | Vitest + Testing Library | 单元/集成测试 |
| 持久化 | JSON 文件 (V1) / Supabase (V2) | 数据存储 |
| Auth | Supabase Auth / local-operator fallback | 用户认证 |

## 项目结构

```
content-workbench/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Intake 首页
│   ├── sessions/[sessionId]/     # Session 详情 + Preparation
│   ├── items/[itemId]/           # Studio 编辑页
│   ├── auth/sign-in/             # 登录页 (V2)
│   └── api/                      # API Route Handlers
│       ├── intake/               # 链接提交
│       ├── sessions/             # Session CRUD + 选择/准备
│       └── items/                # 内容详情 + 草稿保存
├── components/                   # React 组件
│   └── CandidateTable.tsx        # 候选视频表格
├── lib/
│   ├── domain/                   # 核心类型 + 业务逻辑
│   │   ├── types.ts              # Session, ContentItem, PlatformDraft
│   │   ├── links.ts              # 抖音链接分类
│   │   └── scoring.ts            # 透明评分算法
│   ├── services/                 # 应用服务层
│   │   ├── discovery-service.ts  # 候选发现
│   │   ├── prepare-service.ts    # 素材准备
│   │   └── workspace-store.ts    # JSON 文件持久化
│   ├── repositories/             # 数据仓库 (owner-scoped)
│   │   ├── session-repository.ts
│   │   ├── item-repository.ts
│   │   └── draft-repository.ts
│   ├── adapters/                 # 外部能力边界
│   │   ├── discovery-adapter.ts  # MediaCrawler 接口
│   │   └── preparation-adapter.ts # douyin-downloader 接口
│   ├── auth/                     # 认证层
│   └── config/                   # 环境变量 + feature flags
├── data/workspaces/              # V1 本地数据 (gitignored)
├── tests/                        # Vitest 测试
└── .env.local.example            # 环境变量模板
```

## 配置

### Adapter 模式

V1 默认使用 fixture 模式，无需任何外部依赖：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CONTENT_WORKBENCH_ADAPTER_MODE` | 全局 adapter 模式 | `fixtures` |
| `CONTENT_WORKBENCH_DISCOVERY_MODE` | 覆盖发现 adapter 模式 | 继承全局 |
| `CONTENT_WORKBENCH_PREP_MODE` | 覆盖准备 adapter 模式 | 继承全局 |

Discovery 模式: `fixtures` (默认), `partial`, `fail-on-resolution`
Preparation 模式: `fixtures` (默认), `mixed-outcomes`

### 托管环境 (V2, 可选)

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | V2 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 匿名密钥 | V2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥 (server-only) | V2 |
| `USE_HOSTED_PERSISTENCE` | 启用 Supabase 持久化 | 否 |
| `USE_HOSTED_STORAGE` | 启用 R2 存储 | 否 |
| `USE_HOSTED_WORKER` | 启用 Railway Worker | 否 |

## 开发命令

```bash
npm run dev          # 启动开发服务器 (localhost:3100)
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm test             # Vitest 测试 (watch 模式)
npm test -- --run    # 测试 (CI 模式)
```

## For AI Agents

本节面向需要将此项目作为工具或依赖集成的 AI Agent。

### 结构化元数据

```yaml
name: content-workbench
description: Douyin content replication workbench with multi-platform draft editing
version: 0.1.0
api_base_url: http://localhost:3100
endpoints:
  - path: /api/intake
    method: POST
    description: Submit a Douyin link and create a replication session
    body:
      content_type: application/json
      schema:
        link: string (Douyin creator profile or video URL)
  - path: /api/sessions/:sessionId
    method: GET
    description: Get session details with candidate items
    params:
      - name: sessionId
        type: string
        required: true
  - path: /api/sessions/:sessionId/selection
    method: POST
    description: Submit selected items for preparation
    body:
      content_type: application/json
      schema:
        selectedIds: string[]
  - path: /api/sessions/:sessionId/prepare
    method: POST
    description: Start asset preparation for selected items
  - path: /api/sessions/:sessionId/prepare/:itemId/retry
    method: POST
    description: Retry failed preparation for a single item
  - path: /api/items/:itemId
    method: GET
    description: Get content item detail with artifacts and drafts
  - path: /api/items/:itemId/drafts
    method: PUT
    description: Save platform-specific draft content
    body:
      content_type: application/json
      schema:
        platform: string (xiaohongshu|bilibili|video-channel|wechat-oa|x)
        title: string
        body: string
install_command: npm install
start_command: npm run dev
health_check: GET / (returns intake page)
dependencies:
  - next@16
  - react@19
  - typescript@5.7
capabilities:
  - accept Douyin links and classify as creator-profile or single-video
  - discover candidate videos with engagement metrics and scoring
  - prepare video assets (download + transcription)
  - edit multi-platform drafts with per-platform checklists
  - persist all state locally as JSON files
input_format: JSON API requests
output_format: JSON API responses
```

### Agent 调用示例

```python
import httpx

async def replicate_douyin_content():
    base = "http://localhost:3100"
    client = httpx.AsyncClient()

    # Step 1: 提交抖音链接
    resp = await client.post(f"{base}/api/intake", json={
        "link": "https://www.douyin.com/user/MS4wLjABAAAA..."
    })
    session = resp.json()
    session_id = session["sessionId"]

    # Step 2: 获取候选视频列表
    resp = await client.get(f"{base}/api/sessions/{session_id}")
    candidates = resp.json()["items"]

    # Step 3: 选择视频并提交
    selected = [item["id"] for item in candidates if item["simpleScore"] > 70]
    await client.post(f"{base}/api/sessions/{session_id}/selection", json={
        "selectedIds": selected
    })

    # Step 4: 启动素材准备
    await client.post(f"{base}/api/sessions/{session_id}/prepare")

    # Step 5: 保存平台草稿
    for item_id in selected:
        await client.put(f"{base}/api/items/{item_id}/drafts", json={
            "platform": "xiaohongshu",
            "title": "搜索关键词标题",
            "body": "小红书文案内容..."
        })
```

## 相关项目

| 项目 | 说明 | 链接 |
|------|------|------|
| MediaCrawler | 抖音创作者内容发现 (adapter 数据源) | 本地: `~/work/content-co/MediaCrawler` |
| douyin-downloader-1 | 抖音视频下载 + 转录 (adapter 数据源) | 本地: `~/work/content-co/douyin-downloader-1` |

## License

Private -- 内部内容运营工具。
