from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "4173"))


class QRAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        return super().guess_type(path)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), QRAppHandler)
    print(f"QR app running at http://localhost:{PORT}", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()
