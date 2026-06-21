import api from './api';
import mockAPI from './mockData';

/**
 * Unified Data Service — tries real backend API first, falls back to mock data.
 * Handles standardized `{ success, message, data }` responses from the backend automatically.
 */
async function tryApiOrMock(apiCall, mockCall) {
  try {
    const res = await apiCall();
    // Standardized response wraps actual payload inside res.data.data
    if (res.data && res.data.success && res.data.data !== undefined) {
      return res.data.data;
    }
    return res.data;
  } catch (err) {
    if (import.meta.env.VITE_REQUIRE_REAL_DATA === 'true') {
      console.error('[DataService] API call failed and REQUIRE_REAL_DATA is true. Failing fast.', err);
      throw err;
    }
    // Backend unavailable or error — fallback to mock data
    console.log('[DataService] API call failed or backend unavailable, using mock data:', err.message);
    return await mockCall();
  }
}

const dataService = {
  // ── Auth ──
  login: (email, password) =>
    tryApiOrMock(
      () => api.post('/auth/login', { email, password }),
      () => mockAPI.login(email, password)
    ),

  signup: (name, email, password, location) =>
    tryApiOrMock(
      () => api.post('/auth/signup', { name, email, password, city: typeof location === 'object' ? location.city : location }),
      () => mockAPI.signup(name, email, password, location)
    ),

  // ── Complaints ──
  getComplaints: (filters = {}) =>
    tryApiOrMock(
      () => api.get('/complaints', { params: filters }),
      () => mockAPI.getComplaints(filters)
    ),

  submitComplaint: (data) =>
    tryApiOrMock(
      () => api.post('/complaints', data),
      () => mockAPI.submitComplaint(data)
    ),

  updateComplaintStatus: (id, status, priority, adminNotes) =>
    tryApiOrMock(
      () => api.put(`/complaints/${id}`, { status, priority, adminNotes }),
      () => mockAPI.updateComplaintStatus(id, status, priority, adminNotes)
    ),

  // ── Map & Risk ──
  getRiskZones: () =>
    tryApiOrMock(
      () => api.get('/alerts/risk-zones'),
      () => mockAPI.getRiskZones()
    ),

  getComplaintsGeo: (coords = { lng: 77.2090, lat: 28.6139 }) =>
    tryApiOrMock(
      () => api.get('/complaints/geo/nearby', { params: { lng: coords.lng, lat: coords.lat } }),
      () => mockAPI.getComplaintsGeo(coords)
    ),

  // ── Alerts ──
  getAlerts: (userId) =>
    tryApiOrMock(
      () => api.get('/alerts'),
      () => mockAPI.getAlerts(userId)
    ),

  // ── Predictions ──
  getPredictions: (location = { type: 'Point', coordinates: [77.2090, 28.6139] }, weatherData = { temperature: 38, humidity: 65, rainfall: 20 }) =>
    tryApiOrMock(
      () => api.post('/ml/predict', { location, weatherData }),
      () => mockAPI.getPredictions()
    ),

  getWeatherData: () =>
    tryApiOrMock(
      () => api.get('/ml/weather'),
      () => mockAPI.getWeatherData()
    ),

  // ── Analytics (Admin) ──
  getAnalytics: () =>
    tryApiOrMock(
      () => api.get('/analytics/overview'),
      () => mockAPI.getAnalytics()
    ),

  // ── Risk Score ──
  getUserRisk: (userId) =>
    tryApiOrMock(
      () => api.get(`/alerts/risk/${userId}`),
      () => mockAPI.getUserRisk(userId)
    ),

  // ── NLP Classification ──
  classifyText: (text) =>
    tryApiOrMock(
      () => api.post('/ml/classify', { text }),
      () => Promise.resolve({ category: 'Other', confidence: 0.65, source: 'mock' })
    ),

  // ── Notifications ──
  getNotifications: () =>
    tryApiOrMock(
      () => api.get('/notifications'),
      () => mockAPI.getAlerts() // reuse alerts as notifications
    ),

  markNotificationRead: (id) =>
    tryApiOrMock(
      () => api.patch(`/notifications/${id}/read`), // Fixed PUT to PATCH
      () => Promise.resolve({ success: true })
    ),

  registerDeviceToken: (token) =>
    tryApiOrMock(
      () => api.post('/notifications/token', { token }),
      () => Promise.resolve({ success: true })
    ),

  // ── Departments & Administration System ──
  getDepartments: (level = '') =>
    tryApiOrMock(
      () => api.get('/departments', { params: { level } }),
      () => mockAPI.getDepartments(level)
    ),

  getDepartmentStats: () =>
    tryApiOrMock(
      () => api.get('/departments/stats'),
      () => mockAPI.getDepartmentStats()
    ),

  getDepartmentById: (id) =>
    tryApiOrMock(
      () => api.get(`/departments/${id}`),
      () => mockAPI.getDepartmentById(id)
    ),

  getDepartmentComplaints: (id, filters = {}) =>
    tryApiOrMock(
      () => api.get(`/departments/${id}/complaints`, { params: filters }),
      () => mockAPI.getDepartmentComplaints(id, filters)
    )
};

export default dataService;
