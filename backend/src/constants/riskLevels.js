/**
 * Risk Levels, Severity, and Threshold Constants
 */

export const RISK_LEVELS = { 
  HIGH: 'high', 
  MEDIUM: 'medium', 
  LOW: 'low' 
};

export const RISK_THRESHOLDS = { 
  HIGH: 0.7, 
  MEDIUM: 0.4 
};

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

// Map default center coordinates for Leaflet/GIS maps
export const DEFAULT_MAP_CENTER = [28.6139, 77.2090]; // Delhi NCR Coord
export const DEFAULT_MAP_ZOOM = 11;
