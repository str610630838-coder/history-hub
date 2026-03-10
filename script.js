const grid = document.getElementById('grid');
const q = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const stats = document.getElementById('stats');
const tpl = document.getElementById('cardTpl');
const bookshelfBtn = document.getElementById('bookshelfBtn');

const readerModal = document.getElementById('readerModal');
const readerFrame = document.getElementById('readerFrame');
const readerTitle = document.getElementById('readerTitle');
const closeReaderBtn = document.getElementById('closeReaderBtn');
const readerLoader = document.getElementById('readerLoader');
const epubViewer = document.getElementById('epubViewer');
const epubArea = document.getElementById('epubArea');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let allItems = [];
let showOnlyBookshelf = false;

// 动态后端版本：书架现在存入完整的书籍对象，而不仅是 identifier
function getBookshelf() {
  try {
    return JSON.parse(localStorage.getItem('history-bookshelf-full') || '[]');
  } catch (e) {
    return [];
  }
}

function saveBookshelf(books) {
  localStorage.setItem('history-bookshelf-full', JSON.stringify(books));
}

function toggleBookmark(itemStr) {
  const item = JSON.parse(itemStr);
  let books = getBookshelf();
  const existingIndex = books.findIndex(b => b.identifier === item.identifier);
  
  if (existingIndex > -1) {
    books.splice(existingIndex, 1);
  } else {
    books.push(item);
  }
  saveBookshelf(books);
  render();
}

async function searchData() {
  const keyword = q.value.trim() || 'history';
  stats.textContent = `⚡ 正在动态解析 "${keyword}" 的资源并提取直链，请稍候...`;
  grid.innerHTML = '';
  
  try {
    // 请求 Vercel Serverless 后端 API
    const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = data.items || [];
    showOnlyBookshelf = false;
    bookshelfBtn.classList.remove('active');
    render();
  } catch (err) {
    stats.textContent = `获取失败：${err.message}`;
  }
}

function render() {
  let displayItems = showOnlyBookshelf ? getBookshelf() : allItems;
  stats.textContent = showOnlyBookshelf 
    ? `书架共存有 ${displayItems.length} 本书籍`
    : `为您搜索到 ${displayItems.length} 本原版电子书 (基于 Vercel 动态接口)`;
  
  grid.innerHTML = '';

  displayItems.forEach((item) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('.title').textContent = item.title || 'Untitled';
    node.querySelector('.meta').textContent = `ID：${item.identifier} ${item.isEpub ? '· 支持EPUB精排' : '· HTML流'}`;
    node.querySelector('.desc').textContent = item.description || '暂无简介';
    
    const tags = node.querySelector('.tags');
    (item.subject || []).slice(0, 3).forEach((tag) => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.textContent = tag.split('--')[0].trim();
      tags.appendChild(el);
    });

    const books = getBookshelf();
    const bookmarkBtn = node.querySelector('.bookmark-btn');
    const isSaved = books.some(b => b.identifier === item.identifier);
    if (isSaved) {
      bookmarkBtn.classList.add('saved');
      bookmarkBtn.textContent = '移出书架';
    }
    bookmarkBtn.addEventListener('click', () => toggleBookmark(JSON.stringify(item)));

    const readBtn = node.querySelector('.read-btn');
    readBtn.addEventListener('click', () => openReader(item.title, item.url, item.isEpub));

    const link = node.querySelector('.link');
    link.href = item.url.replace('/gutenberg', 'https://www.gutenberg.org');
    
    grid.appendChild(node);
  });
}

let currentBook = null;
let currentRendition = null;

function openReader(title, url, isEpub) {
  readerTitle.textContent = title;
  readerLoader.style.display = 'flex';
  readerModal.classList.add('open');

  if (currentBook) {
    currentBook.destroy();
    currentBook = null;
  }
  epubArea.innerHTML = '';
  
  if (isEpub) {
    readerFrame.style.display = 'none';
    epubViewer.style.display = 'block';
    
    // ePub.js 现已突破跨域防盗链，直接从同域名的 Vercel Edge Proxy 加载 EPUB 文件
    currentBook = ePub(url);
    currentRendition = currentBook.renderTo(epubArea, {
      width: "100%",
      height: "100%",
      spread: "none"
    });
    
    currentRendition.display().then(() => {
      readerLoader.style.display = 'none';
    }).catch(err => {
      console.error(err);
      readerLoader.querySelector('p').textContent = '跨域直连加载失败，请尝试外部打开。';
    });

    prevBtn.onclick = () => { if (currentRendition) currentRendition.prev(); };
    nextBtn.onclick = () => { if (currentRendition) currentRendition.next(); };
    
  } else {
    epubViewer.style.display = 'none';
    readerFrame.style.display = 'block';
    
    readerFrame.onload = function() {
      readerLoader.style.display = 'none';
    };
    readerFrame.src = url;
  }
}

closeReaderBtn.addEventListener('click', () => {
  readerModal.classList.remove('open');
  if (currentBook) {
    currentBook.destroy();
    currentBook = null;
  }
  epubArea.innerHTML = '';
  readerFrame.onload = null;
  readerFrame.src = '';
});

searchBtn.addEventListener('click', searchData);
q.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchData();
});

bookshelfBtn.addEventListener('click', () => {
  showOnlyBookshelf = !showOnlyBookshelf;
  bookshelfBtn.classList.toggle('active', showOnlyBookshelf);
  render();
});

if (getBookshelf().length > 0) {
  showOnlyBookshelf = true;
  bookshelfBtn.classList.add('active');
  render();
} else {
  searchData();
}