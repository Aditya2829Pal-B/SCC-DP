/**
 * Complaint Statuses and Transition Constraints
 */

export const STATUSES = { 
  SUBMITTED: 'Submitted', 
  UNDER_REVIEW: 'Under Review', 
  IN_PROGRESS: 'In Progress', 
  RESOLVED: 'Resolved', 
  REJECTED: 'Rejected' 
};

export const STATUS_VALUES = Object.values(STATUSES);

export const STATUS_TRANSITIONS = {
  [STATUSES.SUBMITTED]: [STATUSES.UNDER_REVIEW, STATUSES.REJECTED],
  [STATUSES.UNDER_REVIEW]: [STATUSES.IN_PROGRESS, STATUSES.REJECTED],
  [STATUSES.IN_PROGRESS]: [STATUSES.RESOLVED, STATUSES.REJECTED],
  [STATUSES.RESOLVED]: [],
  [STATUSES.REJECTED]: []
};

export const PRIORITIES = { 
  LOW: 'low', 
  MEDIUM: 'medium', 
  HIGH: 'high', 
  CRITICAL: 'critical' 
};

export const PRIORITY_VALUES = Object.values(PRIORITIES);
