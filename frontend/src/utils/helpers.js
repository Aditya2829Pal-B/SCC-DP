/**
 * Utility functions for the SCC&DP platform
 */

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

/**
 * Get color class/style for severity level
 */
export function getSeverityColor(severity) {
  const map = {
    low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', label: 'Low' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', label: 'Medium' },
    high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', label: 'High' },
    critical: { bg: 'rgba(220, 38, 38, 0.2)', color: '#ef4444', label: 'Critical' },
  };
  return map[severity] || map.medium;
}

/**
 * Get status badge class
 */
export function getStatusBadge(status) {
  const map = {
    'Submitted': 'badge-info',
    'Under Review': 'badge-warning',
    'In Progress': 'badge-primary',
    'Resolved': 'badge-success',
    'Rejected': 'badge-danger',
  };
  return map[status] || 'badge-primary';
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score) {
  if (score >= 0.7) return { level: 'high', label: 'High Risk', color: '#ef4444' };
  if (score >= 0.4) return { level: 'medium', label: 'Medium Risk', color: '#f59e0b' };
  return { level: 'low', label: 'Low Risk', color: '#22c55e' };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate a random ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
