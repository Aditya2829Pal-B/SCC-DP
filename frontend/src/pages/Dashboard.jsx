import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  FiFileText, FiAlertTriangle, FiCheckCircle, FiClock, FiTrendingUp,
  FiShield, FiMapPin, FiActivity
} from 'react-icons/fi';
import dataService from '../services/dataService';
import { getRiskLevel, timeAgo } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
  })
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [analyticsRes, predRes, riskRes, alertRes] = await Promise.all([
        dataService.getAnalytics(user?._id),
        dataService.getPredictions(),
        dataService.getUserRisk(user?._id),
        dataService.getAlerts(user?._id),
      ]);
      setStats(analyticsRes);
      setPredictions(predRes.predictions);
      setRiskData(riskRes);
      setAlerts(alertRes.alerts.slice(0, 3));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="grid-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: '1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  const riskLevel = riskData ? getRiskLevel(riskData.riskScore) : { level: 'low', label: 'Low', color: '#22c55e' };

  // Chart data for complaint trend
  const trendChartData = {
    labels: stats?.complaintTrend?.map(t => t.month) || [],
    datasets: [
      {
        label: 'Complaints',
        data: stats?.complaintTrend?.map(t => t.count) || [],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Resolved',
        data: stats?.complaintTrend?.map(t => t.resolved) || [],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22c55e',
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter' } } },
      tooltip: { backgroundColor: '#111127', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1 },
    },
    scales: {
      x: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#64748b' } },
    },
  };

  // Doughnut for risk distribution
  const riskDoughnutData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [stats?.riskDistribution?.high || 0, stats?.riskDistribution?.medium || 0, stats?.riskDistribution?.low || 0],
      backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
      borderColor: ['rgba(239,68,68,0.3)', 'rgba(245,158,11,0.3)', 'rgba(34,197,94,0.3)'],
      borderWidth: 2,
    }],
  };

  const statCards = [
    { icon: FiFileText, label: 'Total Complaints', value: stats?.totalComplaints || 0, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { icon: FiCheckCircle, label: 'Resolved', value: stats?.resolvedComplaints || 0, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { icon: FiClock, label: 'Pending', value: stats?.pendingComplaints || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { icon: FiAlertTriangle, label: 'Active Alerts', value: alerts.filter(a => !a.read).length, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p>Here's your Smart City overview for today</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="stat-card"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-value">{card.value.toLocaleString()}</div>
            <div className="stat-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Row: Chart + Risk Score ── */}
      <div className="grid-layout-main" style={{ marginBottom: '2rem' }}>
        {/* Trend Chart */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiTrendingUp style={{ color: 'var(--primary-400)' }} />
            Complaint Trends
          </h3>
          <div style={{ height: 280 }}>
            <Line data={trendChartData} options={trendChartOptions} />
          </div>
        </motion.div>

        {/* Personal Risk Score */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiShield style={{ color: riskLevel.color }} />
            Your Risk Score
          </h3>

          <div
            className={`risk-gauge ${riskLevel.level}`}
            style={{ '--progress': `${(riskData?.riskScore || 0) * 100}%`, marginBottom: '1rem' }}
          >
            <div className="gauge-inner">
              <span className="gauge-value" style={{ color: riskLevel.color }}>
                {Math.round((riskData?.riskScore || 0) * 100)}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          <span className="badge" style={{
            background: `${riskLevel.color}22`,
            color: riskLevel.color,
            fontSize: '0.8125rem',
            padding: '0.375rem 1rem',
          }}>
            {riskLevel.label}
          </span>

          <div style={{ marginTop: '1rem', width: '100%', fontSize: '0.75rem' }}>
            {riskData?.breakdown && Object.entries(riskData.breakdown).map(([key, val]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.375rem 0',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}>
                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(val * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Row: Predictions + Alerts ── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Disaster Predictions */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiActivity style={{ color: 'var(--warning-400)' }} />
            Disaster Predictions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(predictions || []).map((pred, i) => {
              const pctColor = pred.probability >= 0.7 ? '#ef4444' : pred.probability >= 0.4 ? '#f59e0b' : '#22c55e';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem', borderRadius: '0.625rem',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pred.type}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pred.timeframe}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: pctColor }}>
                      {(pred.probability * 100).toFixed(0)}%
                    </div>
                    <div style={{
                      fontSize: '0.6875rem',
                      color: pred.trend === 'increasing' ? '#ef4444' : pred.trend === 'decreasing' ? '#22c55e' : '#f59e0b',
                    }}>
                      ● {pred.trend}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiAlertTriangle style={{ color: 'var(--danger-400)' }} />
            Recent Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alerts.map(alert => (
              <div key={alert.id} className={`notification-item ${alert.severity}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiMapPin size={12} /> {alert.location} · {timeAgo(alert.timestamp)}
                    </div>
                  </div>
                  {!alert.read && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--primary-500)', flexShrink: 0, marginTop: '0.25rem',
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Recommendations ── */}
      {riskData?.recommendations && (
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiShield style={{ color: 'var(--accent-400)' }} />
            Safety Recommendations
          </h3>
          <div className="grid-2">
            {riskData.recommendations.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.875rem', borderRadius: '0.625rem',
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.1)',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-400)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
