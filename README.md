# 한국 뉴스 | Korea News

실시간 한국 주요 뉴스를 수집하여 보여주는 정적 웹사이트입니다. GitHub Pages에 무료로 배포할 수 있습니다.

## 기능

- 📰 Google News Korea RSS 기반 실시간 뉴스
- 🏷️ 카테고리: 전체 헤드라인, 정치, 경제, 사회
- 🔄 새로고침 버튼
- 📱 반응형 디자인

## 로컬 실행

브라우저에서 `index.html`을 직접 열거나, 로컬 서버를 사용하세요:

```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve
```

그 후 http://localhost:8000 에서 확인할 수 있습니다.

## GitHub Pages 배포 방법

### 1. GitHub 저장소 생성

1. GitHub에 새 저장소(repository)를 만듭니다 (예: `korean-news`)
2. **Add a README file** 옵션은 선택하지 않아도 됩니다

### 2. 코드 업로드

```bash
cd korean-news
git init
git add .
git commit -m "Initial commit: Korean news aggregator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/korean-news.git
git push -u origin main
```

### 3. GitHub Pages 활성화

1. 저장소 페이지에서 **Settings** 클릭
2. 왼쪽 메뉴에서 **Pages** 선택
3. **Source**에서 **Deploy from a branch** 선택
4. **Branch**를 `main`으로, **Folder**를 `/ (root)`로 설정
5. **Save** 클릭

몇 분 후 `https://YOUR_USERNAME.github.io/korean-news/` 에서 사이트가 공개됩니다.

## 기술 스택

- 순수 HTML, CSS, JavaScript (빌드 도구 불필요)
- [RSS2JSON API](https://rss2json.com/) - RSS를 JSON으로 변환 (무료, API 키 불필요)

## 라이선스

MIT
