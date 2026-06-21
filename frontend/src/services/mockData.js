import { COMPLAINT_CATEGORIES, ALL_DEPARTMENTS, CITY_DEPARTMENTS, STATE_DEPARTMENTS } from '../constants';

// Simulated delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// ── Mock Users ──
const mockUsers = [
  { _id: '1', name: 'Aditya Pal', email: 'aditya@demo.com', role: 'admin', location: { type: 'Point', coordinates: [77.2090, 28.6139] } },
  { _id: '2', name: 'Priya Sharma', email: 'priya@demo.com', role: 'user', location: { type: 'Point', coordinates: [77.2310, 28.6280] } },
  { _id: '3', name: 'Rahul Kumar', email: 'rahul@demo.com', role: 'user', location: { type: 'Point', coordinates: [77.1855, 28.5245] } },
];

// Helper to route mock complaints to departments and city/state authorities
const getMockComplaintRouting = (category, title = '', description = '', address = '', userCity = '') => {
  const cat = COMPLAINT_CATEGORIES[category] || COMPLAINT_CATEGORIES['Other'];
  const dept = ALL_DEPARTMENTS.find(d => d.id === cat.departmentId) || ALL_DEPARTMENTS[0];

  const scanText = `${title || ''} ${description || ''} ${address || ''}`.toLowerCase();
  
  let assignedCityAuthority = 'Delhi Municipal Authority';
  let assignedStateAuthority = 'Delhi State Authority';

  if (scanText.includes('noida')) {
    assignedCityAuthority = 'Noida Authority';
    assignedStateAuthority = 'UP State Authority';
  } else if (scanText.includes('lucknow')) {
    assignedCityAuthority = 'Lucknow Municipal Authority';
    assignedStateAuthority = 'UP State Authority';
  } else if (scanText.includes('delhi')) {
    assignedCityAuthority = 'Delhi Municipal Authority';
    assignedStateAuthority = 'Delhi State Authority';
  } else {
    // Fallback to user city profile location
    const fallbackCity = (userCity || '').toLowerCase();
    if (fallbackCity.includes('noida')) {
      assignedCityAuthority = 'Noida Authority';
      assignedStateAuthority = 'UP State Authority';
    } else if (fallbackCity.includes('lucknow')) {
      assignedCityAuthority = 'Lucknow Municipal Authority';
      assignedStateAuthority = 'UP State Authority';
    } else {
      assignedCityAuthority = 'Delhi Municipal Authority';
      assignedStateAuthority = 'Delhi State Authority';
    }
  }

  return {
    departmentId: cat.departmentId,
    department: cat.department,
    adminLevel: cat.adminLevel,
    assignedOfficer: dept.head,
    departmentContact: `${dept.phone} | ${dept.contact}`,
    assignedDepartment: cat.department,
    assignedCityAuthority,
    assignedStateAuthority,
    escalated: false,
    escalatedAt: null,
    escalationHistory: []
  };
};

const checkAndApplyMockEscalation = (comp) => {
  const isUnresolved = comp.status !== 'Resolved' && comp.status !== 'Rejected';
  if (isUnresolved && !comp.escalated) {
    const createdAt = new Date(comp.createdAt);
    const now = new Date();
    const timeDiffHours = (now - createdAt) / (1000 * 60 * 60);
    if (timeDiffHours > 48) {
      comp.escalated = true;
      comp.escalatedAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString();
      comp.priority = 'critical';
      comp.adminLevel = 'state';
      comp.escalationHistory = [
        {
          escalatedAt: comp.escalatedAt,
          reason: `Unresolved for ${timeDiffHours.toFixed(1)} hours. SLA Breach of 48-hour routing.`,
          previousLevel: 'city',
          newLevel: 'state'
        }
      ];
    }
  }
};

// ── Mock Complaints ──
const complaintCategories = ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Noise Pollution', 'Flooding', 'Street Light', 'Sewage', 'Other', 'Fire'];
const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];

const mockComplaints = Array.from({ length: 25 }, (_, i) => {
  const category = complaintCategories[i % complaintCategories.length];
  
  // Distribute complaints evenly across Delhi, Noida, Lucknow for realistic visuals
  let city = 'Delhi';
  let address = `Sector ${Math.floor(Math.random() * 50) + 1}, New Delhi`;
  let coords = [28.6139, 77.2090];
  
  if (i % 3 === 1) {
    city = 'Noida';
    address = `Industrial Sector ${Math.floor(Math.random() * 20) + 60}, Noida`;
    coords = [28.5355, 77.3910];
  } else if (i % 3 === 2) {
    city = 'Lucknow';
    address = `Hazratganj Main St, Lucknow`;
    coords = [26.8467, 80.9462];
  }
  
  const title = `${category} Issue #${i + 1}`;
  const description = `Severe ${category.toLowerCase()} problem in the area. Residents are facing difficulties with this ${category.toLowerCase()} issue. Immediate action required.`;
  
  const routing = getMockComplaintRouting(category, title, description, address, city);
  
  const complaint = {
    _id: `comp_${i + 1}`,
    userId: mockUsers[i % 3]._id,
    userName: mockUsers[i % 3].name,
    title,
    description,
    category,
    status: statuses[i % statuses.length],
    priority: ['low', 'medium', 'high', 'critical'][i % 4],
    location: {
      type: 'Point',
      coordinates: [coords[1] + (Math.random() - 0.5) * 0.05, coords[0] + (Math.random() - 0.5) * 0.05],
      address
    },
    ...routing,
    createdAt: new Date(Date.now() - (i % 2 === 0 ? 0.5 : 3) * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Mix under 48h and over 48h
    updatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    nlpConfidence: (0.75 + Math.random() * 0.24).toFixed(2),
  };
  
  // Pre-apply escalations to older items
  checkAndApplyMockEscalation(complaint);
  
  return complaint;
});


// ── Mock Risk Zones ──
const mockRiskZones = [
  { id: 'rz1', name: 'Yamuna Flood Zone', center: [77.2400, 28.6800], radius: 2000, riskLevel: 'high', riskScore: 0.87, type: 'flood', complaints: 12 },
  { id: 'rz2', name: 'Central Delhi Heat Zone', center: [77.2090, 28.6320], radius: 1500, riskLevel: 'medium', riskScore: 0.62, type: 'heatwave', complaints: 8 },
  { id: 'rz3', name: 'South Delhi Water Crisis', center: [77.2167, 28.5245], radius: 1800, riskLevel: 'high', riskScore: 0.78, type: 'water_shortage', complaints: 15 },
  { id: 'rz4', name: 'Noida Industrial Area', center: [77.3910, 28.5355], radius: 2500, riskLevel: 'medium', riskScore: 0.55, type: 'air_pollution', complaints: 6 },
  { id: 'rz5', name: 'Gurgaon Waterlogging', center: [77.0266, 28.4595], radius: 1200, riskLevel: 'low', riskScore: 0.35, type: 'waterlogging', complaints: 4 },
];

// ── Mock Alerts ──
const mockAlerts = [
  { id: 'a1', title: 'Flash Flood Warning', message: 'Heavy rainfall expected in next 6 hours. Yamuna water levels rising above danger mark.', severity: 'high', type: 'flood', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), location: 'North Delhi', read: false },
  { id: 'a2', title: 'Heatwave Advisory', message: 'Temperature expected to reach 46°C. Avoid outdoor activities between 11 AM - 4 PM.', severity: 'high', type: 'heatwave', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), location: 'Central Delhi', read: false },
  { id: 'a3', title: 'Water Supply Disruption', message: 'Scheduled maintenance on main pipeline. Water supply affected in Sectors 15-22.', severity: 'medium', type: 'water', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), location: 'South Delhi', read: true },
  { id: 'a4', title: 'Air Quality Alert', message: 'AQI index crossed 300. Residents advised to use masks and air purifiers.', severity: 'medium', type: 'pollution', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), location: 'Noida', read: true },
  { id: 'a5', title: 'Road Closure Notice', message: 'Ring Road closed between Moolchand and Ashram due to road repair work.', severity: 'low', type: 'infrastructure', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), location: 'Ring Road', read: true },
  { id: 'a6', title: 'Earthquake Tremor Detected', message: 'Minor tremor (3.2 magnitude) detected. No immediate danger. Stay alert.', severity: 'medium', type: 'earthquake', timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), location: 'NCR Region', read: true },
];

// ── Mock Weather Data ──
const mockWeatherData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  temperature: 28 + Math.random() * 15,
  humidity: 40 + Math.random() * 50,
  rainfall: Math.random() > 0.7 ? Math.random() * 80 : 0,
  windSpeed: 5 + Math.random() * 25,
  aqi: 100 + Math.random() * 250,
}));

// ── Mock Disaster Predictions ──
const mockPredictions = [
  { type: 'Flood', probability: 0.73, timeframe: '24-48 hours', trend: 'increasing', lastUpdated: new Date().toISOString() },
  { type: 'Heatwave', probability: 0.85, timeframe: '12-24 hours', trend: 'stable', lastUpdated: new Date().toISOString() },
  { type: 'Air Pollution Spike', probability: 0.62, timeframe: '6-12 hours', trend: 'increasing', lastUpdated: new Date().toISOString() },
  { type: 'Water Shortage', probability: 0.45, timeframe: '48-72 hours', trend: 'decreasing', lastUpdated: new Date().toISOString() },
  { type: 'Thunderstorm', probability: 0.38, timeframe: '24-48 hours', trend: 'increasing', lastUpdated: new Date().toISOString() },
];

// ── Mock Analytics ──
const mockAnalytics = {
  totalComplaints: 1247,
  resolvedComplaints: 892,
  pendingComplaints: 355,
  avgResolutionTime: '3.2 days',
  complaintsByCategory: {
    'Road Damage': 287,
    'Water Supply': 234,
    'Electricity': 198,
    'Garbage': 167,
    'Noise Pollution': 123,
    'Flooding': 98,
    'Street Light': 78,
    'Sewage': 62,
  },
  complaintTrend: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2026, i).toLocaleString('default', { month: 'short' }),
    count: 80 + Math.floor(Math.random() * 60),
    resolved: 60 + Math.floor(Math.random() * 40),
  })),
  riskDistribution: { high: 15, medium: 35, low: 50 },
};

// ── Mock API Functions ──
export const mockAPI = {
  // Auth
  login: async (email, password) => {
    await delay(800);
    const user = mockUsers.find(u => u.email === email) || mockUsers[1];
    return { token: 'mock_jwt_token_' + Date.now(), user };
  },

  signup: async (name, email, password, location) => {
    await delay(800);
    const newUser = { _id: 'new_' + Date.now(), name, email, role: 'user', location };
    return { token: 'mock_jwt_token_' + Date.now(), user: newUser };
  },

  // Complaints
  getComplaints: async (filters = {}) => {
    await delay(600);
    // Apply escalation checks dynamically
    mockComplaints.forEach(c => checkAndApplyMockEscalation(c));
    
    let filtered = [...mockComplaints];
    if (filters.userId) filtered = filtered.filter(c => c.userId === filters.userId);
    if (filters.category) filtered = filtered.filter(c => c.category === filters.category);
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);
    return { complaints: filtered, total: filtered.length };
  },

  submitComplaint: async (data) => {
    await delay(1000);
    const category = data.category || complaintCategories[Math.floor(Math.random() * complaintCategories.length)];
    const routing = getMockComplaintRouting(
      category,
      data.title || '',
      data.description || '',
      data.location?.address || '',
      data.city || ''
    );
    const newComplaint = {
      _id: 'comp_new_' + Date.now(),
      ...data,
      status: 'Submitted',
      category,
      ...routing,
      nlpConfidence: (0.8 + Math.random() * 0.19).toFixed(2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockComplaints.unshift(newComplaint);
    return { complaint: newComplaint, classifiedCategory: newComplaint.category, confidence: newComplaint.nlpConfidence };
  },

  updateComplaintStatus: async (id, status, priority, adminNotes) => {
    await delay(500);
    const comp = mockComplaints.find(c => c._id === id);
    if (comp) {
      if (status) comp.status = status;
      if (priority) comp.priority = priority;
      if (adminNotes) comp.adminNotes = adminNotes;
      comp.updatedAt = new Date().toISOString();
      return { success: true, complaint: comp };
    }
    return { success: false, message: 'Complaint not found' };
  },

  // Map & Risk
  getRiskZones: async () => {
    await delay(500);
    return { zones: mockRiskZones };
  },

  getComplaintsGeo: async () => {
    await delay(500);
    return { complaints: mockComplaints.map(c => ({ ...c, coordinates: c.location.coordinates })) };
  },

  // Alerts
  getAlerts: async (userId) => {
    await delay(400);
    return { alerts: mockAlerts };
  },

  // Predictions
  getPredictions: async () => {
    await delay(700);
    return { predictions: mockPredictions };
  },

  getWeatherData: async () => {
    await delay(500);
    return { data: mockWeatherData };
  },

  // Analytics (Admin)
  getAnalytics: async () => {
    await delay(600);
    const total = mockComplaints.length;
    const resolved = mockComplaints.filter(c => c.status === 'Resolved').length;
    const pending = total - resolved;
    
    // Group by category
    const byCategory = {};
    mockComplaints.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    return {
      totalComplaints: total,
      resolvedComplaints: resolved,
      pendingComplaints: pending,
      avgResolutionTime: '3.2 days',
      complaintsByCategory: byCategory,
      complaintTrend: mockAnalytics.complaintTrend,
      riskDistribution: mockAnalytics.riskDistribution
    };
  },

  // Risk Score
  getUserRisk: async (userId) => {
    await delay(500);
    return {
      riskScore: 0.67,
      breakdown: {
        disasterProbability: 0.73,
        areaRisk: 0.82,
        userSensitivity: 1.12,
      },
      recommendations: [
        'Keep emergency supplies ready due to flood risk',
        'Stay hydrated — extreme heat advisory in effect',
        'Download offline maps for emergency evacuation routes',
        'Register for SMS alerts from your local authority',
      ],
      safeRoutes: [
        { name: 'Route A — Via Ring Road', distance: '5.2 km', estimatedTime: '18 min', safety: 'high' },
        { name: 'Route B — Via NH-24', distance: '7.8 km', estimatedTime: '25 min', safety: 'medium' },
      ],
    };
  },

  // Departments & Administration System
  getDepartments: async (level = '') => {
    await delay(400);
    let depts = [...ALL_DEPARTMENTS];
    if (level === 'city') depts = [...CITY_DEPARTMENTS];
    if (level === 'state') depts = [...STATE_DEPARTMENTS];
    
    return depts.map(d => {
      const deptComplaints = mockComplaints.filter(c => c.departmentId === d.id);
      const total = deptComplaints.length;
      const resolved = deptComplaints.filter(c => c.status === 'Resolved').length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      return {
        ...d,
        totalComplaints: total,
        resolutionRate: `${rate}%`,
        statusStats: {
          submitted: deptComplaints.filter(c => c.status === 'Submitted').length,
          underReview: deptComplaints.filter(c => c.status === 'Under Review').length,
          inProgress: deptComplaints.filter(c => c.status === 'In Progress').length,
          resolved: resolved
        }
      };
    });
  },

  getDepartmentStats: async () => {
    await delay(400);
    const stats = ALL_DEPARTMENTS.map(d => {
      const deptComplaints = mockComplaints.filter(c => c.departmentId === d.id);
      const total = deptComplaints.length;
      const resolved = deptComplaints.filter(c => c.status === 'Resolved').length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      return {
        departmentId: d.id,
        name: d.name,
        adminLevel: d.id === 'discom' || d.id === 'dma' || d.id === 'pcb' ? 'state' : 'city',
        total,
        resolved,
        pending: total - resolved,
        resolutionRate: `${rate}%`
      };
    });
    return stats;
  },

  getDepartmentById: async (id) => {
    await delay(300);
    const d = ALL_DEPARTMENTS.find(dept => dept.id === id);
    if (!d) return null;
    const deptComplaints = mockComplaints.filter(c => c.departmentId === d.id);
    const total = deptComplaints.length;
    const resolved = deptComplaints.filter(c => c.status === 'Resolved').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return {
      ...d,
      totalComplaints: total,
      resolutionRate: `${rate}%`,
      statusStats: {
        submitted: deptComplaints.filter(c => c.status === 'Submitted').length,
        underReview: deptComplaints.filter(c => c.status === 'Under Review').length,
        inProgress: deptComplaints.filter(c => c.status === 'In Progress').length,
        resolved: resolved
      }
    };
  },

  getDepartmentComplaints: async (id, filters = {}) => {
    await delay(400);
    mockComplaints.forEach(c => checkAndApplyMockEscalation(c));
    let filtered = mockComplaints.filter(c => c.departmentId === id);
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);
    if (filters.priority) filtered = filtered.filter(c => c.priority === filters.priority);
    return { complaints: filtered, total: filtered.length };
  }
};

export default mockAPI;
