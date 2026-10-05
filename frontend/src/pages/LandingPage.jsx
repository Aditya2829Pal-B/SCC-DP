import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { FiArrowRight, FiShield, FiActivity, FiMap, FiCpu, FiTrendingUp, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

// 3D Floating Element Component
function FloatingElement({ children, delay = 0, yOffset = 20, rotate = 10 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, type: 'spring', stiffness: 50 }}
      style={{ display: 'inline-block' }}
    >
      <motion.div
        animate={{ y: [0, yOffset, 0], rotateZ: [0, rotate, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Intense 3D Card
function Super3DTiltCard({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);
  const brightness = useTransform(mouseYSpring, [-0.5, 0.5], [1.3, 0.7]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1500,
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          filter: `brightness(${brightness})`,
          transformStyle: "preserve-3d",
          width: "100%"
        }}
        className="tilt-wrapper"
      >
        <div style={{ transform: "translateZ(80px)", width: "100%", position: 'relative' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Background Animated Grid
function BackgroundGrid() {
  return (
    <div className="bg-grid-container">
      <div className="bg-grid-fade"></div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const countRef = useRef(null);
  
  useEffect(() => {
    const controls = animate(0, 95, {
      duration: 2,
      onUpdate(value) {
        if(countRef.current) countRef.current.textContent = value.toFixed(0) + '%';
      }
    });
    return () => controls.stop();
  }, []);

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="landing-page-v2">
      <BackgroundGrid />
      
      {/* Premium Glass Navbar */}
      <nav className="glass-nav">
        <div className="nav-logo">
          <div className="logo-orb"></div>
          <span>SCC&DP.AI</span>
        </div>
        <div className="nav-actions">
          {user ? (
            <button className="btn-glow" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button className="btn-glow" onClick={() => navigate('/signup')}>
                Start for Free
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="hero-v2">
        <div className="hero-v2-content">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className="hero-v2-text"
          >
            <div className="pill-badge">
              <span className="pill-dot"></span> Next-Gen Civic OS
            </div>
            
            <h1 className="hero-title-v2">
              Predicting Disasters.<br/>
              <span className="text-gradient-mesh">Fixing Cities.</span>
            </h1>
            
            <p className="hero-subtitle-v2">
              An award-winning platform leveraging Zero-Shot NLP and LSTM neural networks to route citizen grievances in milliseconds and forecast urban disasters before they strike.
            </p>
            
            <div className="hero-cta-v2">
              <button className="btn-magnetic" onClick={handleCTA}>
                <span className="btn-text">{user ? 'Launch OS' : 'Report an Issue'}</span>
                <FiArrowRight className="btn-icon-right"/>
              </button>
            </div>
          </motion.div>
          
          <div className="hero-v2-visual">
            <Super3DTiltCard>
              <div className="dashboard-mockup-3d">
                <div className="mockup-glass-top">
                  <div className="mockup-controls"><span></span><span></span><span></span></div>
                  <div className="mockup-url">sccdp.dev / analytics</div>
                </div>
                
                <div className="mockup-inner-grid">
                  <div className="mockup-chart-box">
                    <div className="mockup-line-animated w-100"></div>
                    <div className="mockup-line-animated w-75 delay-1"></div>
                    <div className="mockup-line-animated w-50 delay-2"></div>
                  </div>
                  <div className="mockup-map-box">
                    <div className="radar-sweep"></div>
                    <FloatingElement delay={0} yOffset={-10} rotate={5}>
                      <div className="map-pin alert">
                        <FiAlertTriangle />
                      </div>
                    </FloatingElement>
                    <FloatingElement delay={0.5} yOffset={15} rotate={-10}>
                      <div className="map-pin success" style={{left: '60%', top: '60%'}}>
                        <FiCheckCircle />
                      </div>
                    </FloatingElement>
                  </div>
                </div>
              </div>
            </Super3DTiltCard>
          </div>
        </div>
      </main>

      <section className="metrics-v2">
        <div className="metric-box glass-panel">
          <h2 className="metric-value" ref={countRef}>0%</h2>
          <p className="metric-label">NLP Classification</p>
        </div>
        <div className="metric-box glass-panel">
          <h2 className="metric-value">&lt;2s</h2>
          <p className="metric-label">Routing Latency</p>
        </div>
        <div className="metric-box glass-panel">
          <h2 className="metric-value">48h</h2>
          <p className="metric-label">SLA Enforcement</p>
        </div>
      </section>
      
      {/* High-end Feature Grid */}
      <section className="bento-grid-section">
        <div className="bento-header">
          <h2>The modern standard for <br/><span className="text-gradient-mesh">civic infrastructure.</span></h2>
        </div>
        
        <div className="bento-grid">
          <motion.div className="bento-item glass-panel tall" whileHover={{ scale: 0.98 }}>
            <div className="bento-icon"><FiCpu /></div>
            <h3>Zero-Shot NLP Routing</h3>
            <p>Our mDeBERTa model instantly reads complaints in 9+ languages and routes them without human intervention.</p>
          </motion.div>
          
          <motion.div className="bento-item glass-panel wide" whileHover={{ scale: 0.98 }}>
            <div className="bento-icon"><FiGlobe /></div>
            <h3>DBSCAN Heatmaps</h3>
            <p>Real-time spatial clustering identifies infrastructure failure hotspots over beautiful dark-mode cartography.</p>
          </motion.div>

          <motion.div className="bento-item glass-panel" whileHover={{ scale: 0.98 }}>
            <div className="bento-icon"><FiActivity /></div>
            <h3>LSTM Forecast</h3>
            <p>Predictive models forecast floods and heatwaves.</p>
          </motion.div>
          
          <motion.div className="bento-item glass-panel" whileHover={{ scale: 0.98 }}>
            <div className="bento-icon"><FiTrendingUp /></div>
            <h3>SLA Tracking</h3>
            <p>Automatic state-level escalations after 48h.</p>
          </motion.div>
        </div>
      </section>

      <footer className="footer-v2">
        <p>Built for the scale of modern mega-cities.</p>
      </footer>
    </div>
  );
}
