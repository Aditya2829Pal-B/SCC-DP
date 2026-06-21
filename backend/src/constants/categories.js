/**
 * Complaint Categories and Department Mapping
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
