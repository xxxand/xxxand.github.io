# AGENTS.md

本文件是给 opencode / AI coding agent 使用的项目规范。
在修改本仓库前，请先阅读并遵守本文件。

## 项目定位

这是一个部署在 GitHub Pages 上的纯静态网页项目。

当前项目技术栈：

- HTML
- CSS
- JavaScript
- GitHub Pages

不要把项目升级成复杂前端工程，除非用户明确要求。

## 总原则

1. 保持项目简单。
2. 保持纯静态部署。
3. 保持现有页面路径稳定。
4. 优先修复问题和提升可维护性。
5. 不要在没有明确要求的情况下新增功能。
6. 不要在没有明确要求的情况下大改 UI。
7. 不要在没有明确要求的情况下引入框架、构建工具或依赖。

## 禁止事项

除非用户明确要求，否则不要做以下事情：

- 不要引入 Vue。
- 不要引入 React。
- 不要引入 Vite。
- 不要引入 Webpack。
- 不要引入 Tailwind。
- 不要引入 Sass / Less。
- 不要添加复杂构建流程。
- 不要添加登录、后端、数据库。
- 不要破坏 GitHub Pages 直接访问。
- 不要移动已有页面导致旧链接失效。
- 不要把新页面写成单文件 HTML。
- 不要把 CSS 和 JS 写回 HTML 文件里。
- 不要 push 到远程仓库，除非用户明确要求。

## Git 规则

完成修改后：

1. 可以执行 `git status` 查看变更。
2. 可以执行必要测试和格式化。
3. 必须创建本地 commit。
4. 不要执行 `git push`，除非用户明确要求。

推荐提交格式：

```bash
git add .
git commit -m "type: concise description"
```

示例：

```bash
git commit -m "fix: restore gomoku text encoding"
git commit -m "refactor: split random tool assets"
git commit -m "style: format static assets"
git commit -m "docs: update project maintenance notes"
```

## 格式化规则

每次修改完成后，都必须运行 Prettier 格式化相关文件。

如果项目已有 Prettier 配置，使用现有配置。

优先尝试：

```bash
npx prettier --write .
```

如果只修改了部分文件，也可以格式化指定文件，例如：

```bash
npx prettier --write index.html css/*.css js/*.js README.md AGENTS.md
```

如果当前环境没有 Prettier，请先说明原因，不要静默跳过格式化。

格式化后再检查：

```bash
git diff
git status
```

确认没有异常格式化或无关大改。

## 文件分离规则

本项目必须保持 HTML / CSS / JavaScript 分离。

### HTML

HTML 只负责页面结构和资源引用。

允许：

```html
<link rel="stylesheet" href="css/common.css" />
<link rel="stylesheet" href="css/page.css" />
<script src="js/page.js" defer></script>
```

不允许：

```html
<style>
  /* 页面样式 */
</style>
```

不允许：

```html
<script>
  // 页面业务逻辑
</script>
```

例外情况：

- 极短的第三方统计代码只有在用户明确要求时才允许。
- 本项目当前不需要此类例外。

### CSS

CSS 必须放在 `css/` 目录。

通用样式放在：

```text
css/common.css
```

页面专属样式放在：

```text
css/页面名.css
```

示例：

```text
css/index.css
css/snake.css
css/2048.css
css/gomoku.css
css/minesweeper.css
css/random.css
css/timer.css
```

### JavaScript

JavaScript 必须放在 `js/` 目录。

页面专属逻辑放在：

```text
js/页面名.js
```

示例：

```text
js/snake.js
js/2048.js
js/gomoku.js
js/minesweeper.js
js/random.js
js/timer.js
```

如果多个页面确实需要复用工具函数，可以创建：

```text
js/common.js
```

但不要为了抽象而过度拆分。

## 新增页面规则

新增页面时，必须同时考虑 HTML、CSS、JS 三部分。

如果页面在根目录，例如：

```text
random.html
```

则对应：

```text
css/random.css
js/random.js
```

HTML 中引用：

```html
<link rel="stylesheet" href="css/common.css" />
<link rel="stylesheet" href="css/random.css" />
<script src="js/random.js" defer></script>
```

如果页面在子目录，例如：

```text
tools/random.html
```

则对应：

```text
css/random.css
js/random.js
```

HTML 中引用：

```html
<link rel="stylesheet" href="../css/common.css" />
<link rel="stylesheet" href="../css/random.css" />
<script src="../js/random.js" defer></script>
```

## 修改已有页面规则

修改已有页面时：

1. 不要改变页面路径。
2. 不要删除已有功能。
3. 不要改变用户已有交互习惯。
4. 不要把已拆分出去的 CSS/JS 写回 HTML。
5. 优先在对应 CSS/JS 文件中修改。
6. 如果发现 HTML 中有大段 `<style>` 或 `<script>`，应迁移到对应 CSS/JS 文件。

迁移时保持行为不变：

- `<style>` 内容迁移到 `css/页面名.css`
- `<script>` 内容迁移到 `js/页面名.js`
- HTML 只保留 `<link>` 和 `<script src="..." defer>`

## 编码规则

所有源码文件必须使用 UTF-8 编码。

特别注意中文文案：

- 不要出现乱码字符。
- 不要出现 `�`。
- 不要出现类似 `暺`、`賣`、`蝳`、`撟`、`鈭` 这类疑似编码错误字符。

修改涉及中文文案时，必须在浏览器中检查显示是否正常。

## JavaScript 规则

1. 优先使用清晰的函数名。
2. 把魔法数字提取为常量。
3. 减少散落的全局变量。
4. 可以用简单的 `gameState` 对象集中管理状态。
5. 不要为了抽象而过度封装。
6. 不要引入 TypeScript，除非用户明确要求。
7. 不要引入外部依赖，除非用户明确要求。

不推荐用按钮文字反推状态。

错误示例：

```js
if (button.textContent === "执黑") {
  humanPlayer = 1;
}
```

推荐使用状态变量：

```js
let humanPlayer = 1;
let aiEnabled = false;
let forbiddenEnabled = false;
```

按钮文字只负责显示，不参与核心逻辑判断。

## CSS 规则

1. 通用样式放到 `css/common.css`。
2. 页面专属样式放到页面对应 CSS 文件。
3. 不要重复写大量 reset 样式。
4. 不要引入 Tailwind / Sass / Less。
5. 不要随意大改视觉风格。
6. 保持移动端适配。
7. 避免 CSS 压成一行，保持可读格式。

## README 规则

如果修改项目结构、增加页面、改变使用方式，需要同步更新 `README.md`。

README 至少应包含：

- 项目简介
- 在线访问地址
- 页面/功能列表
- 目录结构
- 本地打开方式
- 开发维护说明

开发维护说明中应提醒：

- 本项目保持纯静态 HTML/CSS/JS。
- 新增页面必须遵守 HTML/CSS/JS 分离。
- 源码文件统一使用 UTF-8。
- 修改后运行 Prettier。
- 默认只 commit，不 push。

## 五子棋 AI 特别规则

如果修改五子棋相关代码，注意：

当前 AI 参数应保持：

```js
const AI_SEARCH_DEPTH = 5;
const AI_TOP_CANDIDATES = 8;
const AI_BRANCH_LIMIT = 8;
```

不要随意改回深度 3。
不要随意把候选分支扩大到 12 或 20。
不要新增难度按钮，除非用户明确要求。
不要重写整个 AI，除非用户明确要求。

必须保留：

- AI 一步获胜优先
- 玩家一步获胜时 AI 必须堵
- 禁手判断
- 悔棋逻辑
- 重新开始逻辑
- 人机切换
- 玩家执黑/执白逻辑
- alpha-beta 剪枝逻辑

## 自测规则

修改完成后，至少检查：

### 通用检查

- 页面能正常打开。
- 浏览器控制台没有明显报错。
- 没有 CSS/JS 资源 404。
- GitHub Pages 路径不被破坏。
- 移动端布局不明显溢出。
- 中文显示正常，无乱码。

### 首页

- 首页能正常打开。
- 所有卡片链接能正常跳转。
- 桌面端和手机端布局正常。

### 游戏页面

如果修改了游戏页面，必须检查对应游戏核心功能。

贪吃蛇：

- 键盘控制正常。
- WASD 控制正常。
- 触屏操作正常。
- 速度切换正常。
- 游戏结束弹窗正常。

2048：

- 方向键正常。
- WASD 正常。
- 悔一步正常。
- 新游戏正常。
- 分数和最高分正常。

五子棋：

- 双人对战正常。
- 人机对战正常。
- 执黑/执白切换正常。
- 禁手开关正常。
- 悔棋正常。
- AI 落子速度正常。
- AI 能堵玩家一步成五。
- AI 能走自己一步成五。
- 胜负和平局弹窗正常。
- 中文显示正常，无乱码。

扫雷：

- 点击揭开正常。
- 右键标旗正常。
- 长按标旗正常。
- 新游戏正常。
- 胜负弹窗正常。

## 工作流程

每次任务按以下流程执行：

1. 阅读 `AGENTS.md`。
2. 理解用户当前要求。
3. 检查相关文件。
4. 做最小必要修改。
5. 运行 Prettier。
6. 自测或至少做静态检查。
7. 查看 `git diff`。
8. 创建本地 commit。
9. 不要 push，除非用户明确要求。

## 回答用户时说明

完成任务后，简要说明：

- 改了哪些文件。
- 做了什么修改。
- 是否运行了 Prettier。
- 是否完成本地 commit。
- commit message 是什么。
- 是否没有 push。

不要夸大测试结果。
如果某些测试没有实际运行，要如实说明。
