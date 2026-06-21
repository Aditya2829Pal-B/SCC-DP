import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter, FiSearch, FiClock, FiCheckCircle, FiAlertCircle,
  FiMapPin, FiEye, FiX
} from 'react-icons/fi';
import dataService from '../services/dataService';
import { formatDate, timeAgo, getStatusBadge, getSeverityColor, truncate } from '../utils/helpers';
import Autocomplete from '../components/Autocomplete';
import VisualRoutingFlow from '../components/VisualRoutingFlow';

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      const res = await dataService.getComplaints({ userId: user?._id });
      setComplaints(res.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredComplaints = complaints.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusCounts = {
    all: complaints.length,
    'Submitted': complaints.filter(c => c.status === 'Submitted').length,
    'Under Review': complaints.filter(c => c.status === 'Under Review').length,
    'In Progress': complaints.filter(c => c.status === 'In Progress').length,
    'Resolved': complaints.filter(c => c.status === 'Resolved').length,
  };

  const statusSteps = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
  const titleSuggestions = [...new Set(complaints.map(c => c.title))].slice(0, 10);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>My Complaints</h1>
        <p>Track and manage your submitted complaints</p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        overflowX: 'auto', paddingBottom: '0.25rem',
      }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            {status === 'all' ? 'All' : status} ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
        <Autocomplete
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={titleSuggestions}
          placeholder="Search complaints..."
          icon={FiSearch}
          className="form-input"
        />
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: '1rem' }} />)}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <FiAlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No complaints found</h3>
          <p>Try changing the filter or submit a new complaint</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredComplaints.map((complaint, i) => (
            <motion.div
              key={complaint._id}
              className="glass-card"
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedComplaint(complaint)}
              whileHover={{ borderColor: 'rgba(99,102,241,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {complaint.title}
                    </span>
                    <span className={`badge ${getStatusBadge(complaint.status)}`}>{complaint.status}</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    {truncate(complaint.description, 120)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FiClock size={12} /> {timeAgo(complaint.createdAt)}
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>{complaint.category}</span>
                    {complaint.location?.address && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiMapPin size={12} /> {complaint.location.address}
                      </span>
                    )}
                  </div>
                  {complaint.department && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: 'var(--primary-300)',
                      background: 'rgba(99, 102, 241, 0.06)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.375rem',
                      width: 'fit-content'
                    }}>
                      <span>🏛️ {complaint.department}</span>
                      <span style={{ color: 'var(--text-muted)' }}>•</span>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{complaint.adminLevel} Administration</span>
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '0.25rem 0.625rem', borderRadius: '0.375rem',
                  fontSize: '0.75rem', fontWeight: 600,
                  background: getSeverityColor(complaint.priority).bg,
                  color: getSeverityColor(complaint.priority).color,
                }}>
                  {complaint.priority}
                </div>
              </div>

              {/* Status Steps */}
              <div className="status-steps" style={{ marginTop: '0.875rem' }}>
                {statusSteps.map((step, si) => {
                  const currentIdx = statusSteps.indexOf(complaint.status);
                  const isCompleted = si < currentIdx;
                  const isActive = si === currentIdx;
                  return (
                    <React.Fragment key={step}>
                      <div className={`status-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                        {isCompleted ? <FiCheckCircle size={14} /> : si + 1}
                      </div>
                      {si < statusSteps.length - 1 && (
                        <div className={`status-connector ${isCompleted || isActive ? 'active' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '2rem',
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
                background: 'var(--bg-secondary)', borderColor: 'var(--border-light)',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{selectedComplaint.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Category</div>
                    <span className="badge badge-primary">{selectedComplaint.category}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Priority</div>
                    <span className="badge" style={{
                      background: getSeverityColor(selectedComplaint.priority).bg,
                      color: getSeverityColor(selectedComplaint.priority).color,
                    }}>{selectedComplaint.priority}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Submitted</div>
                    <span style={{ fontSize: '0.875rem' }}>{formatDate(selectedComplaint.createdAt)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>NLP Confidence</div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-400)' }}>{(selectedComplaint.nlpConfidence * 100).toFixed(1)}%</span>
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

                {selectedComplaint.department && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Official Department Assignment</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem', fontSize: '0.8125rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Department</div>
                        <span style={{ fontWeight: 600 }}>{selectedComplaint.department}</span>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Jurisdiction</div>
                        <span className={`badge ${selectedComplaint.adminLevel === 'state' ? 'badge-danger' : 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                          {selectedComplaint.adminLevel} Level
                        </span>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Officer-in-charge</div>
                        <span style={{ fontWeight: 500 }}>{selectedComplaint.assignedOfficer}</span>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Contact Desk</div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>{selectedComplaint.departmentContact}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComplaint.department && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Visual Routing & SLA Pathway</div>
                    <VisualRoutingFlow complaint={selectedComplaint} />
                  </div>
                )}

                {/* Status Progress */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Progress</div>
                  <div className="status-steps">
                    {statusSteps.map((step, si) => {
                      const currentIdx = statusSteps.indexOf(selectedComplaint.status);
                      const isCompleted = si < currentIdx;
                      const isActive = si === currentIdx;
                      return (
                        <React.Fragment key={step}>
                          <div style={{ textAlign: 'center' }}>
                            <div className={`status-step ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                              {isCompleted ? <FiCheckCircle size={14} /> : si + 1}
                            </div>
                            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 60 }}>{step}</div>
                          </div>
                          {si < statusSteps.length - 1 && (
                            <div className={`status-connector ${isCompleted || isActive ? 'active' : ''}`} style={{ marginBottom: '1.25rem' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
