import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import {
  FiThermometer, FiFilter, FiRefreshCw, FiMaximize2, FiTrendingUp,
  FiAlertTriangle, FiMapPin, FiBarChart2
} from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import dataService from '../services/dataService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Generate heatmap grid data (simulated DBSCAN cluster output)
function generateHeatmapGrid() {
  const grid = [];
  const centerLat = 28.6139, centerLng = 77.2090;
  const spread = 0.15;

  // Hotspots with higher density
  const hotspots = [
    { lat: 28.68, lng: 77.24, intensity: 0.9, label: 'Yamuna Flood Zone' },
    { lat: 28.63, lng: 77.21, intensity: 0.7, label: 'Central Heat Zone' },
    { lat: 28.52, lng: 77.22, intensity: 0.8, label: 'South Water Crisis' },
    { lat: 28.54, lng: 77.39, intensity: 0.6, label: 'Industrial Pollution' },
    { lat: 28.46, lng: 77.03, intensity: 0.4, label: 'Waterlogging Area' },
    { lat: 28.70, lng: 77.11, intensity: 0.65, label: 'Rohini Electricity' },
    { lat: 28.57, lng: 77.31, intensity: 0.55, label: 'Noida Road Damage' },
  ];

  // Create grid cells
  for (let i = 0; i < 80; i++) {
    const baseLat = centerLat + (Math.random() - 0.5) * spread * 2.5;
    const baseLng = centerLng + (Math.random() - 0.5) * spread * 3;

    // Calculate intensity based on proximity to hotspots
    let maxIntensity = 0.05 + Math.random() * 0.15;
    for (const hs of hotspots) {
      const dist = Math.sqrt(Math.pow(baseLat - hs.lat, 2) + Math.pow(baseLng - hs.lng, 2));
      if (dist < 0.08) {
        maxIntensity = Math.max(maxIntensity, hs.intensity * (1 - dist / 0.08));
      }
    }

    grid.push({
      lat: baseLat,
      lng: baseLng,
      intensity: Math.min(1, maxIntensity),
      radius: 400 + Math.random() * 600,
    });
  }

  // Add hotspot centers
  for (const hs of hotspots) {
    grid.push({
      lat: hs.lat + (Math.random() - 0.5) * 0.01,
      lng: hs.lng + (Math.random() - 0.5) * 0.01,
      intensity: hs.intensity,
      radius: 800 + Math.random() * 400,
      label: hs.label,
    });
  }

  return { grid, hotspots };
}

function getHeatColor(intensity) {
  if (intensity >= 0.8) return { fill: 'rgba(239, 68, 68, 0.5)', stroke: 'rgba(239, 68, 68, 0.8)' };
  if (intensity >= 0.6) return { fill: 'rgba(249, 115, 22, 0.4)', stroke: 'rgba(249, 115, 22, 0.7)' };
  if (intensity >= 0.4) return { fill: 'rgba(245, 158, 11, 0.35)', stroke: 'rgba(245, 158, 11, 0.6)' };
  if (intensity >= 0.2) return { fill: 'rgba(234, 179, 8, 0.25)', stroke: 'rgba(234, 179, 8, 0.5)' };
  return { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'rgba(34, 197, 94, 0.3)' };
}

export default function AdminHeatmap() {
  const [heatData, setHeatData] = useState(null);
  const [riskZones, setRiskZones] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('risk');
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [zonesRes, compRes] = await Promise.all([
        dataService.getRiskZones(),
        dataService.getComplaintsGeo(),
      ]);
      setRiskZones(zonesRes.zones);
      setComplaints(compRes.complaints);
      setHeatData(generateHeatmapGrid());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = () => {
    setHeatData(generateHeatmapGrid());
  };

  // Zone statistics
  const zoneStats = useMemo(() => {
    return (riskZones || []).reduce((acc, z) => {
      acc[z.riskLevel] = (acc[z.riskLevel] || 0) + 1;
      return acc;
    }, {});
  }, [riskZones]);

  // Complaints by zone type
  const zoneTypeChart = useMemo(() => ({
    labels: (riskZones || []).map(z => z.name.split(' ').slice(0, 2).join(' ')),
    datasets: [{
      label: 'Risk Score (%)',
      data: (riskZones || []).map(z => Math.round(z.riskScore * 100)),
      backgroundColor: (riskZones || []).map(z =>
        z.riskLevel === 'high' ? 'rgba(239,68,68,0.7)' :
        z.riskLevel === 'medium' ? 'rgba(245,158,11,0.7)' : 'rgba(34,197,94,0.7)'
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }), [riskZones]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Risk Heatmap</h1>
            <p>Geo-spatial risk visualization powered by DBSCAN clustering</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
              <FiRefreshCw size={14} /> Refresh
            </button>
            <select
              className="form-input"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
            >
              <option value="risk">Risk Intensity</option>
              <option value="complaints">Complaint Density</option>
              <option value="disasters">Disaster Probability</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'High Risk Zones', value: zoneStats.high || 0, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: FiAlertTriangle },
          { label: 'Medium Risk Zones', value: zoneStats.medium || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: FiThermometer },
          { label: 'Low Risk Zones', value: zoneStats.low || 0, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: FiMapPin },
          { label: 'Total Complaints', value: complaints.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: FiBarChart2 },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="stat-value" style={{ fontSize: '1.75rem' }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid-sidebar">
        {/* Heatmap */}
        <motion.div
          className="glass-card"
          style={{ overflow: 'hidden', minHeight: 500 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {!loading && heatData && (
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={11}
              style={{ height: '100%', width: '100%', minHeight: 500 }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OSM'
              />

              {/* Heatmap grid cells */}
              {heatData.grid.map((cell, i) => {
                const colors = getHeatColor(cell.intensity);
                return (
                  <Circle
                    key={`heat_${i}`}
                    center={[cell.lat, cell.lng]}
                    radius={cell.radius}
                    pathOptions={{
                      color: colors.stroke,
                      fillColor: colors.fill,
                      fillOpacity: cell.intensity * 0.6,
                      weight: 1,
                      opacity: 0.5,
                    }}
                  >
                    {cell.label && (
                      <Popup>
                        <div style={{ fontFamily: 'Inter', minWidth: 150 }}>
                          <h4 style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', color: '#f1f5f9' }}>
                            {cell.label}
                          </h4>
                          <div style={{ fontSize: '0.8125rem' }}>
                            Risk Intensity: <strong style={{ color: getHeatColor(cell.intensity).stroke }}>
                              {(cell.intensity * 100).toFixed(0)}%
                            </strong>
                          </div>
                        </div>
                      </Popup>
                    )}
                  </Circle>
                );
              })}

              {/* Hotspot labels */}
              {showLabels && heatData.hotspots.map((hs, i) => (
                <CircleMarker
                  key={`label_${i}`}
                  center={[hs.lat, hs.lng]}
                  radius={8}
                  pathOptions={{
                    color: getHeatColor(hs.intensity).stroke,
                    fillColor: getHeatColor(hs.intensity).stroke,
                    fillOpacity: 0.9,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'Inter', minWidth: 180 }}>
                      <h4 style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', color: '#f1f5f9' }}>
                        {hs.label}
                      </h4>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        Intensity: <strong style={{ color: getHeatColor(hs.intensity).stroke }}>
                          {(hs.intensity * 100).toFixed(0)}%
                        </strong>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Complaint dots */}
              {complaints.slice(0, 15).map((c, i) => (
                <CircleMarker
                  key={`comp_${i}`}
                  center={[c.location.coordinates[1], c.location.coordinates[0]]}
                  radius={3}
                  pathOptions={{
                    color: '#818cf8',
                    fillColor: '#818cf8',
                    fillOpacity: 0.6,
                    weight: 1,
                  }}
                />
              ))}
            </MapContainer>
          )}
        </motion.div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiFilter style={{ color: 'var(--primary-400)' }} /> Controls
            </h4>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-500)' }}
              />
              <span style={{ fontSize: '0.875rem' }}>Show Hotspot Labels</span>
            </label>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', padding: '0.625rem', borderRadius: '0.5rem', background: 'rgba(99,102,241,0.06)' }}>
              <strong>Algorithm:</strong> DBSCAN Geo-Clustering<br />
              <strong>Metric:</strong> {selectedMetric === 'risk' ? 'Risk Intensity' : selectedMetric === 'complaints' ? 'Complaint Density' : 'Disaster Probability'}<br />
              <strong>Grid Cells:</strong> {heatData?.grid?.length || 0}
            </div>
          </motion.div>

          {/* Risk Zone Ranking */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiTrendingUp style={{ color: 'var(--danger-400)' }} /> Risk Ranking
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Array.isArray(riskZones) && [...riskZones].sort((a, b) => b.riskScore - a.riskScore).map((zone, i) => {
                const colors = getHeatColor(zone.riskScore);
                return (
                  <div key={zone.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: colors.fill, color: colors.stroke,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6875rem', fontWeight: 800, flexShrink: 0, border: `1px solid ${colors.stroke}`,
                    }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {zone.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {zone.type.replace('_', ' ')} · {zone.complaints} complaints
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: colors.stroke }}>
                      {Math.round(zone.riskScore * 100)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Risk Score Chart */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiBarChart2 style={{ color: 'var(--accent-400)' }} /> Zone Comparison
            </h4>
            <div style={{ height: 200 }}>
              <Bar
                data={zoneTypeChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111127', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1 } },
                  scales: {
                    x: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#64748b' }, max: 100 },
                    y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            className="glass-card"
            style={{ padding: '1rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>Heat Intensity Scale</h4>
            <div style={{
              height: 12, borderRadius: 6,
              background: 'linear-gradient(90deg, rgba(34,197,94,0.5), rgba(234,179,8,0.5), rgba(245,158,11,0.5), rgba(249,115,22,0.5), rgba(239,68,68,0.5))',
              marginBottom: '0.375rem',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              <span>Low (0%)</span>
              <span>Medium (50%)</span>
              <span>Critical (100%)</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
