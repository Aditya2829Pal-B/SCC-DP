import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiFileText, FiPlusCircle, FiMap, FiBell,
  FiSettings, FiLogOut, FiShield, FiMenu, FiX, FiActivity, FiThermometer,
  FiLayers, FiMapPin, FiGlobe
} from 'react-icons/fi';
import dataService from '../services/dataService';

const userLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/complaints/new', label: 'New Complaint', icon: FiPlusCircle },
  { path: '/complaints', label: 'My Complaints', icon: FiFileText },
  { path: '/map', label: 'Risk Map', icon: FiMap },
  { path: '/alerts', label: 'Alerts', icon: FiBell },
];

const adminLinks = [
  { path: '/admin', label: 'Admin Dashboard', icon: FiActivity },
  { path: '/admin/complaints', label: 'All Complaints', icon: FiFileText },
  { path: '/admin/heatmap', label: 'Risk Heatmap', icon: FiThermometer },
  { path: '/admin/departments', label: 'Departments', icon: FiLayers },
  { path: '/admin/city-dashboard', label: 'City Jurisdiction', icon: FiMapPin },
  { path: '/admin/state-dashboard', label: 'State Oversight', icon: FiGlobe },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = () => {
      dataService.getNotifications()
        .then(res => {
          const list = res.alerts || res || [];
          const unread = list.filter(n => !n.read).length;
          setUnreadCount(unread);
        })
        .catch(err => {
          console.warn('Failed to load notifications in sidebar:', err);
        });
    };

    fetchUnreadCount();
    // Poll every 15 seconds to keep notifications updated in real time
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', fontWeight: 800, color: 'white',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <FiShield />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>SCC&DP</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Smart City Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{
          fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '0.5rem 0.75rem', marginBottom: '0.25rem'
        }}>
          Navigation
        </div>

        {userLinks.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary-500)' : '3px solid transparent',
              transition: 'all 150ms ease',
              textDecoration: 'none',
            })}
          >
            <link.icon size={18} />
            {link.label}
            {link.path === '/alerts' && unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto', width: 20, height: 20,
                background: 'var(--danger-500)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 700, color: 'white',
              }}>{unreadCount}</span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{
              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '0.5rem 0.75rem', marginTop: '1rem', marginBottom: '0.25rem'
            }}>
              Admin
            </div>
            {adminLinks.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
                  fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-500)' : '3px solid transparent',
                  transition: 'all 150ms ease',
                  textDecoration: 'none',
                })}
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Info + Logout */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0', marginBottom: '0.75rem'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: 'white',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Administrator' : 'Citizen'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '0.8125rem' }}
        >
          <FiLogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 200,
          width: 40, height: 40, borderRadius: '0.75rem',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)', cursor: 'pointer',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Desktop Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
