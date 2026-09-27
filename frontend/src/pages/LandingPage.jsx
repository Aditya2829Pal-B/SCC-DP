import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield, FiActivity, FiMap, FiCpu, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css'; // We will create this

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <FiShield className="logo-icon" />
          <span>SCC&DP</span>
        </div>
        <div className="landing-nav-links">
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
                Log In
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>
                Citizen Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-background">
          <div className="hero-glow shape-1" />
          <div className="hero-glow shape-2" />
        </div>
        
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="badge-beta">AI-Powered Civic Governance</span>
            <h1 className="hero-title">
              Smart City Complaint <br/>
              <span className="text-gradient">& Disaster Prediction</span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of urban management. Zero-shot NLP routes your grievances instantly. Machine learning predicts urban disasters before they happen.
            </p>
            
            <div className="hero-cta-group">
              <button className="btn btn-primary btn-lg pulse-hover" onClick={handleCTA}>
                {user ? 'Enter Dashboard' : 'Report an Issue Now'} <FiArrowRight />
              </button>
              {!user && (
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                  Admin Portal Access
                </button>
              )}
            </div>
          </motion.div>

          {/* Interactive Floating Dashboard Mockup */}
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="glass-card mockup-card">
              <div className="mockup-header">
                <div className="dots"><span></span><span></span><span></span></div>
                <div className="mockup-title">scc-dp.gov.in/live-heatmap</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="mockup-line w-full" />
                  <div className="mockup-line w-3/4" />
                  <div className="mockup-line w-5/6" />
                </div>
                <div className="mockup-map">
                  <div className="mockup-radar-ping" />
                  <div className="mockup-hotspot red" style={{ top: '30%', left: '40%' }} />
                  <div className="mockup-hotspot yellow" style={{ top: '70%', left: '60%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Live Stats Ticker */}
      <div className="stats-ticker-wrapper">
        <div className="stats-ticker">
          <div className="stat-item"><span className="stat-num">95%</span> AI Classification Accuracy</div>
          <div className="stat-item"><span className="stat-num">&lt;2s</span> Instant Department Routing</div>
          <div className="stat-item"><span className="stat-num">48h</span> SLA Enforcement Standard</div>
          <div className="stat-item"><span className="stat-num">12+</span> Geospatial Disaster Types</div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="features-section">
        <div className="features-header">
          <h2>Next-Generation Civic Technology</h2>
          <p>Built for the scale of modern mega-cities</p>
        </div>

        <div className="features-grid">
          <motion.div className="glass-card feature-card" whileHover={{ y: -10 }}>
            <div className="feature-icon"><FiCpu /></div>
            <h3>NLP Auto-Routing</h3>
            <p>Our mDeBERTa zero-shot AI reads complaints in any language and instantly routes them to the exact municipal desk responsible.</p>
          </motion.div>

          <motion.div className="glass-card feature-card" whileHover={{ y: -10 }}>
            <div className="feature-icon"><FiMap /></div>
            <h3>DBSCAN Heatmaps</h3>
            <p>Real-time spatial clustering identifies infrastructure failure hotspots and visualizes high-risk zones on dark-mode CartoDB maps.</p>
          </motion.div>

          <motion.div className="glass-card feature-card" whileHover={{ y: -10 }}>
            <div className="feature-icon"><FiActivity /></div>
            <h3>Disaster Forecasting</h3>
            <p>LSTM time-series engines ingest meteorological data to predict flash floods, heatwaves, and critical infrastructure stress.</p>
          </motion.div>
          
          <motion.div className="glass-card feature-card" whileHover={{ y: -10 }}>
            <div className="feature-icon"><FiTrendingUp /></div>
            <h3>Strict 48h SLA Escalation</h3>
            <p>No more forgotten complaints. Grievances unresolved for 48 hours are automatically escalated from City to State authorities.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="landing-footer">
        <h2>Ready to transform your city?</h2>
        <p>Join the open governance revolution today.</p>
        <button className="btn btn-primary btn-lg mt-4" onClick={() => navigate('/signup')}>
          Create Citizen Account
        </button>
      </footer>
    </div>
  );
}
