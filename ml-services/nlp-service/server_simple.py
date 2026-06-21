#!/usr/bin/env python3
"""
Lightweight NLP service emulation (no external dependencies).
Provides /classify (POST), /health (GET), /categories (GET)
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from urllib.parse import urlparse
import sys

TRAINING_DATA = [
    ("Large pothole on main road causing accidents", "Road Damage"),
    ("No water supply since 3 days in our colony", "Water Supply"),
    ("Power outage for 12 hours in residential area", "Electricity"),
    ("Garbage not collected for a week", "Garbage"),
    ("Streets flooded after just 30 minutes of rain", "Flooding"),
    ("Street light not working for months", "Street Light"),
    ("Construction noise at night disturbing sleep", "Noise Pollution"),
    ("Sewage overflowing on main road", "Sewage"),
]

def build_index(data):
    cats = sorted(set(label for _, label in data))
    index = {c: [] for c in cats}
    for text, label in data:
        for w in [w.strip('.,').lower() for w in text.split()]:
            if len(w) > 3 and w not in index[label]:
                index[label].append(w)
    return cats, index

categories, keyword_index = build_index(TRAINING_DATA)

def classify_text(text):
    t = text.lower()
    scores = {c: 0 for c in categories}
    for c, kws in keyword_index.items():
        for kw in kws:
            if kw in t:
                scores[c] += 1
    best = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    if total == 0:
        return ("Other", 0.5)
    conf = round(max(0.6, scores[best] / total), 4)
    return (best, conf)

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_GET(self):
        p = urlparse(self.path)
        if p.path == '/health':
            self._send(200, {"status": "OK", "service": "NLP Classification (simple)"})
            return
        if p.path == '/categories':
            self._send(200, {"categories": categories})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self):
        p = urlparse(self.path)
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length).decode() if length else ''
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        if p.path == '/classify':
            text = (data.get('text') or '').strip()
            if not text:
                self._send(400, {"error": "text required"})
                return
            cat, conf = classify_text(text)
            self._send(200, {"category": cat, "confidence": conf, "source": "simple"})
            return

        self._send(404, {"error": "not found"})

def run(port=8001):
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"[SIMPLE NLP] Listening on http://0.0.0.0:{port}")
    server.serve_forever()

if __name__ == '__main__':
    p = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    run(p)
