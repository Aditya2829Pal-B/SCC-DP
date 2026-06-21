# 🏙️ SCC&DP — Smart City Complaint & Disaster Prediction Platform

An AI-powered full-stack web application for smart city management, featuring NLP-based complaint classification, LSTM disaster prediction, personalized risk assessment, and interactive risk mapping.

## 🏗️ Architecture

```
Frontend (React/Vite) → API Gateway (Node.js/Express) → ML Microservices (Python/FastAPI)
                                    ↓
                          MongoDB + Redis (Database Layer)
```

### Services
| Service | Port | Technology | Purpose |
|---------|------|-----------|---------|
| Frontend | 3000 | React + Vite | User interface |
| Backend API | 5000 | Node.js + Express | API Gateway |
| NLP Service | 8001 | Python FastAPI | Complaint classification (TF-IDF) |
| LSTM Service | 8002 | Python FastAPI | Disaster prediction |
| Risk Engine | 8003 | Python FastAPI | Personalized risk scoring |
| MongoDB | 27017 | MongoDB 7 | Data storage with GeoJSON |
| Redis | 6379 | Redis 7 | Real-time caching |

## 🚀 Quick Start

### Frontend (React)
```bash
cd frontend
npm install
npm run dev    # → http://localhost:3000
```

### Backend (Node.js)
```bash
cd backend
npm install
npm run dev    # → http://localhost:5000
```

### ML Services (Python)
```bash
# NLP Service
cd ml-services/nlp-service
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload

# LSTM Service
cd ml-services/lstm-service
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload

# Risk Engine
cd ml-services/risk-engine
pip install -r requirements.txt
uvicorn main:app --port 8003 --reload
```

### Docker (All Services)
```bash
docker-compose up --build
```

## 📋 Features

### User Features
- 🔐 JWT Authentication (Login/Signup)
- 📝 Complaint submission with map-based location picker
- 🤖 AI-powered auto-classification of complaints (NLP)
- 📊 Dashboard with complaint trends and risk score
- 🗺️ Interactive map with risk zones and complaint markers
- 🔔 Personalized alerts based on location and risk profile
- 🛡️ Safety recommendations and safe route suggestions

### Admin Features
- 📈 Analytics dashboard with charts and heatmaps
- 📋 Complaint management with status updates
- 📊 Category distribution and trend analysis
- 🌍 Risk zone monitoring

### ML Capabilities
- **NLP Classification**: TF-IDF + Naive Bayes for 8 complaint categories
- **Disaster Prediction**: Weather-based probability scoring (simulated LSTM)
- **Risk Engine**: `Risk = Disaster Probability × Area Risk × User Sensitivity`
- **Geo-clustering**: Haversine distance-based risk zone detection

## 🔑 Demo Credentials
- **Admin**: `aditya@demo.com` / any password
- **User**: `priya@demo.com` / any password

## 📁 Project Structure

```
SCC&DP/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/       # Sidebar, shared components
│   │   ├── pages/            # Dashboard, Map, Alerts, Admin
│   │   ├── services/         # API client, mock data
│   │   ├── context/          # Auth context
│   │   └── utils/            # Helper functions
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── routes/           # Auth, Complaints, Alerts, ML proxy
│   │   ├── models/           # Mongoose schemas (GeoJSON)
│   │   └── middleware/       # JWT authentication
│   └── data/                 # Sample datasets
├── ml-services/
│   ├── nlp-service/          # TF-IDF complaint classifier
│   ├── lstm-service/         # Disaster predictor
│   └── risk-engine/          # Personalized risk scoring
└── docker-compose.yml
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/signup` | User registration |
| GET | `/api/complaints` | List complaints |
| POST | `/api/complaints` | Submit complaint (auto-classified) |
| PUT | `/api/complaints/:id` | Update complaint status |
| GET | `/api/complaints/geo/nearby` | GeoJSON nearby query |
| GET | `/api/alerts` | Get personalized alerts |
| GET | `/api/alerts/risk/:userId` | Get user risk score |
| POST | `/api/ml/classify` | NLP classification |
| POST | `/api/ml/predict` | Disaster prediction |
| POST | `/api/ml/risk-score` | Risk scoring |

## ⚙️ Risk Score Formula

```
Risk Score = Disaster Probability × Area Risk × User Sensitivity

Where:
- Disaster Probability: From LSTM model (weather-based)
- Area Risk: From geo-clustering (complaint density + proximity)
- User Sensitivity: User-specific modifier (health, age, etc.)
```

## 📊 Tech Stack

**Frontend**: React 18, Vite, React Router, Leaflet, Chart.js, Framer Motion
**Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
**ML**: Python, FastAPI, scikit-learn, NumPy, Pandas
**DevOps**: Docker, Docker Compose

---
Built with ❤️ for Smart City Innovation
