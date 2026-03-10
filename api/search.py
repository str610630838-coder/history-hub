from http.server import BaseHTTPRequestHandler
import urllib.parse
import urllib.request
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        q = query.get('q', ['history'])[0]
        
        url = f"https://gutendex.com/books/?search={urllib.parse.quote(q)}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            items = []
            for d in data.get('results', [])[:30]: # 返回前30个结果
                ident = str(d.get("id"))
                title = d.get("title", "Unknown")
                authors = [a.get("name") for a in d.get("authors", []) if a.get("name")]
                subjects = d.get("subjects", [])
                
                description = f"Author(s): {', '.join(authors)}" if authors else "No author info"
                
                formats = d.get("formats", {})
                epub_url = formats.get("application/epub+zip")
                html_url = formats.get("text/html") or formats.get("text/html; charset=utf-8")
                
                read_url = epub_url if epub_url else html_url
                if not read_url:
                    read_url = f"https://www.gutenberg.org/ebooks/{ident}"
                    
                is_epub = bool(epub_url)
                
                if is_epub:
                    # 利用 Vercel Rewrite 边缘代理完美解决跨域防盗链问题
                    read_url = read_url.replace("https://www.gutenberg.org", "/gutenberg")
                    
                items.append({
                    "identifier": ident,
                    "title": title,
                    "year": "N/A",
                    "subject": subjects[:10],
                    "description": description,
                    "url": read_url,
                    "isEpub": is_epub
                })
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"items": items}).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        return
