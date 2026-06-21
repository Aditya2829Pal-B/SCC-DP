import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiCheckCircle, FiClock, FiMapPin, FiTrash2, FiX, FiLayers, FiAlertCircle } from 'react-icons/fi';
import dataService from '../services/dataService';
import { formatDate, timeAgo, getStatusBadge, getSeverityColor, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';
import Autocomplete from '../components/Autocomplete';
import { ALL_DEPARTMENTS } from '../constants';
import VisualRoutingFlow from '../components/VisualRoutingFlow';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [adminLevelFilter, setAdminLevelFilter] = useState('all');

  // Modal Editing State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [submittingChange, setSubmittingChange] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    setLoading(true);
    try {
      const r = await dataService.getComplaints();
      setComplaints(r.complaints || r || []);
    } catch (err) {
      console.error('Failed to load complaints in admin:', err);
      toast.error('Could not fetch complaints');
    } finally {
      setLoading(false);
    }
  }

  const handleRowClick = (complaint) => {
    setSelectedComplaint(complaint);
    setEditStatus(complaint.status);
    setEditPriority(complaint.priority);
    setEditAdminNotes(complaint.adminNotes || '');
  };

  const handleStatusUpdateDirect = async (e, id, newStatus) => {
    e.stopPropagation(); // Avoid opening details modal
    try {
      const res = await dataService.updateComplaintStatus(id, newStatus);
      if (res.success || res) {
        setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveModalChanges = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSubmittingChange(true);
    try {
      const res = await dataService.updateComplaintStatus(
        selectedComplaint._id,
        editStatus,
        editPriority,
        editAdminNotes
      );
      if (res.success || res) {
        // Sync local list
        setComplaints(prev => prev.map(c => 
          c._id === selectedComplaint._id 
            ? { ...c, status: editStatus, priority: editPriority, adminNotes: editAdminNotes, updatedAt: new Date().toISOString() } 
            : c
        ));
        // Sync open modal
        setSelectedComplaint(prev => ({
          ...prev,
          status: editStatus,
          priority: editPriority,
          adminNotes: editAdminNotes,
          updatedAt: new Date().toISOString()
        }));
        toast.success('Complaint details updated successfully');
      }
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSubmittingChange(false);
    }
  };

  const categories = [...new Set(complaints.map(c => c.category))];
  const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
  const titleSuggestions = [...new Set(complaints.map(c => c.title))].slice(0, 10);

  const filtered = complaints.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (departmentFilter !== 'all' && c.departmentId !== departmentFilter) return false;
    if (adminLevelFilter !== 'all' && c.adminLevel !== adminLevelFilter) return false;
    if (searchQuery && 
        !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c._id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>All Complaints</h1>
        <p>Manage, route, and SLA-track all citizen complaints in real time</p>
      </div>

      {/* Admin Filters Grid */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <Autocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={titleSuggestions}
            placeholder="Search title, description, or ID..."
            icon={FiSearch}
            className="form-input"
          />
        </div>
        <select className="form-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-input" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Departments</option>
          {ALL_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-input" value={adminLevelFilter} onChange={e => setAdminLevelFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Levels</option>
          <option value="city">City Level</option>
          <option value="state">State Level</option>
        </select>
        <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Showing {filtered.length} of {complaints.length} complaints</span>
        {complaints.some(c => c.escalated) && (
          <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ⚠️ {complaints.filter(c => c.escalated).length} SLA Escalations Active
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: '0.75rem' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <FiAlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
          <h3>No complaints match filters</h3>
          <p>Try clearing some search metrics or filter criteria.</p>
        </div>
      ) : (
        <div className="table-wrapper glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Assigned Dept</th>
                <th>Jurisdiction</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Quick Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr 
                  key={c._id} 
                  onClick={() => handleRowClick(c)}
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  className="hover-row"
                >
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {c._id.slice(-6)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      {truncate(c.title, 32)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By: {c.userName || 'Citizen'}</div>
                  </td>
                  <td><span className="badge badge-primary">{c.category}</span></td>
                  <td><span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--primary-300)' }}>{c.department || 'Unassigned'}</span></td>
                  <td>
                    <span className={`badge ${c.escalated ? 'badge-danger' : c.adminLevel === 'state' ? 'badge-danger' : 'badge-info'}`} style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                      {c.escalated ? 'State (Escalated)' : `${c.adminLevel || 'city'} level`}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: getSeverityColor(c.priority).bg, 
                      color: getSeverityColor(c.priority).color,
                      fontSize: '0.7rem' 
                    }}>
                      {c.priority}
                    </span>
                  </td>
                  <td><span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</td>
                  <td>
                    <select 
                      className="form-input" 
                      value={c.status} 
                      onChange={e => handleStatusUpdateDirect(e, c._id, e.target.value)}
                      onClick={e => e.stopPropagation()} // Stop modal triggers
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto', minWidth: 100, height: 'auto' }}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Complaint Edit Drawer Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(5, 5, 15, 0.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '2rem', backdropFilter: 'blur(4px)'
            }}
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card"
              style={{
                padding: '2rem', maxWidth: 850, width: '100%', maxHeight: '90vh', overflowY: 'auto',
                background: 'var(--bg-secondary)', borderColor: 'var(--border-light)',
                display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: Complaint Details & Visual Routing */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selectedComplaint.title}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${getStatusBadge(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
                      <span className="badge badge-primary">{selectedComplaint.category}</span>
                      {selectedComplaint.escalated && (
                        <span className="badge badge-danger">SLA Escalated</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {selectedComplaint.description}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submitted By</div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{selectedComplaint.userName || 'Citizen'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created Date</div>
                      <span style={{ fontSize: '0.8125rem' }}>{formatDate(selectedComplaint.createdAt)}</span>
                    </div>
                  </div>

                  {selectedComplaint.location?.address && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pinned Location</div>
                      <span style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiMapPin style={{ color: 'var(--primary-400)' }} /> {selectedComplaint.location.address}
                      </span>
                    </div>
                  )}

                  {/* Routing Flow Stepper */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Visual SLA Triage Route</div>
                    <VisualRoutingFlow complaint={selectedComplaint} />
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Operations & Editing */}
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem' }}>Administrative Control Panel</h3>
                  <button onClick={() => setSelectedComplaint(null)} className="btn btn-icon btn-secondary">
                    <FiX size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveModalChanges} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Complaint Status</label>
                    <select 
                      className="form-input" 
                      value={editStatus} 
                      onChange={e => setEditStatus(e.target.value)}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Priority Classification</label>
                    <select 
                      className="form-input" 
                      value={editPriority} 
                      onChange={e => setEditPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Administrative Triage Notes</label>
                    <textarea 
                      className="form-input"
                      rows={5}
                      value={editAdminNotes}
                      onChange={e => setEditAdminNotes(e.target.value)}
                      placeholder="Add administrative review notes, action plans, updates, or resolution details here..."
                    />
                  </div>

                  {selectedComplaint.department && (
                    <div style={{ 
                      padding: '0.875rem', 
                      borderRadius: '0.5rem', 
                      background: 'rgba(99,102,241,0.03)', 
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.75rem' 
                    }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Routing Engine Summary</div>
                      <div>Dept: <strong>{selectedComplaint.department}</strong></div>
                      <div>Authority: <strong>{selectedComplaint.assignedCityAuthority}</strong></div>
                      <div>State: <strong>{selectedComplaint.assignedStateAuthority}</strong></div>
                      <div style={{ marginTop: '0.25rem' }}>Officer: {selectedComplaint.assignedOfficer} ({selectedComplaint.departmentContact})</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      disabled={submittingChange}
                    >
                      {submittingChange ? 'Saving...' : 'Save Operations'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setSelectedComplaint(null)}
                    >
                      Close Panel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
      `}</style>
    </div>
  );
}
