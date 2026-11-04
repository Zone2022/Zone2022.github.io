# Zone2022 学习档案

基于 GitHub Pages 和 Jekyll 的静态个人网站。

## 添加文档

1. 将 `.md` 文件上传到仓库的 `notes/` 文件夹；可使用子文件夹作为分类，例如 `notes/前端/浏览器.md`。
2. 提交到 GitHub Pages 发布分支。部署完成后，目录会自动更新，无需手动维护清单。
3. 文件名即目录标题；文档内容使用普通 Markdown。请不要在文件开头添加 Jekyll 的 `---` front matter，否则它不再被当作原始静态文件收录。文件和文件夹名不要以下划线或点开头（Jekyll 默认忽略）。图片可放在 `notes/` 内并使用相对路径。

搜索支持文件名和分类。阅读器支持常见 Markdown、代码块和文章目录。网站加载 Markdown 渲染和清理库时需要连接 jsDelivr；字体来自 Google Fonts，无法访问时会回退到系统字体。此公开仓库中的文档也会公开，请勿上传私密信息。

本地完整预览需要 Jekyll：执行 `bundle exec jekyll serve`（或安装 Jekyll 后执行 `jekyll serve`）；直接打开 HTML 或使用普通静态服务器不会处理 `notes-index.json` 中的 Liquid 模板。

