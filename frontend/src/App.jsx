import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import MapView from './pages/MapView';
import Alerts from './pages/Alerts';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminHeatmap from './pages/AdminHeatmap';
import DepartmentView from './pages/DepartmentView';
import CityDashboard from './pages/CityDashboard';
import StateDashboard from './pages/StateDashboard';

// Components
import Sidebar from './components/Sidebar';
import NotificationSystem from './components/NotificationSystem';

/**
 * ProtectedRoute — Redirects to /login if not authenticated
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

/**
 * AppLayout — Sidebar + Main Content wrapper
 */
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <NotificationSystem />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/complaints/new" element={
        <ProtectedRoute>
          <AppLayout><SubmitComplaint /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute>
          <AppLayout><MyComplaints /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute>
          <AppLayout><MapView /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <AppLayout><Alerts /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute adminOnly>
          <AppLayout><AdminComplaints /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/heatmap" element={
        <ProtectedRoute adminOnly>
          <AppLayout><AdminHeatmap /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/departments" element={
        <ProtectedRoute adminOnly>
          <AppLayout><DepartmentView /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/city-dashboard" element={
        <ProtectedRoute adminOnly>
          <AppLayout><CityDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/state-dashboard" element={
        <ProtectedRoute adminOnly>
          <AppLayout><StateDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
