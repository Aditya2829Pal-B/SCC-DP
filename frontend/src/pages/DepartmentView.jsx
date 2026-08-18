import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter, FiMail, FiPhone, FiInfo, FiLayers, FiUsers, FiClock,
  FiCheckCircle, FiAlertTriangle, FiBookOpen, FiArrowLeft, FiX, FiCheck, FiCpu
} from 'react-icons/fi';
import dataService from '../services/dataService';
import { getStatusBadge, getSeverityColor, truncate, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function DepartmentView() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, city, state
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptComplaints, setDeptComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsFilter, setComplaintsFilter] = useState('all'); // all, pending, resolved

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const data = await dataService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments', err);
      toast.error('Failed to load department database');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    setComplaintsLoading(true);
    setDeptComplaints([]);
    try {
      const data = await dataService.getDepartmentComplaints(dept.id);
      setDeptComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints for department', err);
      toast.error('Failed to retrieve complaints data');
    } finally {
      setComplaintsLoading(false);
    }
  };

  const filteredDepts = departments.filter(d => {
    if (filter === 'city') return d.id === 'pwd' || d.id === 'wsb' || d.id === 'mcd' || d.id === 'san' || d.id === 'dsb';
    if (filter === 'state') return d.id === 'discom' || d.id === 'dma' || d.id === 'pcb';
    return true;
  });

  const filteredComplaints = deptComplaints.filter(c => {
    if (complaintsFilter === 'resolved') return c.status === 'Resolved';
    if (complaintsFilter === 'pending') return c.status !== 'Resolved';
    return true;
  });

  const getResolutionRateColor = (rateStr) => {
    const rate = parseInt(rateStr);
    if (rate >= 80) return '#22c55e'; // Green
    if (rate >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Departmental Administration</h1>
          <p>Administrative jurisdictions, departmental routing, and automated complaint resolution metrics</p>
        </div>
      </div>

      {/* Jurisdiction Tab Filters */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '2rem',
        borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem'
      }}>
        {[
          { id: 'all', label: 'All Jurisdictions', count: departments.length },
          { id: 'city', label: 'City Administration', count: departments.filter(d => d.id === 'pwd' || d.id === 'wsb' || d.id === 'mcd' || d.id === 'san' || d.id === 'dsb').length },
          { id: 'state', label: 'State Administration', count: departments.filter(d => d.id === 'discom' || d.id === 'dma' || d.id === 'pcb').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`btn ${filter === tab.id ? 'btn-primary' : 'btn-secondary'} btn-md`}
            style={{ borderRadius: '2rem', padding: '0.5rem 1.25rem' }}
          >
            {tab.label} <span style={{ opacity: 0.7, fontSize: '0.8em', marginLeft: '0.25rem' }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 260, borderRadius: '1rem' }} />
          ))}
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FiInfo size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Departments Registered</h3>
          <p>The admin database is empty or offline.</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredDepts.map((dept, idx) => {
              const isState = dept.id === 'discom' || dept.id === 'dma' || dept.id === 'pcb';
              const rateVal = parseInt(dept.resolutionRate || '80');
              const rateColor = getResolutionRateColor(dept.resolutionRate);
              
              return (
                <motion.div
                  key={dept.id}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => handleSelectDept(dept)}
                  whileHover={{ 
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    transform: 'translateY(-4px)'
                  }}
                >
                  {/* Jurisdiction Ribbon badge */}
                  <div style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', padding: '0.2rem 0.5rem', borderRadius: '0.375rem',
                    background: isState ? 'rgba(239, 68, 68, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                    color: isState ? '#ef4444' : '#06b6d4',
                    border: `1px solid ${isState ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`
                  }}>
                    {isState ? 'State Jurisdiction' : 'City Department'}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.1rem', paddingRight: '6.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary-400)' }}>🏛️</span> {dept.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontFamily: 'var(--font-mono)' }}>
                      ID: {dept.id.toUpperCase()} • Jurisdiction: {dept.jurisdiction}
                    </p>

                    {/* Officer in Charge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                      <FiUsers style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Officer-in-Charge:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.head}</div>
                      </div>
                    </div>

                    {/* Stats Metrics Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem',
                      borderRadius: '0.5rem', border: '1px solid var(--border-light)',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Complaints</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {dept.totalComplaints || 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolution Rate</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: rateColor }}>
                          {dept.resolutionRate || '100%'}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Progress Bar */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Performance Efficiency</span>
                        <span>{dept.resolutionRate || '100%'}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${rateVal}%`, height: '100%', background: rateColor, borderRadius: '5px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Contact Footer */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border-light)', paddingTop: '1rem',
                    fontSize: '0.75rem', color: 'var(--text-muted)', gap: '0.5rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <FiMail size={12} style={{ flexShrink: 0 }} /> {dept.contact}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <FiPhone size={12} /> {dept.phone}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Drill-down modal for viewing department complaints */}
      <AnimatePresence>
        {selectedDept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(5, 5, 15, 0.75)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              zIndex: 1000, padding: '2rem', backdropFilter: 'blur(4px)', overflowY: 'auto'
            }}
            onClick={() => setSelectedDept(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card"
              style={{
                margin: 'auto', padding: '2rem', maxWidth: 800, width: '100%', maxHeight: 'none',
                background: 'var(--bg-secondary)', borderColor: 'var(--border-light)',
                display: 'flex', flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🏛️</span> {selectedDept.name}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Jurisdiction: {selectedDept.jurisdiction} • Officer in Charge: {selectedDept.head}
                  </p>
                </div>
                <button onClick={() => setSelectedDept(null)} className="btn btn-icon btn-secondary">
                  <FiX size={18} />
                </button>
              </div>

              {/* Stats Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Assigned</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDept.totalComplaints || 0}</div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>
                    {selectedDept.statusStats?.resolved || 0}
                  </div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Under Resolution</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                    {(selectedDept.statusStats?.submitted || 0) + (selectedDept.statusStats?.underReview || 0) + (selectedDept.statusStats?.inProgress || 0)}
                  </div>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Efficiency</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-400)' }}>{selectedDept.resolutionRate || '100%'}</div>
                </div>
              </div>

              {/* Status Tab Filters for complaints */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { id: 'all', label: 'All complaints' },
                  { id: 'pending', label: 'Pending Resolution' },
                  { id: 'resolved', label: 'Resolved Only' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setComplaintsFilter(tab.id)}
                    className={`btn ${complaintsFilter === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ borderRadius: '0.5rem' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Complaints list scroll area */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {complaintsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: '0.5rem' }} />)}
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                    <FiLayers size={32} style={{ marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>No complaints currently match this status filter.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredComplaints.map(c => (
                      <div
                        key={c._id}
                        style={{
                          padding: '1rem', borderRadius: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid var(--border-light)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{c.title}</span>
                            <span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>{c.category}</span>
                            <span className="badge" style={{
                              background: getSeverityColor(c.priority).bg,
                              color: getSeverityColor(c.priority).color,
                              fontSize: '0.625rem'
                            }}>{c.priority}</span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem', lineHeight: 1.4 }}>{truncate(c.description, 100)}</p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            <span>By: {c.userName}</span>
                            <span>•</span>
                            <span>{formatDate(c.createdAt)}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`badge ${getStatusBadge(c.status)}`} style={{ minWidth: 80, textAlign: 'center' }}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedDept(null)}>
                  Close Portal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
