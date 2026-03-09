/**
 * 历史杂志馆 - 前端脚本
 * 纯前端模式：直接调用 Gutendex 公开 API（支持 CORS）
 * 数据源：Project Gutenberg (Gutendex)
 */
const GUTENDEX_BASE = "https://gutendex.com/books";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const quickButtons = document.querySelectorAll(".quick-btn");
const statusText = document.getElementById("statusText");
const resultCount = document.getElementById("resultCount");
const magazineGrid = document.getElementById("magazineGrid");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");

function normalizeMagazineEntry(doc) {
  const identifier = String(doc.id || "");
  const authors = doc.authors || [];
  const creator = authors.length ? authors[0].name || "未知" : "未知";
  const subjects = doc.subjects || [];
  const subject = subjects.slice(0, 3).map(s => s.split("--").pop().trim()).join(", ");
  const description = `下载量: ${doc.download_count || 0} | 语言: ${(doc.languages || []).join(", ")}`;
  const formats = doc.formats || {};
  const cover = formats["image/jpeg"] || "";
  const webpage_url = formats["text/html"] || formats["text/plain; charset=utf-8"] ||
    `https://www.gutenberg.org/ebooks/${identifier}`;
  return {
    id: identifier,
    title: doc.title || "无标题",
    creator,
    description,
    subject,
    thumbnail: cover,
    webpage_url,
  };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function setLoading(visible) {
  loading.classList.toggle("hidden", !visible);
  searchBtn.disabled = visible;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
}

function renderEmpty() {
  magazineGrid.innerHTML = '<p class="magazine-empty">没有搜索到杂志，请换个关键词试试。</p>';
  resultCount.textContent = "0";
}

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='293'%3E%3Crect fill='%231a1d24' width='220' height='293'/%3E%3Ctext fill='%239aa3b8' x='110' y='150' text-anchor='middle' font-size='14'%3E无封面%3C/text%3E%3C/svg%3E";

function renderCards(items) {
  if (!items.length) {
    renderEmpty();
    return;
  }
  magazineGrid.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.title || "无标题");
      const creator = escapeHtml(item.creator || "未知");
      const thumb = escapeHtml(item.thumbnail || "");
      const link = escapeHtml(item.webpage_url || "#");
      const desc = escapeHtml(item.description || "");
      const subject = escapeHtml((item.subject || "").slice(0, 80));
      return `
    <article class="magazine-card">
      <a href="${link}" target="_blank" rel="noopener noreferrer">
        <img class="magazine-cover" src="${thumb || PLACEHOLDER_SVG}" alt="${title} 封面" loading="lazy" onerror="this.src='${PLACEHOLDER_SVG}'">
      </a>
      <div class="magazine-content">
        <h3 class="magazine-title">${title}</h3>
        <p class="magazine-meta">${creator}</p>
        <p class="magazine-meta">${desc}</p>
        ${subject ? `<p class="magazine-subject">${subject}</p>` : ""}
        <div class="magazine-actions">
          <a class="view-btn" href="${link}" target="_blank" rel="noopener noreferrer">在线阅读</a>
        </div>
      </div>
    </article>`;
    })
    .join("");
  resultCount.textContent = String(items.length);
}

async function fetchSearch(query) {
  setLoading(true);
  hideError();
  statusText.textContent = `正在搜索：${query}`;
  try {
    const url = `${GUTENDEX_BASE}/?search=${encodeURIComponent(query)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const results = Array.isArray(data.results) ? data.results : [];
    const items = results.slice(0, 18)
      .filter(d => d.id)
      .map(normalizeMagazineEntry);

    renderCards(items);
    statusText.textContent = `搜索完成：${query}（共 ${items.length} 条）`;
  } catch (err) {
    console.error(err);
    showError(`搜索失败：${err.message || "网络错误，请稍后重试"}`);
    renderEmpty();
    statusText.textContent = "搜索失败";
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;
  await fetchSearch(query);
});

quickButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const query = button.dataset.query || "";
    if (!query) return;
    searchInput.value = query;
    await fetchSearch(query);
  });
});

// 页面加载时按需搜索
hideError();
fetchSearch("Magazine");
