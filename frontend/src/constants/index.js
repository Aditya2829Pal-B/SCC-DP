/**
 * Shared Frontend Constants
 * Maps directly to backend schema, statuses, and GIS details
 */

export const COMPLAINT_CATEGORIES = {
  'Road Damage':      { departmentId: 'pwd', department: 'Public Works Department', adminLevel: 'city' },
  'Water Supply':     { departmentId: 'jal_board', department: 'Jal Board', adminLevel: 'city' },
  'Electricity':      { departmentId: 'electricity_board', department: 'Electricity Board', adminLevel: 'state' },
  'Garbage':          { departmentId: 'mcd', department: 'Municipal Corporation', adminLevel: 'city' },
  'Flooding':         { departmentId: 'dma', department: 'Disaster Management Authority', adminLevel: 'state' },
  'Fire':             { departmentId: 'fire_dept', department: 'Fire Department', adminLevel: 'city' },
  'Street Light':     { departmentId: 'mcd', department: 'Municipal Corporation', adminLevel: 'city' },
  'Noise Pollution':  { departmentId: 'pcb', department: 'Pollution Control Board', adminLevel: 'state' },
  'Sewage':           { departmentId: 'dsb', department: 'Drainage & Sewerage Board', adminLevel: 'city' },
  'Other':            { departmentId: 'mcd', department: 'Municipal Corporation', adminLevel: 'city' }
};

export const CATEGORY_NAMES = Object.keys(COMPLAINT_CATEGORIES);

export const STATUSES = { 
  SUBMITTED: 'Submitted', 
  UNDER_REVIEW: 'Under Review', 
  IN_PROGRESS: 'In Progress', 
  RESOLVED: 'Resolved', 
  REJECTED: 'Rejected' 
};

export const STATUS_VALUES = Object.values(STATUSES);

export const PRIORITIES = { 
  LOW: 'low', 
  MEDIUM: 'medium', 
  HIGH: 'high', 
  CRITICAL: 'critical' 
};

export const PRIORITY_VALUES = Object.values(PRIORITIES);

export const RISK_LEVELS = { 
  HIGH: 'high', 
  MEDIUM: 'medium', 
  LOW: 'low' 
};

export const DEFAULT_MAP_CENTER = [28.6139, 77.2090]; // Delhi NCR Coord
export const DEFAULT_MAP_ZOOM = 11;

export const CITY_DEPARTMENTS = [
  { 
    id: 'pwd', 
    name: 'Public Works Department', 
    head: 'Chief Engineer, PWD', 
    contact: 'pwd@delhi.gov.in',
    jurisdiction: 'Roads, Bridges, Flyovers, and Public Infrastructure', 
    phone: '011-23381530' 
  },
  { 
    id: 'jal_board', 
    name: 'Jal Board', 
    head: 'Chief Executive Officer, Jal Board', 
    contact: 'jalboard@delhi.gov.in',
    jurisdiction: 'Water pipelines, Drinking water supply, Water quality, and Tankers', 
    phone: '011-23890100' 
  },
  { 
    id: 'mcd', 
    name: 'Municipal Corporation', 
    head: 'MCD Commissioner', 
    contact: 'mcd@delhi.gov.in',
    jurisdiction: 'Street lighting, Public parks, Local sanitation, and Civic amenities', 
    phone: '011-23225487' 
  },
  { 
    id: 'san', 
    name: 'Sanitation Department', 
    head: 'Chief Sanitation Officer', 
    contact: 'sanitation@delhi.gov.in',
    jurisdiction: 'Garbage collection, Dumpster management, and Street sweeping', 
    phone: '011-23227600' 
  },
  { 
    id: 'dsb', 
    name: 'Drainage & Sewerage Board', 
    head: 'Chief Engineer (Drainage)', 
    contact: 'drainage@delhi.gov.in',
    jurisdiction: 'Sewage lines, Stormwater drains, Waterlogging, and Manhole repairs', 
    phone: '011-23381800' 
  },
  {
    id: 'fire_dept',
    name: 'Fire Department',
    head: 'Chief Fire Officer',
    contact: 'fire.control@state.gov.in',
    jurisdiction: 'Fire safety audits, Fire fighting operations, Emergency rescue, and Fire hazards',
    phone: '101'
  }
];

export const STATE_DEPARTMENTS = [
  { 
    id: 'electricity_board', 
    name: 'Electricity Board', 
    head: 'MD, Electricity Board', 
    contact: 'power@state.gov.in',
    jurisdiction: 'High voltage lines, Power substations, Transformers, and Outages', 
    phone: '1912' 
  },
  { 
    id: 'dma', 
    name: 'Disaster Management Authority', 
    head: 'DMA Commissioner', 
    contact: 'disaster@state.gov.in',
    jurisdiction: 'Floods, Earthquakes, Severe Weather Alerts, and Emergency response', 
    phone: '112' 
  },
  { 
    id: 'pcb', 
    name: 'Pollution Control Board', 
    head: 'Chairman, PCB', 
    contact: 'pollution@state.gov.in',
    jurisdiction: 'Industrial pollution, Noise control, Air quality index monitoring, and Waste compliance', 
    phone: '011-22307233' 
  }
];

export const ALL_DEPARTMENTS = [...CITY_DEPARTMENTS, ...STATE_DEPARTMENTS];

