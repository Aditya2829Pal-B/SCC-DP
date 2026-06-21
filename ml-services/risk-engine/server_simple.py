#!/usr/bin/env python3
"""
Lightweight Risk Engine emulation (no external deps).
Provides /risk-score (POST), /risk-zones (GET), /health (GET)
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from urllib.parse import urlparse
import sys
import math
import random
from datetime import datetime

RISK_ZONES = [
    {"name": "Yamuna Flood Zone", "center": [77.24, 28.68], "radius": 2000, "risk_level": "high", "risk_score": 0.87, "type": "flood", "complaints": 12},
    {"name": "Central Delhi Heat Zone", "center": [77.209, 28.632], "radius": 1500, "risk_level": "medium", "risk_score": 0.62, "type": "heatwave", "complaints": 8},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def compute_risk(location, user_sensitivity=1.0):
    lat, lon = location.get('latitude', 28.6139), location.get('longitude', 77.2090)
    nearby = []
    max_area_risk = 0.1
    for z in RISK_ZONES:
        dist = haversine_distance(lat, lon, z['center'][1], z['center'][0])
        if dist < z['radius'] * 2:
            proximity = max(0, 1 - (dist / (z['radius'] * 2)))
            effective = z['risk_score'] * proximity
            max_area_risk = max(max_area_risk, effective)
            nearby.append({**z, 'distance_m': round(dist), 'proximity': round(proximity,3)})
    disaster_probability = round(0.65 + random.random() * 0.2, 3)
    risk_score = min(1.0, disaster_probability * max_area_risk * user_sensitivity)
    risk_score = round(max(0.05, risk_score), 3)
    level = 'high' if risk_score >= 0.7 else 'medium' if risk_score >= 0.4 else 'low'
    return risk_score, level, {'disasterProbability': disaster_probability, 'areaRisk': round(max_area_risk,3), 'userSensitivity': user_sensitivity}, nearby

class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_GET(self):
        p = urlparse(self.path)
        if p.path == '/health':
            self._send(200, {"status":"OK","service":"Risk Engine (simple)"}); return
        if p.path == '/risk-zones':
            self._send(200, {"zones": RISK_ZONES}); return
        self._send(404, {"error":"not found"})

    def do_POST(self):
        p = urlparse(self.path)
        length = int(self.headers.get('content-length',0))
        body = self.rfile.read(length).decode() if length else ''
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}
        if p.path == '/risk-score':
            loc = data.get('location', {})
            us = data.get('user_sensitivity', 1.0)
            score, level, breakdown, nearby = compute_risk(loc, us)
            recs = ['Keep emergency supplies ready', 'Register for SMS alerts']
            routes = [{"name":"Route A","distance":"5.2 km","estimatedTime":"18 min","safety":"high"}]
            self._send(200, {"riskScore": score, "riskLevel": level, "breakdown": breakdown, "recommendations": recs, "safeRoutes": routes, "nearbyZones": nearby}); return
        self._send(404, {"error":"not found"})

def run(port=8003):
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"[SIMPLE RISK] Listening on http://0.0.0.0:{port}")
    server.serve_forever()

if __name__ == '__main__':
    p = int(sys.argv[1]) if len(sys.argv)>1 else 8003
    run(p)
