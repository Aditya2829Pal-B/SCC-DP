import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import {
  FiFileText, FiCheckCircle, FiClock, FiAlertTriangle, FiTrendingUp,
  FiActivity, FiMap, FiUsers, FiRefreshCw, FiArrowUp, FiArrowDown,
  FiZap
} from 'react-icons/fi';
import dataService from '../services/dataService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(new Date());

  useEffect(() => {
    dataService.getAnalytics().then(d => { setStats(d); setLoading(false); });
    // Simulate live updates
    const interval = setInterval(() => setLiveUpdate(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ padding: '2rem' }}>
      <div className="grid-4">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: '1rem' }} />)}</div>
    </div>
  );

  const resolutionRate = Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100);

  const statCards = [
    { icon: FiFileText, label: 'Total Complaints', value: stats.totalComplaints, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', change: '+12%', up: true },
    { icon: FiCheckCircle, label: 'Resolved', value: stats.resolvedComplaints, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', change: '+8%', up: true },
    { icon: FiClock, label: 'Pending', value: stats.pendingComplaints, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', change: '-3%', up: false },
    { icon: FiActivity, label: 'Avg Resolution', value: stats.avgResolutionTime, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', change: '-15%', up: false },
  ];

  const trendData = {
    labels: (stats.complaintTrend || []).map(t => t.month),
    datasets: [
      {
        label: 'Complaints', data: (stats.complaintTrend || []).map(t => t.count),
        borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#6366f1',
        borderWidth: 2,
      },
      {
        label: 'Resolved', data: (stats.complaintTrend || []).map(t => t.resolved),
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)',
        fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#22c55e',
        borderWidth: 2,
      },
    ],
  };

  const categoryData = {
    labels: Object.keys(stats.complaintsByCategory || {}),
    datasets: [{
      label: 'Complaints',
      data: Object.values(stats.complaintsByCategory || {}),
      backgroundColor: ['#6366f1','#06b6d4','#22c55e','#f59e0b','#ef4444','#a855f7','#ec4899','#14b8a6'],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const riskDoughnut = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [
        (stats.riskDistribution || {}).high || 0, 
        (stats.riskDistribution || {}).medium || 0, 
        (stats.riskDistribution || {}).low || 0
      ],
      backgroundColor: ['rgba(239,68,68,0.8)','rgba(245,158,11,0.8)','rgba(34,197,94,0.8)'],
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  // Radar chart for category severity
  const radarData = {
    labels: Object.keys(stats.complaintsByCategory || {}).slice(0, 6),
    datasets: [{
      label: 'Volume',
      data: Object.values(stats.complaintsByCategory || {}).slice(0, 6),
      backgroundColor: 'rgba(99,102,241,0.15)',
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }, {
      label: 'Severity Index',
      data: Object.values(stats.complaintsByCategory || {}).slice(0, 6).map(v => Math.round(v * (0.5 + Math.random() * 0.8))),
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderColor: '#ef4444',
      borderWidth: 2,
      pointBackgroundColor: '#ef4444',
      pointRadius: 4,
    }],
  };

  // Live activity feed
  const activities = [
    { action: 'Complaint resolved', detail: '#1245 — Road Damage in Sector 26', time: '2 min ago', type: 'success' },
    { action: 'New complaint filed', detail: '#1248 — Water Supply disruption', time: '5 min ago', type: 'info' },
    { action: 'Alert triggered', detail: 'Flash Flood Warning — North Delhi', time: '8 min ago', type: 'danger' },
    { action: 'Status updated', detail: '#1241 — Moved to In Progress', time: '12 min ago', type: 'warning' },
    { action: 'Risk score updated', detail: 'Yamuna Flood Zone — 87% risk', time: '15 min ago', type: 'danger' },
    { action: 'Complaint assigned', detail: '#1246 — Assigned to Zone Officer', time: '20 min ago', type: 'info' },
    { action: 'ML model retrained', detail: 'NLP classifier accuracy: 94.2%', time: '25 min ago', type: 'success' },
  ];

  const activityColors = { success: '#22c55e', info: '#6366f1', danger: '#ef4444', warning: '#f59e0b' };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } }, tooltip: { backgroundColor: '#111127', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1 } },
    scales: { x: { grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } }, y: { grid: { color: 'rgba(99,102,241,0.06)' }, ticks: { color: '#64748b', font: { size: 10 } } } },
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>System-wide analytics and monitoring</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              fontSize: '0.6875rem', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              Live
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); dataService.getAnalytics().then(d => { setStats(d); setLoading(false); }); }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards with Trends */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                <card.icon size={20} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.6875rem', fontWeight: 600,
                color: card.up ? '#22c55e' : '#ef4444',
                padding: '2px 6px', borderRadius: '9999px',
                background: card.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              }}>
                {card.up ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
                {card.change}
              </div>
            </div>
            <div className="stat-value">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</div>
            <div className="stat-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Trends + Resolution Ring + Risk */}
      <div className="grid-3-col" style={{ marginBottom: '1.5rem' }}>
        {/* Monthly Trends */}
        <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <FiTrendingUp style={{ color: 'var(--primary-400)' }} /> Monthly Trends
          </h3>
          <div style={{ height: 260 }}><Line data={trendData} options={chartOpts} /></div>
        </motion.div>

        {/* Resolution Rate Ring */}
        <motion.div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '0.9375rem', textAlign: 'center' }}>
            Resolution Rate
          </h3>
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="56" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="12" />
              <motion.circle
                cx="70" cy="70" r="56" fill="none"
                stroke="url(#gradientRes)" strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${resolutionRate * 3.52} ${352 - resolutionRate * 3.52}`}
                initial={{ strokeDasharray: '0 352' }}
                animate={{ strokeDasharray: `${resolutionRate * 3.52} ${352 - resolutionRate * 3.52}` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradientRes" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {resolutionRate}%
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Resolved
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span><strong style={{ color: '#22c55e' }}>{stats.resolvedComplaints}</strong> done</span>
            <span><strong style={{ color: '#f59e0b' }}>{stats.pendingComplaints}</strong> pending</span>
          </div>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
            <FiMap style={{ color: 'var(--danger-400)' }} /> Risk Distribution
          </h3>
          <div style={{ height: 180, width: 180 }}>
            <Doughnut data={riskDoughnut} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 12 } } },
            }} />
          </div>
        </motion.div>
      </div>

      {/* Row 3: Category Bar + Radar + Activity Feed */}
      <div className="grid-3-even">
        {/* Category Distribution */}
        <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
            <FiAlertTriangle style={{ color: 'var(--warning-400)' }} /> By Category
          </h3>
          <div style={{ height: 260 }}>
            <Bar data={categoryData} options={{
              ...chartOpts,
              indexAxis: 'y',
              plugins: { ...chartOpts.plugins, legend: { display: false } },
            }} />
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
            <FiZap style={{ color: '#a855f7' }} /> Severity Analysis
          </h3>
          <div style={{ height: 260 }}>
            <Radar data={radarData} options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                r: {
                  grid: { color: 'rgba(99,102,241,0.1)' },
                  pointLabels: { color: '#94a3b8', font: { size: 9 } },
                  ticks: { display: false },
                  angleLines: { color: 'rgba(99,102,241,0.08)' },
                },
              },
              plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } },
            }} />
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div className="glass-card" style={{ padding: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
            <FiActivity style={{ color: '#06b6d4' }} /> Live Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 260, overflowY: 'auto' }}>
            {activities.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.05 }}
                style={{
                  display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
                  padding: '0.5rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                  background: activityColors[act.type],
                  boxShadow: `0 0 8px ${activityColors[act.type]}40`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {act.action}
                  </div>
                  <div style={{
                    fontSize: '0.6875rem', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {act.detail}
                  </div>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {act.time}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
