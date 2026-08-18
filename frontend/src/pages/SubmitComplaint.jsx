import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  FiSend, FiMapPin, FiImage, FiFileText, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import Autocomplete from '../components/Autocomplete';
import { COMPLAINT_CATEGORIES, COMPLAINT_TITLE_SUGGESTIONS, AREA_NAMES } from '../utils/autocompleteSuggestions';
import VisualRoutingFlow from '../components/VisualRoutingFlow';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Click handler component for map
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Center map when location changes
function MapUpdater({ center }) {
  const map = useMapEvents({});
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function SubmitComplaint() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    
    const toastId = toast.loading('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation([latitude, longitude]);
        toast.success(`Location detected (Accuracy: ${Math.round(accuracy)}m)`, { id: toastId });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to detect location. Please select manually on the map.', { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };



  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please provide a title and description');
      return;
    }
    setLoading(true);
    try {
      const complaintData = {
        userId: user?._id,
        userName: user?.name,
        title,
        description,
        category: category || 'auto-classify',
        location: location ? {
          type: 'Point',
          coordinates: [location[1], location[0]],
          address: address || 'Selected location',
        } : undefined,
      };

      const res = await dataService.submitComplaint(complaintData);
      setResult(res);
      setSubmitted(true);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && result) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Complaint Submitted</h1>
          <p>Your complaint has been received and classified by our AI system</p>
        </div>

        <motion.div
          className="glass-card"
          style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', fontSize: '2rem',
          }}>
            <FiCheckCircle />
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>Thank You!</h2>
          <p style={{ marginBottom: '2rem' }}>Your complaint has been registered and will be reviewed shortly.</p>

          <div style={{
            padding: '1.25rem', borderRadius: '0.75rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              AI Auto-routing & Department Assignment
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Complaint ID:</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{result.complaint._id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Classified Category:</span>
              <span className="badge badge-primary">{result.classifiedCategory || result.complaint.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>NLP Confidence:</span>
              <span style={{ fontWeight: 700, color: parseFloat(result.confidence || 0.85) > 0.85 ? '#22c55e' : '#f59e0b' }}>
                {((parseFloat(result.confidence || 0.85)) * 100).toFixed(1)}%
              </span>
            </div>
            <hr style={{ border: '0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigned Department:</span>
              <span style={{ fontWeight: 600, color: 'var(--primary-300)' }}>{result.complaint.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Admin Jurisdiction:</span>
              <span className={`badge ${result.complaint.adminLevel === 'state' ? 'badge-danger' : 'badge-info'}`} style={{ textTransform: 'capitalize' }}>
                {result.complaint.adminLevel} Administration
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigned Officer:</span>
              <span style={{ fontWeight: 500 }}>{result.complaint.assignedOfficer}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Official Helpline:</span>
              <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{result.complaint.departmentContact}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              <span className="badge badge-info">Submitted & Routed</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Live Routing Pathway
            </div>
            <VisualRoutingFlow complaint={result.complaint} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setTitle(''); setDescription(''); setCategory(''); setLocation(null); setImage(null); setImagePreview(null); }}>
              <FiFileText size={16} /> Submit Another
            </button>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/complaints'}>
              View Complaints
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Submit a Complaint</h1>
        <p>Report an issue in your area — our AI will classify and prioritize it automatically</p>
      </div>

      <div className="grid-2">
        {/* Form */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="complaint-title">Complaint Title *</label>
              <Autocomplete
                value={title}
                onChange={setTitle}
                suggestions={COMPLAINT_TITLE_SUGGESTIONS}
                placeholder="Brief title of the issue"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="complaint-description">Description *</label>
              <textarea
                id="complaint-description" className="form-input"
                placeholder="Describe the problem in detail. Our NLP engine will auto-classify this."
                value={description} onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="complaint-category">Category (optional — AI will auto-detect)</label>
              <Autocomplete
                value={category}
                onChange={setCategory}
                suggestions={COMPLAINT_CATEGORIES}
                placeholder="Select or type a category"
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Attach Image (optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '2rem', borderRadius: '0.75rem',
                  border: '2px dashed var(--border-subtle)',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'all 150ms ease',
                  background: imagePreview ? 'transparent' : 'rgba(99,102,241,0.03)',
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: 150, borderRadius: '0.5rem', margin: '0 auto' }} />
                ) : (
                  <>
                    <FiImage size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.8125rem' }}>Click to upload an image</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="complaint-address">Address / Location Name</label>
              <Autocomplete
                value={address}
                onChange={setAddress}
                suggestions={AREA_NAMES}
                placeholder="e.g., Sector 15, Block C, New Delhi"
                className="form-input"
              />
            </div>

            <motion.button
              type="submit" className="btn btn-primary btn-lg"
              disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', marginTop: '1.5rem' }}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
              {!loading && <FiSend size={18} />}
            </motion.button>
          </form>
        </motion.div>

        {/* Map for location selection */}
        <motion.div
          className="glass-card"
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMapPin style={{ color: 'var(--primary-400)' }} />
              Select Location
            </span>
            <button type="button" onClick={detectLocation} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8125rem' }}>
              Detect My Location
            </button>
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Click on the map to pin the issue location
          </p>

          <div style={{ flex: 1, borderRadius: '0.75rem', overflow: 'hidden', minHeight: 400 }}>
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {/* Add MapUpdater component inside MapContainer to recenter when location changes */}
              {location && <MapUpdater center={location} />}
              <LocationPicker onLocationSelect={(coords) => {
                setLocation(coords);
                toast.success(`Location selected: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
              }} />
              {location && <Marker position={location} />}
            </MapContainer>
          </div>

          {location && (
            <div style={{
              marginTop: '0.75rem', padding: '0.625rem 0.875rem',
              borderRadius: '0.625rem', background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              fontSize: '0.8125rem', color: 'var(--success-400)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <FiCheckCircle /> Location pinned: {location[0].toFixed(4)}, {location[1].toFixed(4)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
