import React from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiCpu, FiLayers, FiMapPin, FiGlobe, FiAlertTriangle, FiCheckCircle
} from 'react-icons/fi';

/**
 * VisualRoutingFlow — Premium, animated glassmorphic routing visualization component.
 * Displays the complaint routing lifecycle: Citizen Submission ➔ NLP AI Classifier ➔ Assigned Department ➔ City Authority ➔ State Authority ➔ Escalation Gate.
 */
export default function VisualRoutingFlow({ complaint }) {
  if (!complaint) return null;

  const {
    createdAt,
    category,
    nlpConfidence = 0.88,
    assignedDepartment = 'General Administration',
    assignedCityAuthority = 'Delhi Municipal Authority',
    assignedStateAuthority = 'Delhi State Authority',
    escalated = false,
    escalatedAt = null,
    escalationHistory = [],
    status = 'Submitted',
    assignedOfficer = 'Officer In-charge',
    departmentContact = '1800-11-5555'
  } = complaint;

  // Determine active steps based on complaint status and properties
  const isResolved = status === 'Resolved' || status === 'Rejected';
  const isPending = status === 'Submitted' || status === 'Under Review';
  const isInProgress = status === 'In Progress';

  const steps = [
    {
      id: 'citizen',
      title: 'Citizen Submission',
      icon: FiUser,
      color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      active: true,
      done: true,
      details: (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <div>Submitted on {new Date(createdAt).toLocaleString()}</div>
          <div style={{ fontStyle: 'italic', marginTop: '0.125rem' }}>Address: {complaint.location?.address || 'Smart City Zone'}</div>
        </div>
      )
    },
    {
      id: 'nlp',
      title: 'AI Classification Engine',
      icon: FiCpu,
      color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      active: true,
      done: true,
      details: (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <div>NLP Confidence: <span style={{ color: '#22d3ee', fontWeight: 600 }}>{(parseFloat(nlpConfidence) * 100).toFixed(1)}%</span></div>
          <div>Classified Category: <span className="badge badge-primary" style={{ display: 'inline-block', marginTop: '0.2rem', padding: '2px 6px', fontSize: '0.6875rem' }}>{category}</span></div>
        </div>
      )
    },
    {
      id: 'department',
      title: 'Departmental Assignment',
      icon: FiLayers,
      color: 'linear-gradient(135deg, #a855f7, #9333ea)',
      active: true,
      done: true,
      details: (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <div>Assigned: <span style={{ color: 'var(--primary-300)', fontWeight: 600 }}>{assignedDepartment}</span></div>
          <div>Officer: <span style={{ fontWeight: 500 }}>{assignedOfficer}</span></div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Contact: {departmentContact}</div>
        </div>
      )
    },
    {
      id: 'city',
      title: 'City Jurisdiction Gate',
      icon: FiMapPin,
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      active: true,
      done: true,
      details: (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <div>Local Authority: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{assignedCityAuthority}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
            <span className="dot dot-success" style={{ width: 8, height: 8 }}></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>City-level triage verified</span>
          </div>
        </div>
      )
    },
    {
      id: 'state',
      title: 'State Authority Overview',
      icon: FiGlobe,
      color: escalated 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : 'linear-gradient(135deg, #10b981, #059669)',
      active: true,
      done: true,
      details: (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          <div>State Administrator: <span style={{ fontWeight: 600 }}>{assignedStateAuthority}</span></div>
          <div style={{ marginTop: '0.125rem' }}>Status: {
            escalated 
              ? <span style={{ color: '#ef4444', fontWeight: 600 }}>Escalated (SLA Breach)</span> 
              : <span style={{ color: '#10b981', fontWeight: 500 }}>Active SLA (48 Hours)</span>
          }</div>
        </div>
      )
    },
    {
      id: 'escalation',
      title: escalated ? 'Critical Escalation SLA Gate' : 'SLA Enforcement Gate',
      icon: escalated ? FiAlertTriangle : FiCheckCircle,
      color: escalated 
        ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
        : isResolved 
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'linear-gradient(135deg, #6b7280, #4b5563)',
      active: escalated || isResolved,
      done: isResolved,
      details: escalated ? (
        <div style={{ 
          fontSize: '0.8rem', 
          color: '#f87171', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          borderRadius: '0.375rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontWeight: 600 }}>⚠️ SLA BREACH DETECTED:</div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
            {escalationHistory[0]?.reason || 'Complaint unresolved past 48 hours.'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Escalated to State level on {escalatedAt ? new Date(escalatedAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {isResolved ? (
            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
              <FiCheckCircle /> Resolved within SLA
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Active Triage Window</div>
              <div style={{ 
                width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: '0.25rem'
              }}>
                <motion.div 
                  style={{ height: '100%', background: 'var(--primary-400)', width: '60%' }}
                  animate={{ 
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '0.75rem' }}>
      {/* Dynamic line background */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        bottom: '1rem',
        left: '23px',
        width: '2px',
        background: 'rgba(255, 255, 255, 0.08)',
        zIndex: 0
      }} />

      {/* Animated active/completed path line */}
      <motion.div 
        style={{
          position: 'absolute',
          top: '1rem',
          left: '23px',
          width: '2px',
          background: escalated ? 'linear-gradient(to bottom, #6366f1, #06b6d4, #a855f7, #fbbf24, #ef4444)' : 'linear-gradient(to bottom, #6366f1, #06b6d4, #a855f7, #10b981)',
          zIndex: 1,
          transformOrigin: 'top'
        }}
        initial={{ height: 0 }}
        animate={{ height: escalated ? '84%' : '68%' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {steps.map((step, idx) => {
        const IconComponent = step.icon;
        const isCurrentlyActive = step.active;

        return (
          <motion.div
            key={step.id}
            style={{
              display: 'flex',
              gap: '1rem',
              position: 'relative',
              zIndex: 2,
              opacity: isCurrentlyActive ? 1 : 0.4
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isCurrentlyActive ? 1 : 0.4, x: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.3 }}
          >
            {/* Pulsating Icon wrapper */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {isCurrentlyActive && step.id === 'escalation' && escalated && (
                <span style={{
                  position: 'absolute',
                  top: -2, left: -2, right: -2, bottom: -2,
                  borderRadius: '50%',
                  border: '2px solid #ef4444',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
              )}
              {isCurrentlyActive && step.id === 'escalation' && !escalated && !isResolved && (
                <span style={{
                  position: 'absolute',
                  top: -2, left: -2, right: -2, bottom: -2,
                  borderRadius: '50%',
                  border: '2px solid var(--primary-400)',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.6)',
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
              )}

              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: step.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.9rem',
                boxShadow: isCurrentlyActive ? '0 0 15px rgba(255,255,255,0.15)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <IconComponent />
              </div>
            </div>

            {/* Content card */}
            <div className="glass-card" style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: step.id === 'escalation' && escalated ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-glass)',
              border: step.id === 'escalation' && escalated ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-subtle)',
              borderRadius: '0.625rem',
              boxShadow: isCurrentlyActive ? 'var(--shadow-sm)' : 'none',
              transform: 'scale(1)',
              transition: 'all 0.20s ease'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: step.id === 'escalation' && escalated ? '#ef4444' : 'var(--text-primary)'
                }}>
                  {step.title}
                </span>
                
                {isCurrentlyActive && step.done && (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    Verified
                  </span>
                )}
                {isCurrentlyActive && step.id === 'escalation' && escalated && (
                  <span style={{ fontSize: '0.7rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    CRITICAL
                  </span>
                )}
                {!isCurrentlyActive && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Pending
                  </span>
                )}
              </div>

              {step.details}
            </div>
          </motion.div>
        );
      })}

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
