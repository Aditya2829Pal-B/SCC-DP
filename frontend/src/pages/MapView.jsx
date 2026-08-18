import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { FiFilter, FiLayers, FiAlertTriangle, FiMapPin, FiInfo } from 'react-icons/fi';
import dataService from '../services/dataService';
import { getRiskLevel, truncate } from '../utils/helpers';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapView() {
  const [riskZones, setRiskZones] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComplaints, setShowComplaints] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');

  useEffect(() => {
    loadMapData();
  }, []);

  async function loadMapData() {
    try {
      const [zonesRes, compRes] = await Promise.all([
        dataService.getRiskZones(),
        dataService.getComplaintsGeo(),
      ]);
      setRiskZones(zonesRes.zones);
      setComplaints(compRes.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const riskColors = {
    high: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)' },
    medium: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)' },
    low: { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.1)' },
  };

  const filteredZones = (riskZones || []).filter(z =>
    selectedRiskFilter === 'all' || z.riskLevel === selectedRiskFilter
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Risk & Complaint Map</h1>
        <p>Interactive map showing risk zones, complaints, and disaster predictions</p>
      </div>

      <div className="grid-sidebar-map">
        {/* Map */}
        <motion.div
          className="glass-card"
          style={{ overflow: 'hidden', minHeight: 550 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {!loading && (
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={11}
              style={{ height: '100%', width: '100%', minHeight: 550 }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
              />

              {/* Risk Zones */}
              {showRiskZones && filteredZones.map(zone => {
                const colors = riskColors[zone.riskLevel];
                return (
                  <Circle
                    key={zone.id}
                    center={[zone.center[1], zone.center[0]]}
                    radius={zone.radius}
                    pathOptions={{
                      color: colors.stroke,
                      fillColor: colors.fill,
                      fillOpacity: 0.3,
                      weight: 2,
                      dashArray: zone.riskLevel === 'high' ? '0' : '5,5',
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: 200, fontFamily: 'Inter' }}>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#f1f5f9' }}>{zone.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                          <span>Risk Score: <strong style={{ color: colors.stroke }}>{(zone.riskScore * 100).toFixed(0)}%</strong></span>
                          <span>Type: {zone.type.replace('_', ' ')}</span>
                          <span>Complaints: {zone.complaints}</span>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Complaint Markers */}
              {showComplaints && complaints.map(comp => (
                <CircleMarker
                  key={comp._id}
                  center={[comp.location.coordinates[1], comp.location.coordinates[0]]}
                  radius={6}
                  pathOptions={{
                    color: comp.status === 'Resolved' ? '#22c55e' : comp.priority === 'critical' ? '#ef4444' : '#6366f1',
                    fillColor: comp.status === 'Resolved' ? '#22c55e' : comp.priority === 'critical' ? '#ef4444' : '#6366f1',
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'Inter' }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: '#f1f5f9' }}>{comp.title}</h4>
                      <p style={{ margin: '0 0 0.375rem', fontSize: '0.75rem', color: '#94a3b8' }}>{truncate(comp.description, 80)}</p>
                      <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                        {comp.category}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </motion.div>

        {/* Sidebar Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Layer Controls */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiLayers style={{ color: 'var(--primary-400)' }} /> Map Layers
            </h4>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
              <input type="checkbox" checked={showRiskZones} onChange={() => setShowRiskZones(!showRiskZones)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-500)' }} />
              <span style={{ fontSize: '0.875rem' }}>Risk Zones</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showComplaints} onChange={() => setShowComplaints(!showComplaints)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-500)' }} />
              <span style={{ fontSize: '0.875rem' }}>Complaints</span>
            </label>
          </motion.div>

          {/* Risk Filter */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiFilter style={{ color: 'var(--warning-400)' }} /> Risk Level Filter
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['all', 'high', 'medium', 'low'].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedRiskFilter(level)}
                  className={`btn btn-sm ${selectedRiskFilter === level ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {level !== 'all' && (
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: riskColors[level]?.stroke || 'var(--primary-500)',
                    }} />
                  )}
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                  {level !== 'all' && ` (${(riskZones || []).filter(z => z.riskLevel === level).length})`}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Risk Zone List */}
          <motion.div
            className="glass-card"
            style={{ padding: '1.25rem', flex: 1, overflow: 'auto' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9375rem' }}>
              <FiAlertTriangle style={{ color: 'var(--danger-400)' }} /> Risk Zones ({filteredZones.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredZones.map(zone => {
                const rl = getRiskLevel(zone.riskScore);
                return (
                  <div key={zone.id} style={{
                    padding: '0.75rem', borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${rl.color}`,
                  }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{zone.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{zone.type.replace('_', ' ')}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: rl.color }}>{(zone.riskScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            className="glass-card"
            style={{ padding: '1rem' }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <FiInfo size={14} /> Legend
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem' }}>
              {[
                { color: '#ef4444', label: 'High Risk Zone' },
                { color: '#f59e0b', label: 'Medium Risk Zone' },
                { color: '#22c55e', label: 'Low Risk Zone' },
                { color: '#6366f1', label: 'Active Complaint' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
