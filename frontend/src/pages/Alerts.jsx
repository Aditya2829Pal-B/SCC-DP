import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiBell, FiAlertTriangle, FiDroplet, FiSun, FiWind, FiNavigation, FiShield, FiCheckCircle, FiClock } from 'react-icons/fi';
import dataService from '../services/dataService';
import { timeAgo, getRiskLevel } from '../utils/helpers';
import toast from 'react-hot-toast';

const alertIcons = { flood: FiDroplet, heatwave: FiSun, water: FiDroplet, pollution: FiWind, infrastructure: FiNavigation, earthquake: FiAlertTriangle, default: FiBell };

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [alertRes, riskRes] = await Promise.all([dataService.getAlerts(user?._id), dataService.getUserRisk(user?._id)]);
      setAlerts(alertRes.alerts);
      setRiskData(riskRes);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const markAsRead = async (id) => {
    try {
      await dataService.markNotificationRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };
  const filteredAlerts = alerts.filter(a => { if (filter === 'unread') return !a.read; if (filter !== 'all') return a.severity === filter; return true; });
  const riskLevel = riskData ? getRiskLevel(riskData.riskScore) : null;
  const sevColors = { high: { bg: 'rgba(239,68,68,0.08)', border: '#ef4444' }, medium: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b' }, low: { bg: 'rgba(34,197,94,0.08)', border: '#22c55e' } };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>Alerts & Notifications</h1><p>Personalized alerts based on your location and risk profile</p></div>
      <div className="grid-sidebar">
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['all', 'unread', 'high', 'medium', 'low'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
                {f === 'unread' ? `Unread (${alerts.filter(a => !a.read).length})` : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: '1rem' }} />)}</div>
          : filteredAlerts.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success-400)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>All Clear!</h3>
              <p>No active alerts matching your current filter. Your area is currently safe.</p>
            </div>
          )
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredAlerts.map((alert, i) => { const Ic = alertIcons[alert.type] || alertIcons.default; const sc = sevColors[alert.severity] || sevColors.medium; return (
              <motion.div key={alert.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${sc.border}`, opacity: alert.read ? 0.7 : 1 }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: alert.read ? 0.7 : 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: sc.bg, color: sc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{alert.title}</h4>{!alert.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)' }} />}</div>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>{alert.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span><FiClock size={12} /> {timeAgo(alert.timestamp)}</span><span><FiNavigation size={12} /> {alert.location}</span>
                      {!alert.read && <button onClick={() => markAsRead(alert.id)} style={{ fontSize: '0.75rem', color: 'var(--primary-400)', cursor: 'pointer', background: 'none', border: 'none' }}>Mark read</button>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ); })}
          </div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {riskData && riskLevel && <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiShield style={{ color: riskLevel.color }} /> Risk Profile</h4>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div className={`risk-gauge ${riskLevel.level}`} style={{ '--progress': `${riskData.riskScore * 100}%` }}><div className="gauge-inner"><span className="gauge-value" style={{ color: riskLevel.color, fontSize: '1.5rem' }}>{Math.round(riskData.riskScore * 100)}</span><span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Risk</span></div></div>
            </div>
            <div style={{ textAlign: 'center' }}><span className="badge" style={{ background: `${riskLevel.color}22`, color: riskLevel.color, padding: '0.375rem 1rem' }}>{riskLevel.label}</span></div>
          </motion.div>}
          {riskData?.safeRoutes && <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiNavigation style={{ color: 'var(--accent-400)' }} /> Safe Routes</h4>
            {riskData.safeRoutes.map((r, i) => <div key={i} style={{ padding: '0.875rem', borderRadius: '0.625rem', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.1)', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{r.name}</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}><span>{r.distance}</span><span>{r.estimatedTime}</span><span className={`badge badge-${r.safety === 'high' ? 'success' : 'warning'}`} style={{ fontSize: '0.625rem' }}>{r.safety}</span></div>
            </div>)}
          </motion.div>}
          {riskData?.recommendations && <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h4 style={{ marginBottom: '1rem' }}><FiShield style={{ color: 'var(--success-400)' }} /> Safety Tips</h4>
            {riskData.recommendations.slice(0, 3).map((rec, i) => <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.25rem' }}><span style={{ color: 'var(--success-400)' }}>•</span>{rec}</div>)}
          </motion.div>}
        </div>
      </div>
    </div>
  );
}
