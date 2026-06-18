# 箩煌的主页

纯静态 HTML/CSS/JS 项目，部署在 GitHub Pages。包含游戏合集和实用工具。

**在线访问**: [https://xxxand.github.io](https://xxxand.github.io)

## 工具

| 工具          | 说明                       |
| ------------- | -------------------------- |
| 枪械 TTK 排行 | 三角洲行动武器击杀时间排行 |
| Unicode 互转  | 中文 ↔ \\uXXXX 编码        |
| UTF-8 互转    | 中文 ↔ UTF-8 十六进制      |
| Base64 编解码 | 文本 ↔ Base64              |

## 游戏

| 游戏   | 说明                                                                    |
| ------ | ----------------------------------------------------------------------- |
| 贪吃蛇 | 经典贪吃蛇，键盘/触屏控制，三档速度                                     |
| 2048   | 数字合并，键盘/触屏滑动，支持悔一步                                     |
| 五子棋 | 15×15 棋盘，双人对战 / 人机对战 (Alpha-Beta AI)，禁手规则可选，支持悔棋 |
| 扫雷   | 9×9 10 雷，点击揭开，长按/右键标旗                                      |

## 本地打开

直接双击 `index.html` 即可，无需安装任何工具。

## 目录结构

```
index.html           # 首页
snake.html           # 贪吃蛇
2048.html            # 2048
gomoku.html          # 五子棋
minesweeper.html     # 扫雷
dfttk.html           # 枪械 TTK 排行
unicode.html         # Unicode 互转
utf8.html            # UTF-8 互转
base64.html          # Base64 编解码
css/
  common.css         # 公共基础样式
  index.css          # 首页样式
  snake.css          # 贪吃蛇样式
  2048.css           # 2048 样式
  gomoku.css         # 五子棋样式
  minesweeper.css    # 扫雷样式
  dfttk.css          # TTK 排行样式
  unicode.css        # Unicode 互转样式
  utf8.css           # UTF-8 互转样式
  base64.css         # Base64 编解码样式
js/
  snake.js           # 贪吃蛇逻辑
  2048.js            # 2048 逻辑
  gomoku.js          # 五子棋逻辑
  minesweeper.js     # 扫雷逻辑
  dfttk.js           # TTK 排行逻辑
  unicode.js         # Unicode 互转逻辑
  utf8.js            # UTF-8 互转逻辑
  base64.js          # Base64 编解码逻辑
```

## 开发维护说明

- 本项目保持纯静态 HTML/CSS/JS。
- 新增页面必须遵守 HTML/CSS/JS 分离，不能写成单文件 HTML。
- 源码文件统一使用 UTF-8 编码。
- 修改后运行 `npx prettier --write .` 格式化。
- 默认只 commit，不 push。
