# Git 配置与使用指南 (VS Code / Trae 版)

本文档旨在帮助你从零开始配置 Git 版本控制环境，并教你如何在 VS Code (或 Trae) 编译器中高效地管理代码。

---

## 🛠️ 1. 环境准备与安装

首先，我们需要确认你的电脑上是否已经安装了 Git。

### 1.1 检查 Git 是否安装
打开终端 (Terminal)，输入以下命令：
```bash
git --version
```
如果显示 `git version 2.x.x`，说明已安装。如果提示 `command not found`，请按以下步骤安装。

### 1.2 安装 Git (macOS)
推荐使用 **Xcode Command Line Tools** 或 **Homebrew** 安装。

**方法 A: 使用 Xcode Command Line Tools (最简单)**
在终端输入：
```bash
xcode-select --install
```
按照弹出的提示点击“安装”即可。

**方法 B: 使用 Homebrew (推荐)**
如果你安装了 Homebrew，可以使用：
```bash
brew install git
```

---

## ⚙️ 2. 全局配置 (必须执行)

安装完成后，必须配置你的用户名和邮箱，这些信息会出现在每一次提交记录中。

### 2.1 配置用户信息
在终端依次执行：
```bash
# 替换为你的名字 (建议用英文)
git config --global user.name "Your Name"

# 替换为你的邮箱 (建议与 GitHub/GitLab 注册邮箱一致)
git config --global user.email "your.email@example.com"
```

### 2.2 配置换行符与忽略大小写 (macOS 推荐)
为了避免 Windows 和 macOS 协作时的换行符问题，以及 macOS 文件系统的大小写不敏感问题，建议执行：
```bash
# 提交时转换为 LF，检出时不转换 (macOS/Linux 推荐)
git config --global core.autocrlf input

# 强制 Git 区分文件名大小写 (避免文件名大小写修改后 Git 识别不到)
git config --global core.ignorecase false
```

### 2.3 验证配置
```bash
git config --list
```
检查输出中是否包含你刚才设置的信息。

---

## 🚀 3. 项目初始化与 .gitignore

### 3.1 初始化仓库
在你的项目根目录 (`/Users/lvxiaoxu/Documents/工作/hbj/FSJcz`) 打开终端，执行：
```bash
git init
```
这会在项目下生成一个隐藏的 `.git` 文件夹，标志着该项目已受 Git 管理。

### 3.2 配置 .gitignore (忽略文件)
**非常重要**：在提交代码前，必须配置 `.gitignore` 文件，告诉 Git 哪些文件不需要上传（如 `node_modules`、系统缓存、IDE 配置等）。

**推荐的 .gitignore 内容 (Vue + TS 项目):**
```gitignore
# Logs
logs
*.log
npm-debug.log*

# Dependency directories
node_modules/

# Build outputs
dist/

# System files
.DS_Store

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea/
.trae/

# Local env files
.env.local
.env.*.local
```
*注：本项目已为你更新了 .gitignore 文件，无需手动创建。*

---

## 🔐 4. 连接远程仓库 (GitHub/GitLab)

为了将代码备份到云端，你需要配置 SSH 密钥并添加远程仓库地址。

### 4.1 生成 SSH 密钥
1.  检查是否已有密钥：
    ```bash
    ls -al ~/.ssh
    ```
    如果有 `id_rsa.pub` 或 `id_ed25519.pub`，可跳过生成步骤。

2.  生成新密钥 (如果没有):
    ```bash
    ssh-keygen -t ed25519 -C "your.email@example.com"
    ```
    一路按回车即可。

3.  获取公钥内容：
    ```bash
    cat ~/.ssh/id_ed25519.pub
    # 或者
    cat ~/.ssh/id_rsa.pub
    ```
    复制输出的内容（以 `ssh-` 开头）。

4.  添加到 GitHub/GitLab:
    *   **GitHub**: Settings -> SSH and GPG keys -> New SSH key -> 粘贴。
    *   **GitLab**: User Settings -> SSH Keys -> 粘贴。

### 4.2 添加远程仓库
在 GitHub/GitLab 上创建一个空仓库，复制其 SSH 地址 (如 `git@github.com:username/repo.git`)。

在项目终端执行：
```bash
git remote add origin <你的仓库地址>
```

验证连接：
```bash
git remote -v
```

---

## 💻 5. 在 VS Code / Trae 中使用 Git

你完全可以通过图形化界面完成 99% 的 Git 操作，无需记忆复杂命令。

### 5.1 认识源代码管理面板 (Source Control)
点击左侧侧边栏的 **源代码管理 (Source Control)** 图标（通常是一个类似树杈的图标，快捷键 `Ctrl+Shift+G`）。

### 5.2 提交代码 (Commit)
1.  **暂存 (Stage)**:
    *   修改文件后，文件会出现在 "更改 (Changes)" 列表中。
    *   点击文件名旁边的 `+` 号，将其移动到 "暂存的更改 (Staged Changes)"。这相当于 `git add`。
2.  **提交 (Commit)**:
    *   在上方的输入框中填写提交信息 (Message)，例如 "feat: 初始化项目结构"。
    *   点击 "提交 (Commit)" 按钮（或 `Ctrl+Enter`）。这相当于 `git commit`。

### 5.3 推送代码 (Push)
点击面板上的 "同步更改 (Sync Changes)" 按钮，或者点击右上角的 `...` -> "推送 (Push)"。
*   如果是第一次推送，可能需要选择 "发布分支 (Publish Branch)"。

---

## ✅ 6. 测试与验证流程

请按以下步骤验证你的 Git 配置是否成功：

1.  **修改文件**: 随便修改一个文件（例如在 README.md 加一行字），保存。
2.  **观察变化**: 打开源代码管理面板，你应该能看到 README.md 出现在 "更改" 列表中。
3.  **暂存**: 点击 `+` 号。
4.  **提交**: 输入 "docs: update readme for git test"，点击提交。
5.  **推送**: 点击 "同步更改"。
6.  **验证**: 打开 GitHub/GitLab 网页，刷新仓库页面，确认你的修改已同步。

---

## 💡 常用提交规范 (Commit Message Convention)

建议使用以下前缀来规范提交信息：

*   `feat`: 新功能 (feature)
*   `fix`: 修复 bug
*   `docs`: 文档变更
*   `style`: 代码格式调整 (不影响逻辑)
*   `refactor`: 重构 (既不修复 bug 也不加功能)
*   `perf`: 性能优化
*   `test`: 增加测试
*   `chore`: 构建过程或辅助工具的变动

祝你编码愉快！
