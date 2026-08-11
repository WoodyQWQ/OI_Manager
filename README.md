# OI_Manager

OI 竞赛题目测试点管理工具 —— 在浏览器中管理题目的输入输出测试数据、Subtask 配置、题面预览，支持从洛谷 / Codeforces 一键导入。

## 下载与安装

### 1. 前置要求

- [Node.js](https://nodejs.org/) 18 或更高版本（推荐 LTS）
- npm（随 Node.js 一同安装）

验证安装：

```bash
node --version   # 应输出 v18.x 或更高
npm --version
```

### 2. 获取项目

#### 方式一：下载 ZIP

从 GitHub Release 或仓库页面点击 **Code → Download ZIP**，解压后进入项目目录：

```bash
cd OI_Manager    # 或解压后的实际文件夹名
```

#### 方式二：克隆仓库

```bash
git clone https://github.com/<你的用户名>/OI_Manager.git
cd OI_Manager
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发服务器

```bash
npm run dev
```

终端会显示类似如下输出：

```
  VITE v5.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

在浏览器中打开 **http://localhost:5173/** 即可使用。

### 5. 构建生产版本（可选）

如需部署到静态服务器：

```bash
npm run build
```

构建产物输出到 `dist/` 目录，可直接上传至任意静态托管平台（GitHub Pages、Vercel、Netlify 等）。

本地预览构建产物：

```bash
npm run preview
```

---

## 功能使用指南

### 创建题目

1. 点击右上角 **+ 新建题目**
2. 填写「题目编号」（如 `P1001`）和「题目标题」
3. 点击「创建」进入题目详情页

### 导入题目

点击右上角 **📥 导入题目**，选择导入方式：

#### 洛谷

- 输入洛谷题号（如 `P1001`、`P2001`、`U295036`）
- 点击「导入」，工具会自动拉取题面（含 Markdown 描述、LaTeX 公式、样例、时空限制）
- 依赖公共 CORS 代理，如网络不稳定可重试或改用粘贴导入

#### Codeforces

- 输入比赛 ID 和题号（如 `1835` + `C`）
- 导入元数据（标题、标签、时空限制），题面需手动补充

#### 粘贴导入

- 适用于 AtCoder、Vjudge 等任意 OJ 平台
- 手动填写题号、标题、时空限制，并将题面以 Markdown 格式粘贴

### 管理测试点

进入题目详情页后，在「测试点」标签页操作：

#### 上传文件

- **拖拽上传**：将 `.in` / `.out` / `.ans` 文件拖入虚线框区域
- **点击选择**：点击虚线框或「📁 选择文件」按钮
- **自动配对**：同名文件自动配对为输入输出（`1.in` ↔ `1.out`）
- **增量上传**：先传 `1.in` 再传 `1.out` 会自动合并到同一测试点，不会重复创建

#### 快速添加

点击「+ 快速添加」可直接在文本框中粘贴输入和输出内容，无需创建文件。

#### 编辑测试点

切换到「✏️ 编辑器」模式，点击任意测试点卡片即可：
- 在线编辑输入 / 输出内容
- 修改备注
- 分配 Subtask

#### 文件对比

切换到「🔀 对比」模式：
- 可手动粘贴两段内容进行行级 Diff 对比
- 支持内联和并排两种显示模式
- 也可从测试点列表点击「🔀」快速将测试点加入对比

### Subtask 配置

切换到「Subtask」标签页：
- 添加 Subtask 并设置分数（总分应为 100）
- 选择评分方式：取最小值（min）或求和（sum）
- 配置 Subtask 间的依赖关系（依赖图会自动检测环）

### 题目类型

在详情页顶部选择题目类型：

| 类型 | 说明 |
|------|------|
| 💻 传统题 | 编译运行 + 输入输出比对 |
| 📝 提交答案 | 只需要 `.out` 文件，学生提交答案包 |
| 🔄 交互题 | 使用 interactor 与标程管道通信 |

### 题面预览

切换到「题面」标签页：
- 支持 Markdown 语法
- 支持 LaTeX 数学公式（`$...$` 行内，`$$...$$` 块级）
- 支持代码块和表格
- 点击「👁️ 预览」实时渲染

### 校验

切换到「校验」标签页，工具会自动检查：
- 测试点是否缺少输入或输出
- Subtask 总分是否为 100
- Subtask 依赖图是否存在环
- 测试点是否已分配到 Subtask

### 导出

点击「📤 导出洛谷ZIP」可生成符合洛谷格式要求的 ZIP 压缩包，包含：
- 按编号命名的 `.in` / `.out` 文件
- `config.yaml` 配置文件
- Subtask 配置信息

### 主题切换

点击顶栏右上角的 ☀️ / 🌙 按钮可实时切换浅色 / 深色模式，设置会自动保存到浏览器本地。

### 题目出处

在主页将鼠标悬停在题目卡片上，会显示该题目的来源：
- **于 OI_Manager 建立** —— 本地新建的题目
- **出处：洛谷** —— 从洛谷导入
- **出处：Codeforces** —— 从 Codeforces 导入
- **出处：粘贴导入** —— 手动粘贴导入

---

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript 5 | 前端框架 |
| Vite 5 | 构建工具 |
| TailwindCSS 3 | 样式 |
| Dexie.js (IndexedDB) | 本地数据存储 |
| JSZip | ZIP 打包导出 |
| react-markdown + KaTeX | 题面 Markdown 渲染 |

## 项目结构

```
OI_Manager/
├── src/
│   ├── components/
│   │   ├── ProblemList.tsx       # 主页题目列表
│   │   ├── ProblemDetail.tsx     # 题目详情页
│   │   ├── TestCaseUploader.tsx  # 测试点管理
│   │   ├── SubtaskEditor.tsx     # Subtask 配置
│   │   ├── ImportModal.tsx       # 导入弹窗
│   │   ├── MarkdownRenderer.tsx  # Markdown 渲染
│   │   └── DiffViewer.tsx        # 文件对比
│   ├── db.ts                     # 数据库操作
│   ├── ojImport.ts               # OJ 题目导入
│   ├── useTheme.ts               # 主题切换
│   ├── types.ts                  # 类型定义
│   ├── utils.ts                  # 工具函数
│   └── App.tsx                   # 应用入口
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 常见问题

**Q：洛谷导入失败怎么办？**

工具通过公共 CORS 代理获取洛谷页面数据，代理服务可能偶尔不稳定。请稍后重试，或改用「粘贴导入」手动粘贴题面。

**Q：数据存储在哪里？**

所有数据存储在浏览器的 IndexedDB 中，不会上传到任何服务器。清除浏览器数据会导致题目丢失，请注意备份。

**Q：如何备份数据？**

使用「📤 导出洛谷ZIP」功能导出测试点文件。题面内容可在详情页复制 Markdown 文本保存。

**Q：支持离线使用吗？**

启动后核心功能（创建题目、管理测试点、导出 ZIP）完全离线可用。仅「从洛谷/Codeforces 导入」需要网络连接。

## License

MIT
