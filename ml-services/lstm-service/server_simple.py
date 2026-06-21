#!/usr/bin/env python3
"""
Lightweight LSTM prediction emulation (no external deps).
Provides /predict (POST), /weather-data (GET), /health (GET)
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from urllib.parse import urlparse, parse_qs
import sys
import random
from datetime import datetime, timedelta

def mock_predict(body):
    temperature = float(body.get('temperature', 35.0))
    humidity = float(body.get('humidity', 65.0))
    rainfall = float(body.get('rainfall', 20.0))

    def prob(val):
        return round(min(1.0, max(0.05, val)), 3)

    flood = prob((rainfall / 100) * 0.6 + (humidity / 100) * 0.3 + (1 - 1010 / 1020) * 0.1)
    heat = prob(max(0.05, (temperature - 30) / 20))
    storm = prob((humidity / 100) * 0.4 + (random.random() * 0.2))

    preds = [
        {"type": "Flood", "probability": flood, "timeframe": "24-48 hours", "trend": "increasing" if rainfall>30 else "stable", "confidence": round(0.7+random.random()*0.2,3)},
        {"type": "Heatwave", "probability": heat, "timeframe": "12-24 hours", "trend": "stable", "confidence": round(0.75+random.random()*0.15,3)},
        {"type": "Thunderstorm", "probability": storm, "timeframe": "6-12 hours", "trend": "increasing" if random.random()>0.5 else "decreasing", "confidence": round(0.6+random.random()*0.25,3)},
    ]
    return {"predictions": preds, "weather_summary": {"temperature": temperature, "humidity": humidity, "rainfall": rainfall}, "last_updated": datetime.now().isoformat()}

def generate_weather(days=30):
    data = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=days - 1 - i)).strftime('%Y-%m-%d')
        data.append({
            "date": date,
            "temperature": round(28 + random.random() * 15, 1),
            "humidity": round(40 + random.random() * 50, 1),
            "rainfall": round(max(0, random.random() * 80 - 30), 1),
            "windSpeed": round(5 + random.random() * 25, 1)
        })
    return data

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_GET(self):
        p = urlparse(self.path)
        if p.path == '/health':
            self._send(200, {"status":"OK","service":"LSTM (simple)"}); return
        if p.path == '/weather-data':
            qs = parse_qs(p.query)
            days = int(qs.get('days',[30])[0])
            self._send(200, {"data": generate_weather(days)}); return
        self._send(404, {"error":"not found"})

    def do_POST(self):
        p = urlparse(self.path)
        length = int(self.headers.get('content-length',0))
        body = self.rfile.read(length).decode() if length else ''
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}
        if p.path == '/predict':
            self._send(200, mock_predict(data)); return
        self._send(404, {"error":"not found"})

def run(port=8002):
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"[SIMPLE LSTM] Listening on http://0.0.0.0:{port}")
    server.serve_forever()

if __name__ == '__main__':
    p = int(sys.argv[1]) if len(sys.argv)>1 else 8002
    run(p)
