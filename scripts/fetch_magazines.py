import json
from pathlib import Path
import requests
import time

URL = "https://gutendex.com/books/"
OUT_JSON = Path(__file__).resolve().parents[1] / "data" / "magazines.json"
OUT_EPUBS = Path(__file__).resolve().parents[1] / "data" / "epubs"

def fetch_rows(target_count: int = 50) -> list[dict]:
    items = []
    # 使用英文 (languages=en) 获取
    next_url = f"{URL}?topic=history&languages=en"
    
    print("Fetching online data from Project Gutenberg (English History)...")
    
    # 创建 epubs 目录
    OUT_EPUBS.mkdir(parents=True, exist_ok=True)
    
    while next_url and len(items) < target_count:
        print(f"Requesting: {next_url}")
        r = requests.get(next_url, timeout=30)
        r.raise_for_status()
        data = r.json()
        
        results = data.get("results", [])
        for d in results:
            ident = str(d.get("id"))
            title = d.get("title", "Unknown")
            authors = [a.get("name") for a in d.get("authors", []) if a.get("name")]
            subjects = d.get("subjects", [])
            description = f"Author(s): {', '.join(authors)}" if authors else "No author info"
            
            formats = d.get("formats", {})
            epub_url = formats.get("application/epub+zip")
            html_url = formats.get("text/html") or formats.get("text/html; charset=utf-8")
            
            read_url = f"https://www.gutenberg.org/ebooks/{ident}"
            is_epub = False
            
            # 下载 EPUB 到本地
            if epub_url:
                local_epub = OUT_EPUBS / f"{ident}.epub"
                try:
                    if not local_epub.exists():
                        print(f"Downloading EPUB for {ident}: {epub_url}")
                        epub_res = requests.get(epub_url, timeout=20, allow_redirects=True)
                        epub_res.raise_for_status()
                        local_epub.write_bytes(epub_res.content)
                    read_url = f"./data/epubs/{ident}.epub"
                    is_epub = True
                except Exception as e:
                    print(f"Failed to download EPUB {ident}: {e}")
                    # 降级为外部 HTML 链接
                    read_url = html_url if html_url else read_url
            else:
                read_url = html_url if html_url else read_url

            items.append({
                "identifier": ident,
                "title": title,
                "year": "N/A",
                "subject": subjects[:10],
                "description": description,
                "url": read_url,
                "isEpub": is_epub
            })
            
            if len(items) >= target_count:
                break
                
        next_url = data.get("next")
        if next_url and len(items) < target_count:
            time.sleep(1)
        
    return items

def main() -> None:
    # 减少到 50 条以避免抓取时间过长和体积过大
    items = fetch_rows(50)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(
        json.dumps(
            {
                "source": "Project Gutenberg (English History, Local EPUB)",
                "query": "topic: history, languages: en",
                "count": len(items),
                "items": items,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"done: {len(items)} -> {OUT_JSON}")

if __name__ == "__main__":
    main()
