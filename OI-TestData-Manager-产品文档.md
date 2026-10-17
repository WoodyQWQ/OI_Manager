# OI 竞赛题目测试点管理系统 — 产品文档

> **项目代号**：LuoguTDK (Luogu Test Data Kit)  
> **文档版本**：v1.0  
> **最后更新**：2026-08-07  
> **适用平台**：Web 应用（桌面端优先）

---

## 1. 产品概述

### 1.1 背景与痛点

在 OI（奥林匹克信息学竞赛）/ ACM-ICPC 训练与出题流程中，题目测试点数据的制作、组织、校验、打包发布是一项高频且繁琐的工作：

| 痛点 | 具体表现 |
|------|----------|
| **文件管理混乱** | 手工管理 `.in` / `.out` 文件，命名不规范，易遗漏、错配 |
| **子任务（Subtask）依赖复杂** | 洛谷要求测试点按 subtask 分组并设置分数、依赖关系，手写 `config.yml` 易错 |
| **人工校验低效** | 数据规模大时，手工比对输入输出一致性、检查格式错误耗时巨大 |
| **打包格式不兼容** | 不同 OJ 平台要求的 ZIP 结构、配置文件格式不同，需反复调整 |
| **版本追溯困难** | 测试数据修改后无版本记录，出现问题难以回溯 |
| **标程重测不便** | 修改数据后，需手动用标程重新生成输出，步骤繁琐且易出错 |

**LuoguTDK** 旨在为 OI 出题人、验题人提供一套「可视化、自动化、规范化」的测试数据全生命周期管理工具，深度适配洛谷（Luogu）平台的格式规范。

---

### 1.2 产品定位

一款 **面向 OI 竞赛出题场景的测试点数据管理 Web 应用**，核心围绕「**创建 → 组织 → 校验 → 导出**」四大环节，做到：

- ✅ **零配置开箱即用**：内置洛谷格式规范，无需手写 YAML
- ✅ **可视化操作**：拖拽上传、分组管理、实时预览
- ✅ **自动化流水线**：标程重测、格式校验、完整性检查一键完成
- ✅ **多格式兼容**：一键导出洛谷 ZIP、通用 testlib 格式、NOIP 传统格式

---

### 1.3 目标用户

| 用户角色 | 核心诉求 |
|----------|----------|
| **OI 出题人** | 快速组织测试点、正确配置 subtask、生成可上传洛谷的数据包 |
| **验题人 / 数据管理员** | 校验数据合法性、对照标程核验输出、检查覆盖度 |
| **比赛组织者（校内 / 省选 / NOIP 模拟）** | 批量管理多道题目数据、统一格式导出、存档 |
| **教练 / 集训队负责人** | 制作训练题、分发规范的数据包给学生 |

---

### 1.4 核心价值主张

> **把 1 小时的手工数据整理，压缩到 5 分钟。**

1. **规范化**：强制遵循洛谷 `problem.conf` / `config.yml` 格式规范，从根源消除格式错误
2. **可视化**：所有操作在界面完成，告别命令行 + 文本编辑器组合
3. **自动化**：内置标程编译器、SPJ 编译器、批量校验流水线
4. **可追溯**：每次修改有记录，支持版本对比与回滚

---

## 2. 功能需求

### 2.1 功能架构总览

```
┌───────────────────────────────────────────────────────────┐
│                        LuoguTDK                            │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  题目管理    │  测试点管理  │  校验引擎    │  导出中心       │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ · 题目创建   │ · 拖拽上传   │ · 格式校验   │ · 洛谷ZIP      │
│ · 题面编辑   │ · 批量导入   │ · 输入输出配 │ · 通用格式     │
│ · 标签分类   │ · Subtask分  │   对检查     │ · testlib包    │
│ · 版本快照   │   组管理     │ · 标程重测   │ · 自定义模板   │
│ · 题目克隆   │ · 分数分配   │ · SPJ校验    │ · 版本快照导出  │
│             │ · 依赖设置   │ · 数据范围   │                 │
│             │ · 测试点预览 │   检查       │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

---

### 2.2 模块一：题目管理（Problem Hub）

#### 2.2.1 题目创建与编辑

| 功能项 | 说明 |
|--------|------|
| 新建题目 | 填写题目编号（如 `P1001`）、标题、难度、来源、标签、时空限制 |
| 题面 Markdown 编辑 | 内置 MD 编辑器，支持题目描述、输入输出格式、样例、数据范围、提示 |
| 题目配置 | 时间限制（ms）、内存限制（MB）、栈大小、O2 开关、SPJ 开关、交互题开关、文件 IO 配置 |
| 样例管理 | 独立于正式测试点的 `sample1.in/.out`、`sample2.in/.out`，支持从测试点一键升格 |
| 题目克隆 | 基于已有题目快速复制生成新题（含所有测试点与配置） |
| 题目导入 | 从洛谷题目 URL、Maszyna/OI Wiki 格式 JSON、或 ZIP 包直接导入 |

#### 2.2.2 版本快照

- 每次「保存」或「导出」自动生成快照
- 快照包含：配置信息 + 所有测试点文件 hash + 标签备注
- 支持：**对比**（任意两个快照的差异）、**回滚**（恢复到历史版本）、**导出快照**（存档）

---

### 2.3 模块二：测试点管理（Test Case Studio）—— 核心模块

#### 2.3.1 测试点上传与导入

| 功能项 | 细节 |
|--------|------|
| **拖拽上传** | 支持批量拖入 `.in` / `.out` / `.ans` 文件，自动识别配对 |
| **智能命名解析** | 自动识别 `test1.in` / `test1.out`、`1.in` / `1.out`、`a_1.in` 等常见命名模式并自动配对 |
| **文件夹导入** | 直接导入文件夹，递归解析并扁平化或保留层级结构 |
| **ZIP 导入** | 直接导入洛谷格式 / 通用格式 ZIP，自动还原测试点与配置 |
| **数据生成器脚本** | 内置 C++ / Python 数据生成器执行环境：编写 `gen.cpp` 设置参数（随机种子、规模 N 范围）自动批量生成测试点 |
| **粘贴新建** | 直接在文本框粘贴输入输出内容创建单测 |

#### 2.3.2 Subtask 分组与依赖

洛谷要求通过 `config.yml` 配置 subtask 依赖与得分。本模块提供完全可视化操作：

```
可视化工作流：
  测试点列表 ──拖拽分组──▶ Subtask 1 (40分)
                         │  ├── test1.in (10)
                         │  ├── test2.in (10)
                         │  ├── test3.in (10)
                         │  └── test4.in (10)
                         ├── Subtask 2 (30分) [依赖 Subtask 1]
                         │  ├── test5.in
                         │  └── test6.in
                         └── Subtask 3 (30分) [依赖 Subtask 1 & 2]
                            └── test7~10.in
```

**配置项**：
- Subtask 名称、总分、依赖关系（多选上游）
- 单个测试点分数 / 权重自动均分
- **分数模式**：Subtask 总分均分 / 测试点单独设分 / 按权重分配
- **依赖类型**：AND（全部通过才得分）/ OR（任一通过）—— 洛谷默认 AND
- 测试点可跨 Subtask 复用（同一份数据属于多个 Subtask）

#### 2.3.3 测试点属性管理

对每个测试点可配置：
- 别名 / 备注（如「n=1e5 链」、「极限卡常」、「全空」）
- 单独的时间 / 内存覆盖（仅该测试点特殊）
- 所属 Subtask 列表
- 文件大小、行数、哈希值自动计算展示

#### 2.3.4 测试点编辑器

- 输入 / 输出文件内容分屏预览，支持语法高亮、行号、跳转
- 超过 10MB 的大文件自动截断预览（前 500 行 + 后 200 行），并提示下载完整文件
- 支持直接编辑文本框修改内容并保存
- 支持「用标程生成输出」（标程配置好后一键覆盖当前 `.out`）

---

### 2.4 模块三：校验引擎（Validation Pipeline）

对题目与测试点执行多维度自动化检查，确保可直接上传洛谷无误。

#### 2.4.1 校验项清单

| 类别 | 校验项 | 严重级别 |
|------|--------|----------|
| **格式规范** | 1. 每个 `.in` 必有对应 `.out` / `.ans` | ❌ 错误 |
|            | 2. 所有 Subtask 分数之和 == 100 | ❌ 错误 |
|            | 3. 测试点命名不含非法字符 | ⚠️ 警告 |
|            | 4. `problem.conf` 所需字段完整性 | ❌ 错误 |
|            | 5. 文件 IO 模式下输入输出文件名配置一致 | ❌ 错误 |
| **内容质量** | 6. 输入格式与题面描述的输入格式一致性（正则或文法校验，可选） | ⚠️ 警告 |
|            | 7. 输出文件非空（空输出给出警告） | ⚠️ 警告 |
|            | 8. 测试点数据规模在题面声明范围内（如 n ≤ 1e5 则扫描行数/大小估算） | ⚠️ 警告 |
|            | 9. 无重复内容的测试点（内容 hash 去重） | ⚠️ 警告 |
| **Subtask** | 10. Subtask 依赖图无环（拓扑检查） | ❌ 错误 |
|            | 11. 被依赖的 Subtask 分数不为 0 | ⚠️ 警告 |
|            | 12. 所有测试点至少属于一个 Subtask | ⚠️ 警告 |
| **SPJ**     | 13. 开启 SPJ 时 `spj.cpp` 存在且可编译 | ❌ 错误 |
| **运行校验** | 14. 标程能编译通过 | ❌ 错误 |
|            | 15. 标程对每个输入生成输出与现有 `.out` 比对一致（可选择全部/抽样） | ❌ 错误 |
|            | 16. 标程运行不超过题目时间限制（每个测试点报告耗时） | ⚠️ 警告 |

#### 2.4.2 标程重测（Rejudge）

**配置步骤**：
1. 上传或粘贴标程（支持 C++17 / C++14 / Python 3 / PyPy3 / Java 17）
2. 可选：上传 checker（`testlib.h` 的 checker 或自定义 SPJ）
3. 选择「全部重测」或「抽样 N 个」或「指定测试点」
4. 执行完成后生成对比报告：

```
重测报告示例：
────────────────────────────────────────────
PASS test1.in   [耗时 12ms]   输出完全匹配
PASS test2.in   [耗时 45ms]   输出完全匹配
FAIL test3.in   [耗时 108ms]  第 1 行差异：期望 42，实际 37
                        ↑ 点击查看详细 diff
TLE  test5.in   [2001ms > 2000ms]  超时
CE   spj.cpp    第 23 行编译错误: ...
────────────────────────────────────────────
通过 8/10 个测试点，2 个失败
```

- 提供**逐字符 Diff** 与**逐行 Diff** 两种视图
- 可一键「使用标程输出覆盖现有 out 文件」

---

### 2.5 模块四：导出中心（Export Hub）

#### 2.5.1 洛谷原生格式导出（⭐ 核心）

严格遵循洛谷官方题目数据包格式规范：

```
导出 ZIP 结构（洛谷格式）：
P1001-A+B-Problem/
├── problem.conf              # 题目元信息（时间/内存限制、文件IO等）
├── problem.md                # 题面（可选，洛谷可识别）
├── config.yml                # Subtask 配置（洛谷增强）
├── sample/
│   ├── sample1.in
│   └── sample1.out
├── spj/                      # 如果启用 SPJ
│   ├── spj.cpp               # 或 spj.py / spj.java
│   └── testlib.h             # 如需要
├── std/                      # 可选：标程（洛谷不强制）
│   └── std.cpp
└── data/
    ├── 1.in    /  1.out
    ├── 2.in    /  2.out
    ├── ...
    └── 10.in   /  10.out
```

**自动生成的 `config.yml` 示例**：
```yaml
type: default
checker:
  type: default   # 或 compare_all / custom
  checker: spj.cpp  # 如果自定义
subtasks:
  - score: 40
    type: min     # AND 模式：取该 subtask 内最低分
    cases: [1, 2, 3, 4]
  - score: 30
    type: min
    depends: 1
    cases: [5, 6]
  - score: 30
    type: min
    depends: [1, 2]
    cases: [7, 8, 9, 10]
```

#### 2.5.2 其他导出格式

| 格式 | 适用场景 | 说明 |
|------|----------|------|
| **HUSTOJ / NOIP 传统格式** | 传统 OJ | `test1.in/test1.out` 扁平结构 + `data_count` 文件 |
| **testlib 通用格式** | Polygon 兼容 | 目录 `tests/` 下数字编号 + `testsets` 配置 |
| **Maszyna 格式** | 波兰 OI 系统 | `zad.json` + `in/` `out/` 分离目录 |
| **导出 Excel 清单** | 提交审核用 | 包含测试点列表、Subtask、分数、备注的表格 |
| **自定义模板** | 高级用户 | 基于 Jinja2 / Handlebars 模板自定义结构 |

#### 2.5.3 批量导出

- 多题目同时选中 → 批量导出为独立 ZIP 或合并为一个大压缩包
- 可附加「导出清单.md」说明每道题数据结构

---

## 3. 典型用户场景

### 场景 A：出题人小张制作一道新题

```
1. 新建题目「P1001 A+B Problem」→ 填写时空限制 1s/128MB
2. 编写题面 MD（描述 / 输入格式 / 输出格式 / 样例）
3. 进入测试点管理：
   a. 拖拽上传手工造的 5 个小测试点
   b. 编写 gen.py（随机构造 n 与整数对），设置 N=100 生成 5 个中等数据
   c. 设置 N=1e5 生成 3 个极限大数据
   d. 上传 std.cpp，点击「一键生成所有 .out」
4. 可视化创建 Subtask：
   - Subtask 1 (30 分): 测试点 1-5（小规模）
   - Subtask 2 (30 分): 测试点 6-10（中等），依赖 Subtask 1
   - Subtask 3 (40 分): 测试点 11-13（极限），依赖 Subtask 2
5. 点击「运行完整校验」→ 15 项全通过
6. 导出「洛谷 ZIP」→ 直接在洛谷题目管理页上传
```

### 场景 B：验题人小李审核同学的题目数据

```
1. 导入同学提供的 ZIP 包
2. 运行「完整校验」→ 发现：
   - ❌ test7.in 缺少 .out
   - ❌ Subtask 2 的 depends 写成了不存在的 Subtask 4
   - ⚠️ test5.in 与 test6.in 内容完全相同
3. 修复上述问题后，上传自己写的标程 std2.cpp
4. 执行「标程重测」→ 对比原数据的输出与 std2 的输出
5. 发现 test3.out 原答案错误 → 查看 Diff，确认原标程 bug
6. 一键「用 std2 的输出覆盖所有 .out」
7. 导出新版本 ZIP，附「版本变更记录.md」回给出题人
```

### 场景 C：教练老王批量导出 10 道模拟赛题

```
1. 左侧题目列表复选框勾选 10 道题
2. 点击「批量导出」→ 选择「洛谷格式」+「合并为单包」
3. 导出 `2026暑训第三场模拟.zip`，内含 10 个题目文件夹
4. 同时勾选「附导出清单」，生成每道题的测试点统计表
5. 上传至洛谷私人题库批量导入
```

---

## 4. 技术架构设计

### 4.1 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端（浏览器）                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  React + TS 界面  │  │  Monaco 编辑器    │  │  Diff Viewer  │  │
│  │  TailwindCSS      │  │  Markdown 预览    │  │  可视化分组   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬────────┘  │
│           │                     │                   │           │
│           └─────────────────────┼───────────────────┘           │
│                                 │                               │
│  ┌──────────────────────────────▼──────────────────────────┐    │
│  │                    浏览器本地存储层                       │    │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │    │
│  │  │ IndexedDB  │  │ 内存虚拟文件  │  │ Service Worker  │  │    │
│  │  │ (元数据)    │  │ 系统 (OPFS)  │  │ 离线缓存        │  │    │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │    │
│  └──────────────────────────────┬──────────────────────────┘    │
│                                 │ （可选）                       │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ HTTPS / WebSocket
┌─────────────────────────────────▼───────────────────────────────┐
│                     后端服务（可选：云端协作）                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Express/Nest│  │  沙箱编译    │  │   MinIO 对象存储      │   │
│  │  REST API    │  │  (Isolate)   │  │   (测试点大文件)      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────────▼───────────┐   │
│  │  PostgreSQL  │  │  Redis 队列  │  │   对象存储 (S3兼容)   │   │
│  │  元数据DB     │  │  重测任务     │  │   (测试点/快照/导出)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**设计原则**：**本地优先（Local-First）**  
v1.0 核心功能完全在浏览器端运行，无需注册、无需后端，用户数据私有且离线可用。后续版本可选择性启用云端协作后端。

---

### 4.2 前端技术栈

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **框架** | React 18 + TypeScript 5 | 生态成熟，类型安全，适合复杂交互 |
| **构建** | Vite 5 + pnpm | 极速 HMR，包管理快 |
| **UI** | TailwindCSS 3 + shadcn/ui | 高度可定制，组件质量高 |
| **状态** | Zustand + Immer | 轻量，支持复杂状态不可变更新 |
| **编辑器** | Monaco Editor (VS Code 内核) | 代码编辑、Diff、Markdown 预览均内置 |
| **MD 渲染** | React Markdown + remark-math + rehype-katex | 支持 LaTeX 公式（OI 题面必备） |
| **表格** | TanStack Table v8 | 测试点列表、Subtask 表格、对比报告 |
| **拖拽** | @dnd-kit/core + sortable | Subtask 分组拖拽、测试点重排 |
| **文件处理** | BrowserFS / OPFS (Origin Private File System) | 浏览器内虚拟文件系统，高效处理大文件 |
| **压缩** | JSZip + fflate (WASM) | ZIP 打包解压，fflate 提供 WASM 级压缩性能 |
| **数据库** | IndexedDB (Dexie.js 封装) | 存储题目元数据、版本快照 |
| **校验 Diff** | diff-match-patch / Monaco DiffEditor | 输出差异可视化 |
| **编译运行** | WebAssembly (WASI) + Emscripten 编译的 GCC / Clang（v2） | 浏览器端直接编译 C++ 标程并运行 |

---

### 4.3 后端技术栈（可选：云端协作版 v2+）

| 组件 | 选型 | 用途 |
|------|------|------|
| Web 框架 | NestJS (TypeScript) | RESTful + WebSocket API |
| 数据库 | PostgreSQL 16 + Prisma ORM | 用户、题目、测试点元数据、版本记录 |
| 缓存 | Redis 7 | 任务队列、热点数据缓存 |
| 编译沙箱 | [ioi/isolate](https://github.com/ioi/isolate)（官方竞赛沙箱） | 安全地编译运行 C++/Python 等标程、SPJ |
| 对象存储 | MinIO / 阿里云 OSS / S3 | 测试点文件、快照、导出包的持久化存储 |
| 消息队列 | BullMQ (Redis) | 异步处理重测任务、批量导出任务 |
| 鉴权 | NextAuth.js + JWT | 洛谷 OAuth 登录 / 邮箱登录 |

---

## 5. 数据结构设计

### 5.1 核心领域模型（前端 + 后端通用）

#### 5.1.1 Problem（题目）

```typescript
interface Problem {
  id: string;                    // UUID
  slug: string;                  // 题目编号，如 "P1001"
  title: string;                 // 标题
  difficulty?: '入门'|'普及-'|'普及/提高-'|...;  // 洛谷难度
  source?: string;               // 来源，如 "NOIP 2023"
  tags: string[];                // 标签：["模拟","贪心"]
  createdAt: number;
  updatedAt: number;
  
  // 题目配置
  config: ProblemConfig;
  // 题面
  statement: ProblemStatement;
  // Subtask 配置
  subtasks: Subtask[];
  // 样例
  samples: Sample[];
  // 测试点索引（不含文件内容，内容存 OPFS）
  testCases: TestCaseMeta[];
  // 版本快照
  snapshots: Snapshot[];
  // SPJ / Checker
  spj?: SPJConfig;
  // 标程引用
  std?: ProgramReference;
}

interface ProblemConfig {
  timeLimitMs: number;           // 默认 1000ms
  memoryLimitMB: number;         // 默认 128MB
  stackLimitMB?: number;
  enableO2: boolean;             // 默认 true
  isInteractive: boolean;        // 是否交互题
  fileIO: {
    enabled: boolean;
    inputFileName?: string;      // 如 "apple.in"
    outputFileName?: string;     // 如 "apple.out"
  };
  scoringRule: 'sum' | 'min' | 'max';  // 测试点计分方式
}
```

#### 5.1.2 TestCase（测试点）

```typescript
interface TestCaseMeta {
  id: string;
  name: string;                  // 展示名，如 "test1"
  number: number;                // 数据编号（导出用）
  note?: string;                 // 备注
  
  // 文件定位（OPFS 路径 或 对象存储 Key）
  inputFileRef: FileRef;
  outputFileRef: FileRef;
  
  // 统计信息（自动计算）
  stats: {
    inputSize: number;           // 字节
    outputSize: number;
    inputLineCount: number;
    outputLineCount: number;
    inputMD5: string;
    outputMD5: string;
  };
  
  // 覆盖配置（可选）
  override?: {
    timeLimitMs?: number;
    memoryLimitMB?: number;
  };
  
  subtaskIds: string[];          // 所属 Subtask
}

interface FileRef {
  store: 'opfs' | 's3' | 'memory';
  path: string;                  // 如 /problems/{pid}/data/{tcid}.in
  size: number;
  hash: string;                  // MD5
}
```

#### 5.1.3 Subtask

```typescript
interface Subtask {
  id: string;
  index: number;                 // 编号，从 1 开始
  name?: string;                 // 如 "小数据 n≤1000"
  score: number;                 // 总分
  dependsOn: string[];           // 依赖的 Subtask id 列表
  scoringType: 'min' | 'sum' | 'max';  // 组内计分：AND/均分...
  testCaseOrder: string[];       // 本 Subtask 测试点 id 列表
}
```

#### 5.1.4 Snapshot（快照 / 版本）

```typescript
interface Snapshot {
  id: string;
  version: string;               // 语义化版本或递增号 v1, v2
  tag?: string;                  // 用户备注标签，如 "终稿"
  createdAt: number;
  message?: string;              // 提交信息
  
  // 内容摘要（hash 链防篡改）
  configHash: string;
  testCaseHashes: Record<string, {in: string, out: string}>;
  overallHash: string;           // 所有内容综合 hash
  
  // 导出存档引用（可选）
  exportRef?: FileRef;           // 完整 ZIP 包
}
```

---

### 5.2 OPFS 虚拟文件布局（浏览器端）

```
/opfs-root/
└── luogu-tdk/
    └── problems/
        └── {problem-uuid}/
            ├── meta.json           # Problem 对象序列化
            ├── statement.md        # 题面原始 MD
            ├── spj/
            │   ├── spj.cpp
            │   └── testlib.h
            ├── std/
            │   └── std.cpp
            ├── samples/
            │   ├── sample1.in
            │   └── sample1.out
            └── data/
                ├── tc-{id1}.in
                ├── tc-{id1}.out
                ├── tc-{id2}.in
                └── tc-{id2}.out
```

元数据（Problem 对象）存入 IndexedDB `problems` 表，大文件二进制存 OPFS 高性能读写。

---

### 5.3 数据库表（后端版 v2）

```sql
-- 题目
CREATE TABLE problems (
  id UUID PRIMARY KEY,
  slug VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  statement JSONB NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtask
CREATE TABLE subtasks (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  idx INT NOT NULL,
  name VARCHAR(128),
  score INT NOT NULL,
  depends_on UUID[],
  scoring_type VARCHAR(16) DEFAULT 'min',
  UNIQUE (problem_id, idx)
);

-- 测试点
CREATE TABLE test_cases (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  number INT NOT NULL,
  name VARCHAR(64),
  note VARCHAR(256),
  input_object_key VARCHAR(512),  -- S3 key
  output_object_key VARCHAR(512),
  input_size BIGINT,
  output_size BIGINT,
  input_md5 VARCHAR(32),
  output_md5 VARCHAR(32),
  UNIQUE (problem_id, number)
);

-- 测试点-Subtask 多对多
CREATE TABLE test_case_subtasks (
  test_case_id UUID REFERENCES test_cases(id) ON DELETE CASCADE,
  subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE,
  PRIMARY KEY (test_case_id, subtask_id)
);

-- 快照
CREATE TABLE snapshots (
  id UUID PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  version VARCHAR(32) NOT NULL,
  tag VARCHAR(64),
  message TEXT,
  overall_hash VARCHAR(64) NOT NULL,
  export_object_key VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 洛谷适配细节（⭐ 关键）

本章节精确对齐**洛谷开放平台 / 题目导入规范 v3.x**，确保导出数据包可**零修改上传**。

### 6.1 `problem.conf` 生成规则

洛谷 `problem.conf` 使用 **key=value** 格式，UTF-8 编码，行末不可有多余空格：

| 字段 | 生成值 | 示例 |
|------|--------|------|
| `title` | Problem.title | `title=A+B Problem` |
| `timelimit` | Problem.config.timeLimitMs 转秒（保留 2 位小数） | `timelimit=1.0` |
| `memorylimit` | Problem.config.memoryLimitMB | `memorylimit=128` |
| `stacklimit` | 如有则写，否则省略 | `stacklimit=256` |
| `subtask_count` | subtasks.length | `subtask_count=3` |
| `using_answer_checker` | 启用 SPJ 写 `on`，否则省略 | `using_answer_checker=on` |
| `answer_checker_cmd` | SPJ 编译后的命令行 | `answer_checker_cmd=./spj` |
| `use_builtin_judger` | 通常省略（默认 on） | |
| `use_builtin_checker` | 未启用 SPJ 时写 `on` | `use_builtin_checker=on` |
| `interactive` | 交互题写 `on` | `interactive=on` |
| `file_io_input_name` | fileIO 输入文件名 | `file_io_input_name=apple.in` |
| `file_io_output_name` | fileIO 输出文件名 | `file_io_output_name=apple.out` |
| `enable_o2` | O2 开关（注意不是 on/off 是数字 0/1） | `enable_o2=1` |

**Subtask 配置块**（紧跟在 `subtask_count` 后，注意是 `problem.conf` 旧式格式，非 `config.yml`）：

```
subtask1_begin
score=40
type=min            # min代表AND模式(所有通过才给分)，sum代表组内求和
case_num_begin
4
1 2 3 4
case_num_end
depend_begin
0                    # 0表示无依赖
depend_end
subtask1_end

subtask2_begin
score=30
type=min
case_num_begin
2
5 6
case_num_end
depend_begin
1
1                    # 依赖 subtask 1
depend_end
subtask2_end
```

> ⚠️ **关键坑点**：`case_num_begin` 下第一行是**数量**，第二行才是编号列表。依赖编号是 **Subtask 的序号**而非 Subtask 的 ID。这是许多手写 conf 出错的地方，LuoguTDK 内部必须严格按 Subtask.index 映射。

### 6.2 `config.yml` 生成规则（洛谷增强配置，可选）

如果导出时勾选「使用增强 YAML 配置」（推荐），除了 `problem.conf` 外额外生成 `config.yml`，优先级更高：

```yaml
# 基础信息
title: A+B Problem
title_en: A+B Problem
author: ''
type: default      # default | interactive | submit_answer

# 时空限制（单组/全局）
time_limit: 1000        # ms, 支持数组 [1000, 1500] 对每组不同
memory_limit: 134217728 # bytes = 128MB

# 校验器
checker:
  type: default         # default(忽略空白/行尾空格)
                        # compare_all(逐字节严格比较)
                        # custom(自定义SPJ)
  checker: ./spj        # 如果 type=custom，相对于 spj/ 目录的路径
  lang: cpp             # spj 源码语言

# Subtask 定义
subtasks:
  - id: 1
    score: 40
    time_limit: 1000
    memory_limit: 134217728
    type: min           # min=AND模式, sum=OR求和模式
    cases: [1, 2, 3, 4]
    depends: []

  - id: 2
    score: 30
    type: min
    cases: [5, 6]
    depends: [1]        # 依赖 subtask 1

  - id: 3
    score: 30
    type: min
    cases: [7, 8, 9, 10]
    depends: [1, 2]     # 多依赖
```

### 6.3 测试点命名映射规则

导出时，**内部 UUID 编号必须转换为洛谷要求的数字编号**（从 1 开始的连续整数）：

```
映射表生成逻辑：
  1. 收集所有 Subtask 的 cases 列表，合并去重
  2. 按 TestCaseMeta.number 排序（用户可手动调整顺序）
  3. 分配洛谷编号 1..N
  4. 更新所有 Subtask.cases 中的编号

文件命名：
  输入 → data/{luogu_idx}.in
  输出 → data/{luogu_idx}.out  (优先) 或 data/{luogu_idx}.ans (兼容)
```

### 6.4 样例命名与放置

```
sample/
  sample1.in
  sample1.out       ← 必须用 .out，洛谷不识别 .ans 作为样例输出
  sample2.in
  sample2.out
```

同时在 `problem.conf` 中声明（可选但推荐）：
```
sample_count=2
```

### 6.5 SPJ 适配

洛谷支持 testlib 格式 SPJ，打包要求：

```
spj/
├── spj.cpp          ← 主文件（可以不是这个名字，但在 conf 中要匹配）
├── testlib.h        ← 如使用 testlib 必须一并打包
└── [其他头文件...]
```

**关键注意**：
- SPJ 的返回码：0 = AC，1 = WA，2 = PE，7 = 评判失败（不可用）
- 命令行参数：`./spj <in> <out> <ans>`（testlib 标准）
- 若使用 `checker type=custom`，`checker` 字段指定的是**相对 spj 目录的路径**

### 6.6 特殊题型

| 题型 | 适配要点 |
|------|----------|
| **文件 IO 题** | `problem.conf` 必须声明 `file_io_input_name` / `file_io_output_name`；测试点内部内容不改变，但学生代码需用 `freopen` 读指定文件名 |
| **交互题** | `type=interactive`；`problem.conf` 写 `interactive=on`；需提供 `interactor` 代码并打包到 `spj/interactor.cpp`；标程使用两进程管道交互 |
| **提交答案题** | `type=submit_answer`；不需要测试点的 `.in`，仅提供 `.out`；学生提交的是 output 而非代码 |
| **多组测试点** | 一般 OI 不需要，ACM 格式题可用「测试点 1 包含全部数据」的方式打包 |

### 6.7 上传后自动验证（v2 联动功能）

后端版本通过「洛谷开放平台 API」实现：
1. 上传 ZIP 到洛谷题目草稿
2. 自动触发一次「自测提交」（用内置标程）
3. 获取评测结果并返回给用户，确认上传成功且结果为全 AC
4. 若出现非 AC，直接跳转对应测试点 Diff

---

## 7. UI/UX 设计要点

### 7.1 整体布局（三栏式）

```
┌──────────────────────────────────────────────────────────────────────┐
│  [LOGO] LuoguTDK     [题目选择下拉 ▼]     [新建] [导入] [导出] [校验]  │
├───────────────┬────────────────────────────┬─────────────────────────┤
│               │                            │                         │
│  📁 题目列表   │   🧪 测试点 Studio          │   ⚙️ 属性 / 校验面板     │
│               │   (核心工作区)              │                         │
│  ───────────  │                            │   📋 题目信息            │
│  ✅ P1001 A+B  │  ┌── Subtask 1 (40) ───┐   │   标签 / 时空限制       │
│     (当前)     │  │ [拖拽测试点到此处]    │  │                         │
│  ⏳ P1002 过河 │  │  test1.in [✓ 已配out]│  │  ────────────────       │
│     卒         │  │  test2.in [✓ 已配out]│  │   📂 Subtask 配置       │
│  🆕 P1003 铺   │  └────────────────────┘   │   分数/依赖/模式         │
│     地毯       │  ┌── Subtask 2 (30) ───┐   │                         │
│  ...           │  │ ...                  │  │  ────────────────       │
│               │  └────────────────────┘   │   ✅ 校验结果             │
│  [+ 新建题目]  │                            │   15/15 通过             │
│               │  ═══════════════════════   │   [查看报告]             │
│               │  [📤 拖入 .in/.out 文件]    │                         │
│               │  [或点击选择文件]           │   🚀 快捷操作            │
│               │                            │   [标程重测]             │
│               │                            │   [导出洛谷ZIP]          │
└───────────────┴────────────────────────────┴─────────────────────────┘
```

### 7.2 核心页面与交互

| 页面 | 关键交互 |
|------|----------|
| **题目总览** | 左侧题目卡片列表，点击切换；支持搜索、标签过滤、难度颜色 |
| **题面编辑器** | 左右分栏：左 Monaco MD 编辑，右预览；LaTeX 公式实时渲染；样例可从测试点一键插入 |
| **测试点 Studio** | ① 顶部工具栏：上传、生成器、排序、重测；② Subtask 卡片墙（可拖拽添加/排序/调分数）；③ 卡片内测试点芯片（显示状态：✅已配对/⚠️缺out/❌过大） |
| **测试点详情** | 点击芯片打开抽屉：Monaco 双栏 Diff 视图（左 in 右 out），上方显示大小/行数/hash，下方操作按钮「用标程重算 out」「下载文件」 |
| **校验报告页** | 三列表格：严重程度（颜色编码）| 校验项 | 详情 | 修复建议 | 可点击修复按钮自动处理（如「自动补齐缺失的依赖字段」） |
| **重测报告页** | 进度条 + 完成的测试点列表，点击失败项展开 Monaco DiffViewer（期望 vs 实际 vs 输入），提供「应用当前输出为新答案」 |
| **导出中心** | 多格式选择器 + 高级选项折叠（是否含样例、是否含标程、是否生成清单、ZIP压缩级别），预览文件树后确认下载 |

### 7.3 状态可视化

测试点状态用**颜色编码**在所有列表中统一展示：

| 状态 | 颜色 | 含义 |
|------|------|------|
| ✅ 就绪 | 绿色 10% 背景 | in/out 均齐全，hash 已生成，所属 Subtask 正常 |
| ⚠️ 警告 | 黄色 | 有 out 但标程重测时超时 / 或数据过大 / 或与题面范围不符 |
| ❌ 错误 | 红色 | 缺 out / in 为空 / 命名非法 |
| 🔄 处理中 | 蓝色旋转图标 | 正在用标程计算 out / 正在做 hash |
| 🆕 新增 | 灰蓝 | 刚上传尚未处理 |

---

## 8. 关键实现细节

### 8.1 大文件高效处理方案

**挑战**：单个测试点可达 50MB~1GB，浏览器内存与性能是瓶颈。

**方案**：
1. **OPFS 流式读写**：使用 File System Access API 的 `FileSystemSyncAccessHandle`（Worker 内同步 IO），分块读写 64KB 缓冲，避免一次性加载到内存
2. **MD5/大小统计流式计算**：上传时使用 `spark-md5` 或 Web Crypto 的增量模式，边读文件 chunk 边算 hash，大文件不卡主线程
3. **虚拟列表**：测试点超过 500 个时用 `@tanstack/react-virtual` 只渲染可视区域
4. **预览截断**：内容预览仅请求 `slice(0, 500*1024)` 字节 + `末尾 50KB`，中间部分显示「文件过大，点击下载查看完整」
5. **WASM 压缩**：ZIP 导出使用 `fflate` 的 WASM 版本，在 Web Worker 中跑，比纯 JS 快 3~5 倍，且不阻塞 UI

### 8.2 标程编译运行方案（v2 重点）

**浏览器端方案（v1.5 试验性）**：
- 使用 [wapm.io](https://wapm.io/) 预编译的 `clang.wasm` 或 `gcc.wasm`
- 标程源码 → WASM 二进制（3~5s 冷启动编译）
- 用 [WASI](https://wasi.dev/) 运行时执行，stdin 喂入测试点输入字节流，截获 stdout
- 受限：C++ STL 兼容度 95%，部分复杂模板（`__int128`、`ext/pb_ds`）可能失败

**后端沙箱方案（v2 生产级，推荐）**：
- 用 IOI 官方 [isolate](https://github.com/ioi/isolate) 沙箱（同洛谷评测端一致）
- 每个编译/运行任务：`box_id` 分配 → `cgclass` 资源限制 → 执行 → 收集退出码/用时/内存 → 销毁
- 关键配置命令：
  ```bash
  # 编译 C++
  isolate --box-id=42 --cg --processes=16 --run -- /usr/bin/g++ -std=c++17 -O2 -o /tmp/prog /box/spj.cpp -lrt
  
  # 运行测试（time limit 1s，mem 256MB）
  isolate --box-id=42 --cg --mem=262144 --time=1.0 --wall-time=5.0 \
          --stdin=/tmp/test.in --stdout=/tmp/test.out --stderr=/tmp/test.err \
          --meta=/tmp/meta.txt --run -- /tmp/prog
  
  # 解析 meta.txt 得 time-used、max-rss、exitcode 等
  ```
- SPJ 单独编译并运行：`./spj <in> <user_out> <ans>`，解析返回码映射到 AC/WA/PE
- 用 Redis + BullMQ 排队，支持 32 并发 worker 横向扩容

### 8.3 Subtask 依赖合法性校验

```typescript
// 拓扑排序检测依赖图是否有环
function validateSubtaskDependencies(subtasks: Subtask[]): boolean {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  
  for (const s of subtasks) {
    inDegree.set(s.id, 0);
    adj.set(s.id, []);
  }
  for (const s of subtasks) {
    for (const depId of s.dependsOn) {
      if (!inDegree.has(depId)) return false; // 依赖不存在
      adj.get(depId)!.push(s.id);
      inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
    }
  }
  
  const queue: string[] = [];
  inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });
  let count = 0;
  while (queue.length) {
    const cur = queue.shift()!; count++;
    for (const next of adj.get(cur) || []) {
      const d = (inDegree.get(next) || 0) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next);
    }
  }
  return count === subtasks.length; // 无环则全部入队
}
```

### 8.4 导入 ZIP 智能识别算法

不同来源的 ZIP 目录结构差异大，需按优先级尝试多种解析策略：

```
策略优先级（从高到低）：
  1. 存在 problem.conf → 按洛谷原生结构解析
  2. 存在 config.yml → 按洛谷增强格式解析
  3. 存在 zad.json → 按 Maszyna 格式解析
  4. 顶层目录 = 题目标号，内有 problem.md 或 problem.pdf + data/ 子目录
     → 判定为 Polygon/通用 OJ 格式
  5. 扁平 .in/.out 文件 → 传统 HUSTOJ 格式，按文件名数字排序编号
  6. 全部放在 tests/ 目录且文件名是纯数字 → testlib 默认格式
  7. 无法识别 → 弹出「手动映射」向导：用户确认每个文件的角色
```

解析后必须触发一轮**完整校验**，提示用户导入后缺失的部分（如 Subtask 未配置时默认生成一个「Subtask 1 (100分) 包含所有测试点」）。

### 8.5 版本快照与 Diff

每次保存快照时：
1. 计算 Problem 配置的 JSON hash（稳定化处理：键排序）
2. 遍历测试点 in/out 两个 MD5
3. 拼接后整体 SHA256 = `overallHash`，作为版本唯一标识
4. 导出包可选存入对象存储

**两个版本的 Diff 视图**：
```
版本 v1 (草稿)  vs  版本 v2 (终稿)
─────────────────────────────────────────────────────────
📄 problem.conf
  + timelimit: 1.0 → 2.0          [修改]
  + subtask_count: 2 → 3          [修改]

🧪 subtask
  + Subtask 3 (30分, 依赖1&2)     [新增]
     └─ testcases: 8, 9, 10, 11

📦 testcases
  ➕ test_008.in (2.3MB)          [新增]
  ➕ test_008.out (8KB)           [新增]
  ✏️ test_003.out  MD5: a1f2... → 3dc4...  [内容变更]
  🗑️  test_005.in/out             [删除]
```

---

## 9. 开发路线图

### Phase 1：MVP（v0.1 ~ v0.3，预计 4~6 周）

> **目标**：跑通「导入 → 组织 → 校验 → 导出」完整闭环

| 版本 | 里程碑 | 交付内容 |
|------|--------|----------|
| v0.1 | 基础骨架 | 题目 CRUD + IndexedDB 持久化；测试点拖拽上传 + OPFS 存储；题面 Monaco 编辑器 |
| v0.2 | Subtask 可视化 | Subtask 卡片墙 + 拖拽分组 + 分数/依赖配置；数字编号映射；测试点属性面板 |
| v0.3 | 洛谷导出 MVP | `problem.conf` 正确生成；ZIP 打包；15 项校验引擎的格式/Subtask 部分；导入 ZIP 解析 |

### Phase 2：核心增强（v0.4 ~ v0.6，预计 4~6 周）

| 版本 | 里程碑 | 交付内容 |
|------|--------|----------|
| v0.4 | 校验引擎完整 | 全部 15+ 项校验；修复建议；一键修复脚本；校验报告可视化 |
| v0.5 | 数据生成器 + 样例 | C++/Python 生成器脚本保存与执行（调用后端或 WASM）；样例模块；测试点 ↔ 样例互转 |
| v0.6 | 版本快照 | 自动/手动快照；Diff 视图；回滚；快照导出存档 |

### Phase 3：云端协作（v1.0，预计 6~8 周）

| 版本 | 里程碑 | 交付内容 |
|------|--------|----------|
| v0.7 | 后端沙箱（核心） | isolate 沙箱搭建 + BullMQ 队列；标程编译运行；SPJ 编译执行；重测 Diff 报告 |
| v0.8 | 云端存储 | MinIO 接入；题目/测试点对象存储；多端数据同步（CRDT 或简单 last-write-wins） |
| v0.9 | 账户与协作 | 洛谷 OAuth 登录；题目分享链接；多人注释；变更历史审计 |
| v1.0 | 洛谷开放平台联动 | 一键上传题目草稿；自动评测验证；发布流程；生产级部署 + 性能压测 |

### Phase 4：生态与高级功能（v1.x ~ v2.0）

- 📱 PWA 离线支持（Service Worker 缓存全部资源）
- 🔌 插件系统：自定义校验规则、自定义导出格式
- 🧠 AI 辅助：根据题面自动生成测试点提示词 → 调用大模型写数据生成器 / 造边界 case
- 📊 数据分析：题目难度热力图、训练场次平均分
- 🔗 多平台适配：除洛谷外新增牛客 OJ、AcWing、UOJ、LOJ 导出模板
- 🧪 SPJ Wizard：引导式配置 testlib checker（按常见模式：浮点误差、自定义顺序、Special Score 等，无需手写 C++）

---

## 10. 非功能需求

### 10.1 性能

| 指标 | 目标值 |
|------|--------|
| 单题 100 个测试点加载时间 | < 1s |
| 单题 1000 个测试点列表流畅滚动（虚拟化） | 60fps |
| 1GB 总测试点数据 ZIP 导出（WASM） | < 30s，内存增量 < 200MB |
| 后端重测 100 测试点 * 1s 限 | 20 并发下 < 10s 完成（P95） |
| 校验引擎 15 项全量检查 | < 2s（单题 ≤ 100 测试点） |

### 10.2 兼容性

- 浏览器：Chrome / Edge 120+（OPFS 支持）、Safari 17.4+、Firefox 124+
- 移动端：iPad Safari 可用（不承诺手机小屏交互）
- 后端部署：Linux x86_64（isolate 依赖 cgroup v2）

### 10.3 安全

| 风险 | 对策 |
|------|------|
| 标程沙箱逃逸 | 使用 isolate 官方竞赛级沙箱 + cgroup 硬限制 + 非 root 用户 + 只读文件系统（除 /tmp） |
| 用户上传恶意文件 | 上传时在沙箱内解包；禁止可执行位；OPFS 隔离域名；大小限制（单文件 < 2GB，单题 < 10GB） |
| 数据越权访问（云端） | Postgres RLS（Row Level Security）：题目只对 owner + 协作者可见；S3 Pre-signed URL 5min 过期 |
| XSS | Monaco、Markdown 预览均启用严格白名单 sanitize；公式渲染避免 unsafe mode |
| ZIP Bomb | 解压时硬限制解压后总大小 < 原始大小 × 5 且 < 20GB |

### 10.4 数据本地化（v1 重点）

v1 全部数据**默认仅存在本机浏览器**（IndexedDB + OPFS）：
- 一键「导出全部数据备份」：生成包含所有题目的 JSON + OPFS 快照的大 ZIP（加密可选）
- 一键「从备份恢复」
- 无任何遥测、无自动上传，所有操作纯本地

---

## 11. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 洛谷格式不定期更新，导出不兼容 | 中 | 高 | 订阅洛谷官方文档变更；维护独立的「洛谷适配器」层，格式规则集中配置可热更新；内置自检：用近 3 个月导出数据包做回归测试 |
| isolate 沙箱维护复杂度高 | 中 | 高 | 前期基于洛谷/NOI 官方 Docker 镜像；准备降级方案：容器化 + seccomp 模式；v0.7 前不强制启用后端重测，浏览器 WASM 方案兜底 |
| 大文件 OPFS 浏览器兼容性坑 | 高 | 中 | 提供 Fallback：OPFS 不可用时降级为内存 + IndexedDB Blob；对 Safari 单独测试并提示用户推荐 Chrome |
| SPJ 配置用户仍然写错 | 高 | 中 | 提供 5 种 SPJ 预设模板（默认忽略空格/浮点 eps/自定义顺序/排名得分/图论格式）；SPJ Wizard 引导；内置 testlib 样例自测 |
| 标程 / 数据生成器运行超时或卡死 | 中 | 中 | Web Worker + terminate() 超时终止；后端 wall-time 硬 kill；UI 上有「取消重测」按钮 |

---

## 附录 A：洛谷配置速查表

> 产品内部 `adapters/luogu.ts` 应以此表为唯一真源，避免硬编码魔法字符串。

```typescript
// 常用字段映射常量
export const LUOGU_CONF_KEYS = {
  TITLE: 'title',
  TIME_LIMIT: 'timelimit',          // 单位: 秒, 小数
  MEMORY_LIMIT: 'memorylimit',      // 单位: MB
  STACK_LIMIT: 'stacklimit',        // 单位: MB
  SUBTASK_COUNT: 'subtask_count',
  ENABLE_O2: 'enable_o2',           // 0/1
  USING_SPJ: 'using_answer_checker', // on/off
  SPJ_CMD: 'answer_checker_cmd',
  BUILTIN_CHECKER: 'use_builtin_checker', // on
  INTERACTIVE: 'interactive',       // on
  FILEIO_IN: 'file_io_input_name',
  FILEIO_OUT: 'file_io_output_name',
  SAMPLE_COUNT: 'sample_count',
} as const;

// Subtask 块模板
export const LUOGU_SUBTASK_BLOCK = (
  idx: number, score: number, type: 'min'|'sum',
  caseNumbers: number[], dependsIndices: number[]
) => `
subtask${idx}_begin
score=${score}
type=${type}
case_num_begin
${caseNumbers.length}
${caseNumbers.join(' ')}
case_num_end
depend_begin
${dependsIndices.length}
${dependsIndices.join(' ')}
depend_end
subtask${idx}_end
`.trim() + '\n';
```

---

## 附录 B：验收标准（MVP 完成定义）

> 用于判断 v0.3 MVP 是否可交付：

- [ ] **样例题「A+B Problem」**：5 个测试点 + 2 Subtask，导出 ZIP 后上传到洛谷私有题库，能成功识别并自测 AC
- [ ] **样例题「石子合并（区间 DP）」**：10 个测试点 + 3 Subtask（40+30+30，依赖链 1→2→3），洛谷配置正确且分数匹配
- [ ] **样例题「文件 IO 题」**：指定 `apple.in/apple.out`，学生用 freopen 能 AC
- [ ] **样例题「SPJ 题（求任意一组方案）」**：testlib checker，`spj.cpp` 打包后洛谷正确返回 AC/WA
- [ ] **错误配置拦截**：Subtask 分数之和 90，校验引擎报错；用户修复后通过
- [ ] **测试点缺失 out**：校验引擎报错，定位具体文件；标程重测后自动补齐
- [ ] **ZIP 导入还原**：上述 4 道题导出后重新导入，所有配置、Subtask、测试点一一对应无丢失

---

> **文档结束**  
> 如有变更，通过修改版本号 + 在项目 Wiki 中记录 CHANGELOG 进行追溯。
