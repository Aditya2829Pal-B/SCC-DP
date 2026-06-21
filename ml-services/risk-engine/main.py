"""
Risk Engine Service V2 — Enterprise Personalized Risk Assessment
FastAPI microservice implementing geo-clustering, advanced environmental factors, and personalized risk scoring.

Risk Formula V2: Risk = Disaster Probability × Area Risk (Extended) × User Sensitivity
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import math
import random

app = FastAPI(title="SCC&DP Risk Engine V2", description="Enterprise Personalized Risk Assessment", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Models ──
class LocationInput(BaseModel):
    latitude: float = 28.6139
    longitude: float = 77.2090

class AdvancedFactors(BaseModel):
    traffic_conditions: str = Field(default="moderate", description="low, moderate, heavy, gridlock")
    nearby_hospitals: int = 2
    shelter_availability: bool = True
    shelter_capacity: float = Field(default=0.7, description="Percentage full (0.0 to 1.0)")
    historical_area_risk: float = Field(default=0.4, description="0.0 to 1.0 based on past incidents")
    population_density: float = Field(default=0.8, description="0.0 to 1.0 scale")
    air_quality_index: int = 150
    infrastructure_reliability: float = Field(default=0.6, description="0.0 (failing) to 1.0 (robust)")

class RiskRequest(BaseModel):
    userId: Optional[str] = None
    location: Optional[LocationInput] = None
    user_sensitivity: float = 1.0
    advanced_factors: Optional[AdvancedFactors] = None

class Shelter(BaseModel):
    name: str
    distance_km: float
    capacity_remaining: int
    facilities: List[str]

class SafeRoute(BaseModel):
    name: str
    distance: str
    estimatedTime: str
    safety: str

class RiskResponse(BaseModel):
    riskScore: float
    riskLevel: str
    breakdown: dict
    recommendedShelter: Optional[Shelter]
    safeRoutes: List[SafeRoute]
    emergencyGuidance: List[str]
    personalizedNotifications: List[str]
    nearbyZones: List[dict]

# ── Mock Data ──
RISK_ZONES = [
    {"name": "Yamuna Flood Zone", "center": [77.24, 28.68], "radius": 2000, "risk_level": "high", "risk_score": 0.87, "type": "flood"},
    {"name": "Central Delhi Heat Zone", "center": [77.209, 28.632], "radius": 1500, "risk_level": "medium", "risk_score": 0.62, "type": "heatwave"},
    {"name": "South Delhi Water Crisis", "center": [77.2167, 28.5245], "radius": 1800, "risk_level": "high", "risk_score": 0.78, "type": "water_shortage"},
    {"name": "Noida Industrial Area", "center": [77.391, 28.5355], "radius": 2500, "risk_level": "medium", "risk_score": 0.55, "type": "air_pollution"},
]

MOCK_SHELTERS = [
    {"name": "Community Hall Sector 4", "lat": 28.62, "lon": 77.21, "max_cap": 500},
    {"name": "Govt School Relief Camp", "lat": 28.68, "lon": 77.23, "max_cap": 1000},
    {"name": "Stadium Emergency Center", "lat": 28.58, "lon": 77.24, "max_cap": 5000},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def compute_risk_score(location: LocationInput, sensitivity: float, factors: AdvancedFactors):
    lat, lon = location.latitude, location.longitude
    nearby_zones = []
    base_area_risk = 0.1

    for zone in RISK_ZONES:
        dist = haversine_distance(lat, lon, zone["center"][1], zone["center"][0])
        if dist < zone["radius"] * 2:
            proximity = max(0, 1 - (dist / (zone["radius"] * 2)))
            base_area_risk = max(base_area_risk, zone["risk_score"] * proximity)
            nearby_zones.append({**zone, "distance_m": round(dist)})

    # Factor Modifiers
    traffic_mod = {"low": 0.9, "moderate": 1.0, "heavy": 1.15, "gridlock": 1.3}[factors.traffic_conditions]
    infra_mod = 1.0 + (1.0 - factors.infrastructure_reliability) * 0.3
    pop_mod = 1.0 + (factors.population_density * 0.2)
    aqi_mod = 1.0 + (max(0, factors.air_quality_index - 100) / 400) # Exacerbates risk if AQI > 100
    hospital_mod = 0.9 if factors.nearby_hospitals > 2 else 1.1

    extended_area_risk = base_area_risk * traffic_mod * infra_mod * pop_mod * aqi_mod * hospital_mod
    extended_area_risk = (extended_area_risk + factors.historical_area_risk) / 2 # Blend with historical

    disaster_probability = round(0.65 + random.random() * 0.2, 3) # Simulated from LSTM
    
    risk_score = min(1.0, disaster_probability * extended_area_risk * sensitivity)
    risk_score = round(max(0.05, risk_score), 3)

    risk_level = "high" if risk_score >= 0.75 else "medium" if risk_score >= 0.4 else "low"

    return risk_score, risk_level, {
        "disasterProbability": disaster_probability,
        "baseAreaRisk": round(base_area_risk, 3),
        "extendedAreaRisk": round(extended_area_risk, 3),
        "userSensitivity": sensitivity,
    }, nearby_zones

def find_best_shelter(location: LocationInput, factors: AdvancedFactors) -> Optional[Shelter]:
    if not factors.shelter_availability or factors.shelter_capacity > 0.95:
        return None # No shelters or all full
        
    best_shelter = None
    min_dist = float('inf')
    
    for s in MOCK_SHELTERS:
        dist = haversine_distance(location.latitude, location.longitude, s['lat'], s['lon']) / 1000.0
        if dist < min_dist:
            min_dist = dist
            best_shelter = s
            
    if best_shelter:
        rem_cap = int(best_shelter['max_cap'] * (1 - factors.shelter_capacity))
        return Shelter(
            name=best_shelter['name'],
            distance_km=round(min_dist, 1),
            capacity_remaining=rem_cap,
            facilities=["First Aid", "Water", "Power Backup"]
        )
    return None

def generate_routes(traffic: str, shelter: Optional[Shelter]) -> List[SafeRoute]:
    routes = []
    base_speed = {"low": 40, "moderate": 30, "heavy": 15, "gridlock": 5}[traffic] # km/h
    
    if shelter:
        dist = shelter.distance_km
        time_mins = int((dist / base_speed) * 60)
        routes.append(SafeRoute(
            name=f"Direct Route to {shelter.name}",
            distance=f"{dist} km",
            estimatedTime=f"{time_mins} min",
            safety="medium" if traffic in ["heavy", "gridlock"] else "high"
        ))
        
    routes.append(SafeRoute(
        name="Evacuation Route (Highway)",
        distance="12.5 km",
        estimatedTime=f"{int((12.5 / (base_speed*1.2)) * 60)} min",
        safety="high"
    ))
    return routes

def generate_guidance(risk_level: str, factors: AdvancedFactors, nearby: list) -> tuple:
    guidance = []
    notifications = []
    
    if risk_level == "high":
        guidance.append("🚨 EVACUATION ADVISORY: Please prepare emergency kit and review safe routes.")
        notifications.append("CRITICAL: High risk detected in your area. Follow authorities' instructions.")
    elif risk_level == "medium":
        guidance.append("⚠️ Be prepared for potential service disruptions.")
        
    if factors.air_quality_index > 200:
        guidance.append("Wear N95 masks. AQI is hazardous.")
        notifications.append("HEALTH WARNING: Severe air pollution in your vicinity.")
        
    if factors.traffic_conditions in ["heavy", "gridlock"]:
        guidance.append("Avoid road travel. Extreme congestion detected.")
        
    if factors.infrastructure_reliability < 0.4:
        guidance.append("Power and water grids are unstable. Expect outages.")
        
    if not guidance:
        guidance.append("Current conditions are nominal. No immediate action required.")
        notifications.append("Area status is safe.")
        
    return guidance, notifications

@app.post("/risk-score", response_model=RiskResponse)
async def calculate_risk(request: RiskRequest):
    location = request.location or LocationInput()
    factors = request.advanced_factors or AdvancedFactors()
    
    risk_score, risk_level, breakdown, nearby = compute_risk_score(location, request.user_sensitivity, factors)
    
    shelter = find_best_shelter(location, factors)
    routes = generate_routes(factors.traffic_conditions, shelter)
    guidance, notifications = generate_guidance(risk_level, factors, nearby)

    return RiskResponse(
        riskScore=risk_score, 
        riskLevel=risk_level, 
        breakdown=breakdown,
        recommendedShelter=shelter,
        safeRoutes=routes, 
        emergencyGuidance=guidance,
        personalizedNotifications=notifications,
        nearbyZones=nearby
    )

@app.get("/health")
async def health():
    return {"status": "OK", "service": "Risk Engine V2", "features": ["Advanced Factors", "Dynamic Routing", "Shelter Recommendations"]}
