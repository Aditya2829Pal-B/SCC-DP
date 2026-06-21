import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiAlertTriangle, FiDroplet, FiSun, FiWind, FiNavigation, FiCheckCircle } from 'react-icons/fi';
import { timeAgo } from '../utils/helpers';
import { requestNotificationPermission, onMessageListener } from '../services/firebase';

/**
 * NotificationPanel — Simulated push notification system
 * Displays floating notifications when risk thresholds are exceeded
 */

const ALERT_ICONS = {
  flood: FiDroplet,
  heatwave: FiSun,
  water: FiDroplet,
  pollution: FiWind,
  infrastructure: FiNavigation,
  earthquake: FiAlertTriangle,
  default: FiBell,
};

const SEVERITY_STYLES = {
  high: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
  medium: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  low: { bg: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))', border: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
};

// Remove SIMULATED_NOTIFICATIONS

export function NotificationToast({ notification, onDismiss }) {
  const style = SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.medium;
  const Icon = ALERT_ICONS[notification.type] || ALERT_ICONS.default;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 8000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 320, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 320, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        width: 340,
        padding: '1rem 1.25rem',
        background: style.bg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${style.border}40`,
        borderLeft: `3px solid ${style.border}`,
        borderRadius: '0.875rem',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${style.glow}`,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => onDismiss(notification.id)}
      whileHover={{ scale: 1.02 }}
    >
      {/* Progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 8, ease: 'linear' }}
        style={{
          position: 'absolute', top: 0, left: 0, height: 2,
          background: style.border, borderRadius: '1px',
        }}
      />

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '0.625rem',
          background: `${style.border}20`, color: style.border,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.25rem',
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {notification.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '2px', display: 'flex',
              }}
            >
              <FiX size={14} />
            </button>
          </div>
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4,
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {notification.message}
          </p>
          <div style={{
            fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.375rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{
              padding: '1px 6px', borderRadius: '9999px', fontSize: '0.5625rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: `${style.border}20`, color: style.border,
            }}>
              {notification.severity}
            </span>
            <span>Just now</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    if (!isEnabled) return;

    // Request permission to receive notifications
    requestNotificationPermission();

    // Listen for incoming foreground messages
    const unsubscribe = onMessageListener((payload) => {
      if (payload && payload.notification) {
        const notif = {
          id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: payload.notification.title,
          message: payload.notification.body,
          severity: payload.data?.severity || 'medium',
          type: payload.data?.type || 'default',
          timestamp: new Date().toISOString(),
        };
        
        setNotifications((prev) => {
          // Keep max 3 visible at a time
          return [notif, ...prev].slice(0, 3);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isEnabled]);

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {notifications.map(notif => (
          <div key={notif.id} style={{ pointerEvents: 'auto' }}>
            <NotificationToast notification={notif} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
