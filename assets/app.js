(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    list = $("notes"),
    search = $("search"),
    category = $("category"),
    reader = $("reader"),
    content = $("content"),
    scroller = $("reader-scroll");
  let notes = [],
    active = null,
    trigger = null,
    request = 0,
    pushed = false,
    closing = false,
    readingScroll = 0,
    toastTimer,
    observer;
  const cache = new Map(),
    esc = (value) =>
      String(value).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const reduced = () =>
    document.documentElement.dataset.motion === "off" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  function updateMotion(enabled) {
    enabled = enabled && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    $("rotate-scene").disabled = !enabled;
    document.documentElement.dataset.motion = enabled ? "on" : "off";
    $("motion-toggle").setAttribute("aria-pressed", String(enabled));
    $("motion-toggle").innerHTML =
      `动效 <span>${enabled ? "ON" : "OFF"}</span>`;
    document.dispatchEvent(new Event("motionchange"));
  }
  let savedMotion;
  try {
    savedMotion = localStorage.getItem("lynn-motion");
  } catch {}
  updateMotion(
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      savedMotion !== "off",
  );
  $("motion-toggle").addEventListener("click", () => {
    const on = document.documentElement.dataset.motion === "off";
    updateMotion(on);
    try {
      localStorage.setItem("lynn-motion", on ? "on" : "off");
    } catch {}
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    (e) => {
      if (e.matches) updateMotion(false);
    },
  );
  function toast(message) {
    const target = reader.open ? $("reader-toast") : $("toast");
    target.textContent = message;
    target.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove("visible"), 2500);
  }
  const illustrations = [
    '<path d="m40 32 74-10 15 79-74 10z" fill="#f9f5e8"/><path d="m40 32-8 7 15 79 8-7M47 65l19-3m-17 13 44-6m-42 17 53-8"/><path d="m77 35 34-5 5 28-34 5z" fill="#edc84e"/><path d="m105 88 13-2 14 22-12 2z" fill="#2e43ae"/>',
    '<path d="m25 44 83-16 27 24-82 17z" fill="#f9f5e8"/><path d="m25 44 28 25v49L25 92z" fill="#afb8cf"/><path d="m53 69 82-17v49l-82 17z" fill="#2e43ae"/><path d="m66 87 56-12m-56 23 36-8" stroke="#f9f5e8"/><path d="m46 40 29 26m-6-31 29 26"/>',
    '<path d="m27 40 96-7 7 66-97 7z" fill="#f9f5e8"/><path d="m27 40 6 66 8 5 97-7-8-5" fill="#2e43ae"/><path d="m37 57 79-6"/><path d="m49 69-8 9 9 7m49-20 10 7-9 9m-26-17-8 24" stroke="#2e43ae"/><circle cx="38" cy="47" r="2" fill="#edc84e"/>',
    '<path d="m42 30 76 12-13 76-76-12z" fill="#f9f5e8"/><path d="m42 30-7 5-13 76 83 14v-7" fill="#2e43ae"/><circle cx="74" cy="68" r="20" fill="#edc84e"/><path d="m57 92 32 5m-26-23 10 10 23-24"/>',
  ];
  function icon(i) {
    return `<svg viewBox="0 0 160 140" fill="none" stroke="#252823" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${illustrations[i % illustrations.length]}</svg>`;
  }
  function render() {
    const q = search.value.trim().toLocaleLowerCase(),
      selected = category.value;
    const visible = notes.filter(
      (n) =>
        (!selected || n.category === selected) &&
        `${n.title} ${n.category} ${n.text || ""}`
          .toLocaleLowerCase()
          .includes(q),
    );
    $("count").textContent = `${visible.length} / ${notes.length} 篇手记`;
    $("archive-total").textContent = `${notes.length} 篇记录 · 持续生长中`;
    list.innerHTML = visible.length
      ? visible
          .map(
            (n, i) =>
              `<button class="note" type="button" data-path="${esc(n.path)}" style="--i:${Math.min(i, 5)}"><span class="note-cover">${n.sample ? '<span class="sample-label">示例手记</span>' : ""}${icon(n.index)}</span><span class="note-body"><span class="note-category">${esc(n.category)}</span><span class="note-title">${esc(n.title)}</span><span class="note-excerpt">${esc(n.excerpt || "打开这篇手记，继续探索。")}</span><span class="note-bottom"><span>${n.minutes ? `约 ${n.minutes} 分钟阅读` : "Markdown 手记"}</span><span class="note-arrow" aria-hidden="true">↗</span></span></span></button>`,
          )
          .join("")
      : '<div class="state">没有找到这篇手记。<br><button id="reset-search" type="button">清除搜索与分类</button></div>';
  }
  async function fetchNote(note, retry = false) {
    if (retry) cache.delete(note.path);
    if (!cache.has(note.path)) {
      const promise = fetch(note.url, { signal: AbortSignal.timeout(15000) })
        .then((r) => {
          if (!r.ok) throw Error(`读取失败（${r.status}）`);
          return r.text();
        })
        .catch((e) => {
          cache.delete(note.path);
          throw e;
        });
      cache.set(note.path, promise);
    }
    return cache.get(note.path);
  }
  function meta(note, md) {
    note.text = md;
    note.sample = /示例文档|示例手记/.test(md);
    note.minutes = Math.max(1, Math.ceil(md.replace(/\s/g, "").length / 450));
    note.excerpt = md
      .split("\n")
      .filter((s) => s.trim() && !/^(#|>|```|\||-|\d+\.)/.test(s.trim()))
      .join(" ")
      .replace(/[`*_\[\]]/g, "")
      .slice(0, 100);
  }
  function syncProgress() {
    const max = scroller.scrollHeight - scroller.clientHeight,
      ratio = max > 0 ? scroller.scrollTop / max : 0;
    document.querySelector(".reader-progress span").style.transform =
      `scaleX(${ratio})`;
    document
      .querySelector(".reader-progress")
      .setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  }
  async function show(note, source = null) {
    if (closing) return;
    const id = ++request;
    active = note;
    trigger = source || trigger;
    observer?.disconnect();
    $("reader-title").textContent = note.title;
    $("reader-category").textContent = note.category;
    $("reading-time").textContent = "正在取出这篇手记…";
    $("raw-note").href = note.url;
    $("toc").replaceChildren();
    $("toc-details").open = innerWidth > 760;
    content.textContent = "正在翻开这一页…";
    document.title = `${note.title} — Lynn`;
    const alreadyOpen = reader.open;
    if (!alreadyOpen) {
      readingScroll = scrollY;
      const from = source?.getBoundingClientRect();
      reader.showModal();
      document.body.classList.add("reading");
      $("close-reader").focus({ preventScroll: true });
      if (!reduced()) {
        const to = reader.getBoundingClientRect();
        reader.animate(
          [
            {
              opacity: 0,
              transform: from
                ? `translate(${from.x + from.width / 2 - to.x - to.width / 2}px,${from.y + from.height / 2 - to.y - to.height / 2}px) scale(.25) rotate(-5deg)`
                : "translateY(45px) scale(.94) rotate(-2deg)",
            },
            { opacity: 1, transform: "none" },
          ],
          { duration: 460, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      }
    }
    scroller.scrollTop = 0;
    syncProgress();
    try {
      const md = await fetchNote(note);
      if (id !== request || !reader.open) return;
      meta(note, md);
      $("reading-time").textContent = `约 ${note.minutes} 分钟阅读`;
      if (!window.marked || !window.DOMPurify) throw Error("阅读组件未能加载");
      content.innerHTML = DOMPurify.sanitize(marked.parse(md), {
        FORBID_TAGS: ["style", "form", "iframe"],
        FORBID_ATTR: ["style"],
      });
      const ids = new Set();
      content.querySelectorAll("h1,h2,h3").forEach((h, i) => {
        let slug =
          h.textContent
            .trim()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .replace(/\s+/g, "-") || `section-${i}`;
        while (ids.has(slug)) slug += "-";
        ids.add(slug);
        h.id = slug;
        if (h.tagName === "H1") return;
        const a = document.createElement("a");
        a.href = `#${encodeURIComponent(slug)}`;
        a.textContent = h.textContent;
        if (h.tagName === "H3") a.className = "subheading";
        a.addEventListener("click", (e) => {
          e.preventDefault();
          h.scrollIntoView({
            behavior: reduced() ? "instant" : "smooth",
            block: "start",
          });
        });
        $("toc").append(a);
      });
      content.querySelectorAll("a[href],img[src]").forEach((el) => {
        const attr = el.tagName === "A" ? "href" : "src",
          value = el.getAttribute(attr);
        if (!value) return;
        if (value.startsWith("#") && attr === "href") {
          el.addEventListener("click", (e) => {
            let target;
            try {
              target = document.getElementById(
                decodeURIComponent(value.slice(1)),
              );
            } catch {}
            if (target && content.contains(target)) {
              e.preventDefault();
              target.scrollIntoView({
                behavior: reduced() ? "instant" : "smooth",
              });
            }
          });
          return;
        }
        try {
          const url = new URL(value, note.url);
          if (!["https:", "http:", "mailto:"].includes(url.protocol)) {
            el.removeAttribute(attr);
            return;
          }
          el.setAttribute(attr, url.href);
          if (attr === "href") {
            const linked = notes.find(
              (n) =>
                new URL(n.url).pathname === url.pathname &&
                url.origin === location.origin,
            );
            if (linked)
              el.addEventListener("click", (e) => {
                e.preventDefault();
                navigate(linked);
              });
            else {
              el.target = "_blank";
              el.rel = "noopener noreferrer";
            }
          } else el.loading = "lazy";
        } catch {
          el.removeAttribute(attr);
        }
      });
      content.querySelectorAll("pre").forEach((pre) => {
        const button = document.createElement("button");
        button.className = "copy-code";
        button.type = "button";
        button.textContent = "复制代码";
        button.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(
              pre.querySelector("code")?.textContent || "",
            );
            button.textContent = "已复制";
            setTimeout(() => (button.textContent = "复制代码"), 1600);
          } catch {
            toast("无法访问剪贴板，请选中代码手动复制。");
          }
        });
        pre.append(button);
      });
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.find((x) => x.isIntersecting);
          if (!entry) return;
          Array.from($("toc").children).forEach((a) =>
            a.classList.toggle(
              "active",
              a.hash === `#${encodeURIComponent(entry.target.id)}`,
            ),
          );
        },
        { root: scroller, rootMargin: "0px 0px -65% 0px", threshold: 0 },
      );
      content.querySelectorAll("h2,h3").forEach((h) => observer.observe(h));
      requestAnimationFrame(syncProgress);
    } catch (error) {
      if (id !== request || !reader.open) return;
      $("reading-time").textContent = "暂时无法打开";
      content.replaceChildren();
      const p = document.createElement("p");
      p.textContent = `${error.message}，请重试。`;
      const b = document.createElement("button");
      b.className = "text-button";
      b.textContent = "重新加载";
      b.onclick = () => {
        cache.delete(note.path);
        show(note);
      };
      content.append(p, b);
    }
  }
  function navigate(note, source) {
    if (reader.open) {
      history.replaceState(
        history.state,
        "",
        `#note=${encodeURIComponent(note.path)}`,
      );
    } else {
      history.pushState(
        { lynnNote: true },
        "",
        `#note=${encodeURIComponent(note.path)}`,
      );
      pushed = true;
    }
    show(note, source);
  }
  async function hide() {
    if (!reader.open || closing) return;
    closing = true;
    ++request;
    active = null;
    observer?.disconnect();
    if (!reduced())
      await reader
        .animate(
          [
            { opacity: 1, transform: "none" },
            {
              opacity: 0,
              transform: "translateY(30px) scale(.97) rotate(1deg)",
            },
          ],
          { duration: 180, easing: "ease-in" },
        )
        .finished.catch(() => {});
    reader.close();
    document.body.classList.remove("reading");
    closing = false;
    document.title = "Lynn — 好奇心手记";
    trigger?.focus({ preventScroll: true });
    if (!document.body.classList.contains('theatre-ready') || document.body.dataset.scene === 'notes') {
      scrollTo({ top: readingScroll, behavior: 'instant' });
    }
  }
  function route() {
    if (location.hash.startsWith("#note=")) {
      let path;
      try {
        path = decodeURIComponent(location.hash.slice(6));
      } catch {}
      const note = notes.find((n) => n.path === path);
      if (note) {
        show(note);
        return;
      }
      toast("这篇手记已移动或不存在。");
      history.replaceState(null, "", "#archive");
    }
    hide();
  }
  function close() {
    if (pushed && history.state?.lynnNote) {
      history.back();
    } else {
      history.replaceState(null, "", "#archive");
      hide();
    }
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-path]");
    if (b) {
      const n = notes.find((n) => n.path === b.dataset.path);
      if (n) navigate(n, b);
    }
    if (e.target.id === "reset-search") {
      search.value = "";
      category.value = "";
      render();
      if (document.body.classList.contains("theatre-ready")) {
        document.dispatchEvent(new Event("show-notes-search"));
      } else search.focus();
    }
  });
  $("close-reader").onclick = close;
  $("close-bottom").onclick = close;
  reader.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  reader.addEventListener("click", (e) => {
    if (e.target === reader) {
      const r = reader.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        close();
    }
  });
  $("share-note").onclick = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("手记链接已复制。");
    } catch {
      toast("请从浏览器地址栏复制手记链接。");
    }
  };
  scroller.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("hashchange", route);
  search.addEventListener("input", render);
  category.addEventListener("change", render);
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      !reader.open &&
      !document.getElementById("entrance")?.open &&
      !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) &&
      !document.activeElement.isContentEditable
    ) {
      e.preventDefault();
      if (document.body.classList.contains("theatre-ready")) {
        document.dispatchEvent(new Event("show-notes-search"));
      } else search.focus();
    }
  });
  async function load() {
    try {
      const response = await fetch("notes-index.json");
      if (!response.ok) throw Error("目录加载失败");
      const paths = await response.json();
      if (!Array.isArray(paths)) throw Error("目录格式无效");
      notes = paths
        .filter((p) => typeof p === "string" && p.endsWith(".md"))
        .map((path, index) => {
          const parts = path.split("/").map((part) => {
              try {
                return decodeURIComponent(part);
              } catch {
                return part;
              }
            }),
            filename = parts.pop();
          return {
            path,
            url: new URL(path, location.href).href,
            title: filename.replace(/\.md$/i, ""),
            category:
              parts.slice(parts.lastIndexOf("notes") + 1).join(" / ") ||
              "开始这里",
            index,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
      const queue = [...notes];
      await Promise.all(
        Array.from({ length: Math.min(4, queue.length) }, async () => {
          while (queue.length) {
            const n = queue.shift();
            try {
              meta(n, await fetchNote(n));
            } catch {}
          }
        }),
      );
      category.innerHTML = '<option value="">全部主题</option>';
      [...new Set(notes.map((n) => n.category))].sort().forEach((name) => {
        const o = document.createElement("option");
        o.value = o.textContent = name;
        category.append(o);
      });
      render();
      route();
    } catch {
      list.innerHTML =
        '<div class="state">书架暂时没有打开。<br><button id="retry-index" type="button">重新加载目录</button></div>';
      $("count").textContent = "连接未完成";
      $("retry-index").onclick = load;
    }
  }
  load();
})();
