import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  FiMapPin, FiShield, FiCheckCircle, FiClock, FiAlertTriangle, 
  FiRefreshCw, FiSliders, FiCheck, FiX, FiLayers
} from 'react-icons/fi';
import dataService from '../services/dataService';
import { getStatusBadge, getSeverityColor, timeAgo, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';
import VisualRoutingFlow from '../components/VisualRoutingFlow';
import { ALL_DEPARTMENTS } from '../constants';

export default function CityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Noida Authority');
  const [activeOverrideId, setActiveOverrideId] = useState(null);
  
  // Override Form States
  const [overrideDept, setOverrideDept] = useState('');
  const [overrideCity, setOverrideCity] = useState('');
  const [overrideState, setOverrideState] = useState('');

  // Details Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    setLoading(true);
    try {
      const res = await dataService.getComplaints();
      setComplaints(res.complaints || res || []);
    } catch (err) {
      toast.error('Failed to load complaints data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate statistics for each authority
  const getAuthorityStats = (cityAuth) => {
    const cityComplaints = complaints.filter(c => c.assignedCityAuthority === cityAuth);
    const total = cityComplaints.length;
    const resolved = cityComplaints.filter(c => c.status === 'Resolved').length;
    const pending = total - resolved;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    const critical = cityComplaints.filter(c => c.priority === 'critical' || c.escalated).length;
    
    return { total, resolved, pending, rate, critical };
  };

  const authorities = [
    { name: 'Noida Authority', state: 'UP State Authority', stats: getAuthorityStats('Noida Authority'), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
    { name: 'Lucknow Municipal Authority', state: 'UP State Authority', stats: getAuthorityStats('Lucknow Municipal Authority'), color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
    { name: 'Delhi Municipal Authority', state: 'Delhi State Authority', stats: getAuthorityStats('Delhi Municipal Authority'), color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' }
  ];

  // Specific city statistics for graphs
  const activeCityComplaints = complaints.filter(c => c.assignedCityAuthority === selectedCity);
  
  // Group by department
  const deptCounts = {};
  activeCityComplaints.forEach(c => {
    const dept = c.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  const doughnutData = {
    labels: Object.keys(deptCounts).length > 0 ? Object.keys(deptCounts) : ['Sanitation', 'Jal Board', 'Electricity Board'],
    datasets: [{
      data: Object.keys(deptCounts).length > 0 ? Object.values(deptCounts) : [5, 4, 3],
      backgroundColor: ['#6366f1', '#06b6d4', '#a855f7', '#fbbf24', '#ef4444', '#10b981'],
      borderWidth: 0,
      cutout: '70%'
    }]
  };

  const barData = {
    labels: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
    datasets: [{
      label: 'Volume',
      data: [
        activeCityComplaints.filter(c => c.status === 'Submitted').length,
        activeCityComplaints.filter(c => c.status === 'Under Review').length,
        activeCityComplaints.filter(c => c.status === 'In Progress').length,
        activeCityComplaints.filter(c => c.status === 'Resolved').length,
        activeCityComplaints.filter(c => c.status === 'Rejected').length
      ],
      backgroundColor: ['#6366f1', '#06b6d4', '#fbbf24', '#22c55e', '#ef4444'],
      borderRadius: 6
    }]
  };

  const handleStartOverride = (c, e) => {
    e.stopPropagation();
    setActiveOverrideId(c._id);
    setOverrideDept(c.department || '');
    setOverrideCity(c.assignedCityAuthority || '');
    setOverrideState(c.assignedStateAuthority || '');
  };

  const handleCancelOverride = (e) => {
    e.stopPropagation();
    setActiveOverrideId(null);
  };

  const handleSaveOverride = async (id, e) => {
    e.stopPropagation();
    
    // Find matching department details to update associated fields
    const newDeptDetails = ALL_DEPARTMENTS.find(d => d.name === overrideDept);

    try {
      // Direct local state update to simulate instant feedback in Mock Mode
      setComplaints(prev => prev.map(c => {
        if (c._id === id) {
          return {
            ...c,
            department: overrideDept,
            departmentId: newDeptDetails?.id || c.departmentId,
            assignedOfficer: newDeptDetails?.head || c.assignedOfficer,
            departmentContact: `${newDeptDetails?.phone || ''} | ${newDeptDetails?.contact || ''}`,
            assignedCityAuthority: overrideCity,
            assignedStateAuthority: overrideState,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));

      // In a real database, we would perform an administrative PATCH to override authority
      toast.success('Jurisdiction Override Successful!');
      setActiveOverrideId(null);
    } catch (err) {
      toast.error('Override failed');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>City Jurisdiction Triage</h1>
            <p>Administer, compare, and override city-level routing and department assignments</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadComplaints}>
            <FiRefreshCw size={14} /> Triage Sync
          </button>
        </div>
      </div>

      {/* Grid of Authorities */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {authorities.map(auth => (
          <motion.div
            key={auth.name}
            className="glass-card"
            style={{
              padding: '1.5rem',
              borderLeft: `4px solid ${auth.color}`,
              cursor: 'pointer',
              background: selectedCity === auth.name ? 'rgba(255,255,255,0.03)' : 'var(--bg-glass)',
              borderColor: selectedCity === auth.name ? 'var(--border-glow)' : 'var(--border-subtle)'
            }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedCity(auth.name)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{auth.name}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{auth.state}</span>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: auth.bg, color: auth.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiMapPin />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{auth.stats.total}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolution Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: auth.stats.rate > 70 ? '#22c55e' : '#fbbf24' }}>
                  {auth.stats.rate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--warning-400)' }}>{auth.stats.pending}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SLA Breaches</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: auth.stats.critical > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {auth.stats.critical}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected City Insight & Triage List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Insight Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiLayers style={{ color: 'var(--primary-400)' }} />
              {selectedCity} Load
            </h3>
            
            <div style={{ height: 180, position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Doughnut 
                data={doughnutData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 9 } } } }
                }} 
              />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>SLA Performance</h3>
            <div style={{ height: 160, position: 'relative' }}>
              <Bar 
                data={barData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    x: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { display: false } },
                    y: { ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Right Active Triage List */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Active Routing Desk</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Showing complaints routed to <strong>{selectedCity}</strong></p>
            </div>
            <span className="badge badge-primary">{activeCityComplaints.length} Active</span>
          </div>

          {activeCityComplaints.length === 0 ? (
            <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active complaints listed for this jurisdiction. All triaged!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {activeCityComplaints.map(c => {
                const isOverriding = activeOverrideId === c._id;
                
                return (
                  <div
                    key={c._id}
                    className="glass-card"
                    style={{ 
                      padding: '1rem', 
                      background: 'rgba(255, 255, 255, 0.01)',
                      borderColor: isOverriding ? 'var(--border-glow)' : 'var(--border-subtle)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedComplaint(c)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title}</span>
                          <span className={`badge ${getStatusBadge(c.status)}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>{c.status}</span>
                          {c.escalated && (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>Escalated</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                          {truncate(c.description, 100)}
                        </p>
                        
                        {/* Live Routing Tags */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.72rem', alignItems: 'center' }}>
                          <span style={{ color: 'var(--primary-300)', background: 'rgba(99,102,241,0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.1)' }}>
                            🏛️ {c.department}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>➔</span>
                          <span style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.1)' }}>
                            📍 {c.assignedCityAuthority}
                          </span>
                        </div>
                      </div>

                      {/* Manual Triage Override trigger */}
                      {!isOverriding ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto' }}
                          onClick={(e) => handleStartOverride(c, e)}
                        >
                          <FiSliders size={12} /> Override Route
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ background: '#22c55e', padding: '0.35rem 0.5rem', minWidth: 'auto', height: 'auto' }}
                            onClick={(e) => handleSaveOverride(c._id, e)}
                          >
                            <FiCheck size={12} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ background: '#ef4444', padding: '0.35rem 0.5rem', minWidth: 'auto', height: 'auto' }}
                            onClick={handleCancelOverride}
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Override inputs panel */}
                    {isOverriding && (
                      <div 
                        style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px dashed var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}
                        onClick={e => e.stopPropagation()} // Stop modal triggers
                      >
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Override Department</label>
                          <select 
                            className="form-input" 
                            value={overrideDept} 
                            onChange={e => setOverrideDept(e.target.value)}
                            style={{ padding: '0.25rem', fontSize: '0.75rem', height: 'auto' }}
                          >
                            {ALL_DEPARTMENTS.map(d => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Override City Auth</label>
                          <select 
                            className="form-input" 
                            value={overrideCity} 
                            onChange={e => setOverrideCity(e.target.value)}
                            style={{ padding: '0.25rem', fontSize: '0.75rem', height: 'auto' }}
                          >
                            <option value="Noida Authority">Noida Authority</option>
                            <option value="Lucknow Municipal Authority">Lucknow Municipal Authority</option>
                            <option value="Delhi Municipal Authority">Delhi Municipal Authority</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Override State Auth</label>
                          <select 
                            className="form-input" 
                            value={overrideState} 
                            onChange={e => setOverrideState(e.target.value)}
                            style={{ padding: '0.25rem', fontSize: '0.75rem', height: 'auto' }}
                          >
                            <option value="UP State Authority">UP State Authority</option>
                            <option value="Delhi State Authority">Delhi State Authority</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details drawer modal identical style */}
      <AnimatePresence>
        {selectedComplaint && !activeOverrideId && (
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
                  <span className={`badge ${getStatusBadge(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
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
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jurisdiction</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-300)' }}>{selectedComplaint.assignedCityAuthority}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>State Authority</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-300)' }}>{selectedComplaint.assignedStateAuthority}</span>
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
    </div>
  );
}
