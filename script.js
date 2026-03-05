// RSS Feed URLs (via rss2json - free API, no key required)
const FEEDS = {
    headlines: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    politics: 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=%EC%A0%95%EC%B9%98',
    economy: 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=%EA%B2%BD%EC%A0%9C',
    society: 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=%EC%82%AC%ED%9A%8C'
};

const API_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const newsContainer = document.getElementById('newsContainer');
const refreshBtn = document.getElementById('refreshBtn');

let currentFeed = 'headlines';

async function fetchNews(feedKey) {
    const url = `${API_BASE}${encodeURIComponent(FEEDS[feedKey])}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    return response.json();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
}

function renderNews(items) {
    newsContainer.innerHTML = items.map(item => `
        <article class="news-card">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                <h3>${escapeHtml(item.title)}</h3>
                <span class="date">${formatDate(item.pubDate)}</span>
            </a>
        </article>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    newsContainer.innerHTML = '';
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function showError() {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
}

async function loadNews(feedKey = currentFeed) {
    currentFeed = feedKey;
    showLoading();
    refreshBtn.disabled = true;

    try {
        const data = await fetchNews(feedKey);

        if (data.status !== 'ok' || !data.items || data.items.length === 0) {
            throw new Error('No items');
        }

        renderNews(data.items);
        hideLoading();
    } catch (err) {
        console.error(err);
        showError();
    } finally {
        refreshBtn.disabled = false;
    }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadNews(tab.dataset.feed);
    });
});

// Refresh button
refreshBtn.addEventListener('click', () => loadNews());

// Initial load
loadNews();
