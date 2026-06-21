import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Doughnut, Radar } from 'react-chartjs-2';
import {
  FiGlobe, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiClock,
  FiRefreshCw, FiMapPin, FiX, FiThermometer, FiWind, FiTrendingUp
} from 'react-icons/fi';
import dataService from '../services/dataService';
import { getStatusBadge, getSeverityColor, formatDate, timeAgo, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';
import VisualRoutingFlow from '../components/VisualRoutingFlow';

export default function StateDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('UP State Authority');
  
  // Details Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const compRes = await dataService.getComplaints();
      setComplaints(compRes.complaints || compRes || []);
      
      const alertRes = await dataService.getAlerts();
      setAlerts(alertRes.alerts || alertRes || []);
    } catch (err) {
      toast.error('Failed to sync state administration databases');
    } finally {
      setLoading(false);
    }
  }

  // SLA calculations
  const totalStateLevel = complaints.filter(c => c.adminLevel === 'state' || c.escalated);
  const escalatedComplaints = complaints.filter(c => c.escalated);
  
  const upStateComplaints = complaints.filter(c => c.assignedStateAuthority === 'UP State Authority');
  const upEscalated = upStateComplaints.filter(c => c.escalated).length;
  const upResolved = upStateComplaints.filter(c => c.status === 'Resolved').length;
  
  const delhiStateComplaints = complaints.filter(c => c.assignedStateAuthority === 'Delhi State Authority');
  const delhiEscalated = delhiStateComplaints.filter(c => c.escalated).length;
  const delhiResolved = delhiStateComplaints.filter(c => c.status === 'Resolved').length;

  // Active hazard alerts (Flood, Heatwave, Pollution)
  const activeHazards = alerts.filter(a => a.severity === 'high');

  // Filter complaints based on the selected state tab
  const stateComplaintsList = complaints.filter(c => 
    c.assignedStateAuthority === selectedState && (c.adminLevel === 'state' || c.escalated)
  );

  const radarData = {
    labels: ['Flood Risk', 'Grid Loading', 'Sanitation SLA', 'Water Supply', 'Air Quality', 'Fire Response'],
    datasets: [
      {
        label: 'UP State Authority',
        data: [78, 65, 82, 70, 58, 75],
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        borderColor: '#a855f7',
        borderWidth: 2,
        pointBackgroundColor: '#a855f7'
      },
      {
        label: 'Delhi State Authority',
        data: [60, 85, 74, 90, 88, 80],
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4'
      }
    ]
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>State Oversight Dashboard</h1>
            <p>Monitor critical SLA breaches, high-severity alerts, and cross-municipal escalations</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <FiRefreshCw size={14} /> State Sync
          </button>
        </div>
      </div>

      {/* Critical SLA Alarm Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Escalated Pulse Card */}
        <motion.div
          className="glass-card"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(17, 17, 39, 0.7))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}
          animate={{ borderColor: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.6)', 'rgba(239, 68, 68, 0.3)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
          }}>
            <FiAlertTriangle style={{ animation: 'pulse 1.5s infinite' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CRITICAL BREACH ALARM
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f1f5f9', margin: '0.2rem 0' }}>
              {escalatedComplaints.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Complaints unresolved &gt; 48 hours escalated to State Oversight
            </div>
          </div>
        </motion.div>

        {/* State Comparison Card A */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>UP State Authority</h3>
            <span style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 600 }}>OVERSIGHT ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{upStateComplaints.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>total incidents</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#ef4444' }}>🚨 {upEscalated} Escalated</span>
            <span style={{ color: '#22c55e' }}>✓ {upResolved} Resolved</span>
          </div>
        </div>

        {/* State Comparison Card B */}
        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>Delhi State Authority</h3>
            <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 600 }}>OVERSIGHT ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{delhiStateComplaints.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>total incidents</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#ef4444' }}>🚨 {delhiEscalated} Escalated</span>
            <span style={{ color: '#22c55e' }}>✓ {delhiResolved} Resolved</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Radar & Hazard Alerts, Right Escalations Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }}>
        
        {/* Left Column: Alerts & Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* State Risk Metrics Radar */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTrendingUp style={{ color: 'var(--primary-400)' }} /> State Stress Index
            </h3>
            <div style={{ height: 220, position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Radar 
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 9 } } } },
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(255,255,255,0.05)' },
                      grid: { color: 'rgba(255,255,255,0.05)' },
                      pointLabels: { color: '#64748b', font: { size: 8 } },
                      ticks: { display: false }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Active State Hazard Alerts Panel */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiThermometer style={{ color: '#ef4444' }} /> State Hazard Advisory
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeHazards.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No critical weather or environmental hazard advisories active.
                </div>
              ) : (
                activeHazards.map(advisory => (
                  <div
                    key={advisory.id}
                    className="glass-card"
                    style={{
                      padding: '0.875rem',
                      background: 'rgba(239, 68, 68, 0.03)',
                      borderColor: 'rgba(239, 68, 68, 0.15)',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{
                      padding: '0.375rem', borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                      fontSize: '1rem', flexShrink: 0
                    }}>
                      <FiAlertTriangle />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{advisory.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.125rem 0 0.375rem', lineHeight: 1.3 }}>
                        {advisory.message}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        <span>📍 {advisory.location}</span>
                        <span>•</span>
                        <span>{timeAgo(advisory.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: State Incident Command Desk */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>State SLA Incident Command</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Triaging high-priority and breach-escalated cases</p>
            </div>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '0.5rem' }}>
              <button
                className={`btn btn-sm ${selectedState === 'UP State Authority' ? 'btn-primary' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', minWidth: 'auto' }}
                onClick={() => setSelectedState('UP State Authority')}
              >
                UP Oversight
              </button>
              <button
                className={`btn btn-sm ${selectedState === 'Delhi State Authority' ? 'btn-primary' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', minWidth: 'auto' }}
                onClick={() => setSelectedState('Delhi State Authority')}
              >
                Delhi Oversight
              </button>
            </div>
          </div>

          {stateComplaintsList.length === 0 ? (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ✓ All clear! No active SLA escalations pending in {selectedState}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {stateComplaintsList.map(c => (
                <div
                  key={c._id}
                  className="glass-card"
                  style={{
                    padding: '1rem',
                    background: c.escalated ? 'rgba(239, 68, 68, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                    borderColor: c.escalated ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedComplaint(c)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title}</span>
                        {c.escalated && (
                          <span className="badge badge-danger" style={{ fontSize: '0.625rem', padding: '1px 5px', fontWeight: 700 }}>
                            SLA BREACH
                          </span>
                        )}
                        <span className={`badge ${getStatusBadge(c.status)}`} style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                          {c.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                        {truncate(c.description, 120)}
                      </p>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--primary-300)' }}>🏛️ Dept: {c.department}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--text-accent)' }}>📍 Local: {c.assignedCityAuthority}</span>
                        <span>•</span>
                        <span>⏱️ Created: {timeAgo(c.createdAt)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 }}>
                      <span className="badge" style={{
                        background: getSeverityColor(c.priority).bg,
                        color: getSeverityColor(c.priority).color,
                        fontSize: '0.6875rem'
                      }}>{c.priority}</span>
                      {c.escalatedAt && (
                        <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 500 }}>
                          Escalated {timeAgo(c.escalatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details drawer modal standard style */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '2rem'
            }}
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card"
              style={{
                padding: '2rem', maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto',
                background: 'var(--bg-secondary)', borderColor: 'var(--border-light)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selectedComplaint.title}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge ${getStatusBadge(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
                    {selectedComplaint.escalated && (
                      <span className="badge badge-danger">SLA Escalated</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="btn btn-icon btn-secondary">
                  <FiX size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{selectedComplaint.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Oversight Agency</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>{selectedComplaint.assignedStateAuthority}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Local Municipality</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-300)' }}>{selectedComplaint.assignedCityAuthority}</span>
                  </div>
                </div>

                {selectedComplaint.location?.address && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Location</div>
                    <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <FiMapPin size={14} style={{ color: 'var(--primary-400)' }} />
                      {selectedComplaint.location.address}
                    </span>
                  </div>
                )}

                {/* Routing Flow Stepper */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Visual SLA Triage Route</div>
                  <VisualRoutingFlow complaint={selectedComplaint} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
