# Lynn · 好奇心手记

Lynn 的个人学习网站，保留 GitHub Pages + Jekyll 静态发布方式。

## 发布学习文档

1. 在 GitHub 仓库打开 `notes/`，通过 **Add file → Upload files** 上传 `.md` 文件，也可以直接提交文件。
2. 子文件夹就是主题分类，例如 `notes/前端实验/浏览器的渲染旅程.md`。
3. 提交到 Pages 的发布分支，等待 GitHub Pages 部署完成。目录会自动更新，无需修改页面或手动维护索引。

文件名用作卡片标题；普通 Markdown 正文会自动生成摘要、阅读时间、搜索索引和文章目录。支持中文文件名、相对图片和 Markdown 文档间链接。

请勿在文件开头加入 Jekyll 的 `---` front matter，否则文件会被作为页面处理而不会进入原始 Markdown 索引。文件/文件夹不要以下划线或点开头（Jekyll 默认忽略），扩展名使用小写 `.md`。删除或移动文档后，原分享链接可能失效。

这是公开静态网站，上传到仓库的内容会公开；页面上的阅读器不向仓库写文件。

## 交互与视觉

- WebGL 三维笔记本，分段光照形成三渲二风格；支持鼠标、拖动和“转动看看”按钮。不支持 WebGL 时显示 CSS 笔记本。
- 纸张颗粒、轮廓和硬边投影；卡片展开为阅读页，关闭时恢复原卡片焦点。
- 全文搜索、分类筛选、文章目录、阅读进度、复制代码及分享链接。
- `Esc` 合上手记；`/` 聚焦搜索；浏览器后退可返回书架。
- 动效开关会保存在当前浏览器；尊重系统“减少动态效果”设置。动画仅在需要重绘时运行，页面不可见时停止。
- 手机使用横向单列文档卡片和折叠文章目录。

`notes/` 中附带的四篇文档均标注为示例，可直接修改或删除，不代表 Lynn 的真实学习记录。

## 本地预览

需要 Ruby 3.3、Bundler。首次安装依赖后启动 Jekyll：

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 8765
```

打开 `http://127.0.0.1:8765/`。不要直接双击 HTML；`notes-index.json` 需要 Jekyll 执行 Liquid 模板。JavaScript、CSS、Markdown 渲染库和图片都随站点部署，阅读器无需从外部 CDN 下载组件。

## 检查

```sh
bundle exec jekyll build
node --check assets/app.js
node --check assets/scene.js
node scripts/check-build.mjs
```

`check-build.mjs` 验证生成的索引、文档与本地资源、名称替换和相对文档/图片链接。GitHub PR 会自动执行这些检查。浏览器测试记录见 `TESTING.md`。

## 文件分工

- `index.html`：页面结构与阅读器
- `assets/style.css`：响应式布局、纸张材质和交互动效
- `assets/scene.js`：原生 WebGL 笔记本模型与渲染
- `assets/app.js`：检索、Markdown 阅读、导航和可访问性
- `notes-index.json`：构建时扫描文档的 Liquid 模板
- `notes/`：自己的学习文档及附件

## 第三方依赖

- Marked 15.0.12，MIT，许可证：`assets/vendor/marked.LICENSE.md`
- DOMPurify 3.4.17，Apache-2.0 / MPL-2.0，许可证：`assets/vendor/DOMPurify.LICENSE`

品牌文字均为 Lynn；仓库和 GitHub 用户链接保留实际账号 URL。

## 纸材与标题交互

首页标题上的圆形反色光标参考 [DeepSeek 官网](https://www.deepseek.com/)，支持精确指针，遵循动效开关和系统减少动态效果设置。

纸材来自 ambientCG 的 [Paper001](https://ambientcg.com/view?id=Paper001) 和 [Paper006](https://ambientcg.com/view?id=Paper006)，按 [CC0](https://docs.ambientcg.com/license/) 使用。`assets/materials/` 内的三张平铺 WebP 将原材质的颜色、侧光法线和粗糙度烘焙为不同明度的纸面。三维封面另外采样 `cover-relief.webp` 的法线 XY 和粗糙度，以随笔记本姿态调整纤维的受光。

## 纸上小世界开场

`assets/entrance.css` 和 `assets/entrance.js` 管理独立的纸艺入口，原创 SVG 插画位于 `index.html` 的 `#entrance` 内。小兔、书本、纸飞机、纸云和植物使用矢量图，纸面复用现有 CC0 材质，无新增字体、动画库、视频或远程资源请求。

以原神「彩鹞栉春风」活动页的纸绘层次为视觉参考，Lynn 的插画和双页展开动作独立制作；未使用活动页的美术、模型、音频或脚本。参考页在本次环境中停留于加载场景，完整原版入场未能直接验证。

首次访问无锚点的首页显示开场，点击「翻开小世界」后两侧纸页约 1.4 秒展开；「跳过开场」或 Esc 立即进入。`sessionStorage` 在当前标签页会话中记住已进入状态，刷新不重复播放。文章与书架等锚点链接直接打开目标内容；页脚可「再看一次开场」。系统减少动态效果或站内动效关闭时保持静态插画并立即进入。

使用原生模态 dialog 隔离键盘焦点，关闭后恢复焦点与滚动。JavaScript 未加载时开场默认隐藏。没有额外材质包需要安装。

## 立体手账漫游

`assets/journey.css` / `assets/journey.js` 将书桌、好奇心目录与文档书架连接起来。桌面宽度至少 900px、高度至少 620px 且动效开启时，书桌与目录使用 sticky 场景：笔记本靠近、纸页从镜头前掠过、分类书签错落展开。精确指针的一次滚轮手势切换一幕，触控板惯性不会连续跳过章节；右侧导航与「直接看手记」也可直达。进入文档区后自然滚动，从下方返回时先停在目录。

目录读取与书架相同的 Markdown 索引和分类，同时展示文章标题及数量。点击书签清空搜索并筛选该分类；「浏览全部手记」清除筛选。分类较多时桌面目录内部可滚动，手机目录随正文自然排布。无需手动维护分类或新增依赖。

手机、短屏和关闭动效的环境保持普通文档布局；手机保留轻量纸页入场。滚动位置驱动场景，键盘导航、锚点、文章深链接仍可使用。切换动效、打开阅读器、触摸操作或页面隐藏时会终止正在执行的自动滚动。`#directory` 可直接访问目录。

本次参考「蔷薇与铳枪」活动页的分层物件、章节切换与先后退场节奏，复用 Lynn 自己的 SVG、WebGL 笔记本及 CC0 材质；没有引入游戏站点资源。小兔开场另外增加纸页接缝、翻页阴影、左右错时展开与起身动作。
