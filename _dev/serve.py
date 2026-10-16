"""A local copy of zidbosna.com for testing, served the way GitHub Pages serves it: gzip for text, 404.html for a
missing page. Open it as http://zid.localhost:<port>/ : Chromium resolves *.localhost to this machine, and on that
host the page runs its demo scoreboard, so a test run can never reach the live board.

    python3 _dev/serve.py [port]        (default 8137)
"""
import gzip
import http.server
import io
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
TEXT = ('.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.xml', '.webmanifest', '.md')


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.mjs': 'text/javascript',
                      '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json'}

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a):
        pass

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        status = 200
        if not os.path.exists(path):
            path, status = os.path.join(ROOT, '404.html'), 404
            if not os.path.exists(path):
                self.send_error(404)
                return None
        with open(path, 'rb') as f:
            body = f.read()
        ctype = self.guess_type(path)
        zipped = path.endswith(TEXT) and 'gzip' in self.headers.get('Accept-Encoding', '')
        if zipped:
            body = gzip.compress(body, 6)
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        if zipped:
            self.send_header('Content-Encoding', 'gzip')
        self.send_header('Cache-Control', 'max-age=600')
        self.end_headers()
        return io.BytesIO(body)


if __name__ == '__main__':
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler) as s:
        print(f'ZID on http://zid.localhost:{PORT}/  (demo scoreboard; Ctrl+C to stop)', flush=True)
        s.serve_forever()
