import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiShield, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Autocomplete from '../components/Autocomplete';
// Uses AuthContext `login` which now falls back to mock data via dataService

const DEMO_EMAILS = ['aditya@demo.com', 'priya@demo.com'];

export default function Login() {
  const [email, setEmail] = useState('aditya@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative background elements */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', left: '-5%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)',
          }}>
            <FiShield size={28} color="white" />
          </div>
        </div>

        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to Smart City Platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <Autocomplete
              value={email}
              onChange={setEmail}
              suggestions={DEMO_EMAILS}
              placeholder="you@example.com"
              icon={FiMail}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '1rem',
              }} />
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <FiArrowRight size={18} />}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '1.25rem', padding: '0.75rem', borderRadius: '0.625rem',
          background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)',
          fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
        }}>
          <strong style={{ color: 'var(--primary-400)' }}>Demo Mode:</strong> Use any email to login.
          <br />Admin: aditya@demo.com · User: priya@demo.com
        </div>
      </motion.div>
    </div>
  );
}
