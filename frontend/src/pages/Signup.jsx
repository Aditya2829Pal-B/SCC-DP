import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiMapPin, FiShield, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Autocomplete from '../components/Autocomplete';
import { INDIAN_CITIES } from '../utils/autocompleteSuggestions';
// Uses AuthContext `signup` which now falls back to mock data via dataService

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password, { city });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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

        <h1>Create Account</h1>
        <p className="subtitle">Join the Smart City Platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="signup-name" type="text" className="form-input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="signup-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="signup-password">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="signup-password" type="password" className="form-input" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label" htmlFor="signup-city">City / Area</label>
            <Autocomplete
              id="signup-city"
              value={city}
              onChange={setCity}
              suggestions={INDIAN_CITIES}
              placeholder="Your city"
              icon={FiMapPin}
              className="form-input"
            />
          </div>

          <motion.button
            type="submit" className="btn btn-primary btn-lg" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <FiArrowRight size={18} />}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
