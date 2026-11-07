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

## 书桌、手记与尾页

`assets/journey.css` / `assets/journey.js` 管理三个章节，原来的独立目录已删除。所有视口都使用同一套场景切换；响应式规则只改变排版，短手机视口中标题与三渲二笔记本并排。旧 `#directory` 链接兼容跳到手记。

书桌向下滚动或上滑，触发完整的约 2.34 秒动画：真实 WebGL 笔记本抬起离场、双页分别展开、书签摆动、手记卡片错峰升起并归位。手记底部再次下滑时，卡片收拢、纸页合起，小兔便笺落下，进入尾页。顶部反向滚动可返回上一幕，底部章节按钮也能切换。

播放进度由时间驱动，与滚轮距离无关。播放时锁住页面滚动和背景控件；继续输入只被消耗，不会跳过动画或排队触发下一幕。结束后等当前手势安静至少 180ms 再接收新的滚动。手记内容保持自然滚动；一次大幅滚动到达边界后先停在该页，下一次手势才切换章节。阅读器自己的滚动不参与场景导航，合上手记会恢复原位置。

全局关闭动效或系统减少动态效果时仍有约 340ms 的轻淡入淡出，不播放旋转与大幅位移。深链接直接到达文章或章节；JavaScript 不可用时三个章节按普通文档排列。页面隐藏、异常或离开页面时会释放滚动锁，WebGL 画布始终复用原节点，不截图替换、不重建上下文。

本轮实际观察了「蔷薇与铳枪」第四幕票券离场、第五幕卡片错峰进入和插画单独落位的节奏。Lynn 的书页、纸材、原有小兔和笔记本独立组合，未使用游戏站点美术或脚本，无新增动画库或材质下载。纸艺开场的展开、重播与 Esc 操作保留。
