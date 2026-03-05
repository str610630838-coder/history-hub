// RSS Feed URLs - 联联社(연합뉴스) 分类 + Google News 综合
const FEEDS = {
    headlines: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
    politics: 'https://www.yna.co.kr/rss/politics.xml',
    economy: 'https://www.yna.co.kr/rss/economy.xml',
    society: 'https://www.yna.co.kr/rss/society.xml'
};

const API_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const CORS_PROXIES = [
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
];

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const newsContainer = document.getElementById('newsContainer');
const refreshBtn = document.getElementById('refreshBtn');

let currentFeed = 'headlines';

async function fetchWithProxy(apiUrl) {
    let lastErr;
    for (const proxy of CORS_PROXIES) {
        try {
            const url = proxy + encodeURIComponent(apiUrl);
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 15000);
            const response = await fetch(url, { signal: ctrl.signal });
            clearTimeout(timeout);
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr;
}

async function fetchNews(feedKey) {
    try {
        const res = await fetch(`news-data/${feedKey}.json`);
        if (res.ok) {
            const data = await res.json();
            if (data.status === 'ok' && data.items?.length) return data;
        }
    } catch (_) {}
    const apiUrl = `${API_BASE}${encodeURIComponent(FEEDS[feedKey])}`;
    return fetchWithProxy(apiUrl);
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
        let data = await fetchNews(feedKey);

        if (data.status !== 'ok' || !data.items || data.items.length === 0) {
            if (feedKey !== 'headlines') {
                data = await fetchNews('headlines');
                feedKey = 'headlines';
            }
            if (!data || data.status !== 'ok' || !data.items || data.items.length === 0) {
                throw new Error('No items');
            }
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
