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
