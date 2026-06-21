/**
 * Complaint Routing Engine Service
 * Handles automated AI category routing, City/State jurisdiction mapping, and SLA Escalation logic.
 */
import { COMPLAINT_CATEGORIES, ALL_DEPARTMENTS } from '../constants/index.js';

export class RoutingEngineService {
  /**
   * Automatically assigns a department and city/state authorities to a complaint
   * @param {object} params
   * @param {string} params.category - NLP classified category
   * @param {string} params.title - Complaint title
   * @param {string} params.description - Complaint description
   * @param {string} params.address - Location address
   * @param {string} params.userCity - Logged in user's profile city (for fallback)
   * @returns {object} Assigned department and authority details
   */
  static routeComplaint({ category, title, description, address = '', userCity = '' }) {
    // 1. AI Category mapping to assignedDepartment and department details
    const mapping = COMPLAINT_CATEGORIES[category] || COMPLAINT_CATEGORIES['Other'];
    const dept = ALL_DEPARTMENTS.find(d => d.id === mapping.departmentId) || ALL_DEPARTMENTS[0];

    // 2. City and State authority mapping based on text scanning
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
      department: dept.name,
      departmentId: dept.id,
      adminLevel: mapping.adminLevel,
      assignedOfficer: dept.head,
      departmentContact: `${dept.phone} | ${dept.contact}`,
      assignedDepartment: dept.name,
      assignedCityAuthority,
      assignedStateAuthority,
      escalated: false,
      escalatedAt: null,
      escalationHistory: []
    };
  }

  /**
   * Checks if a complaint has breached the 48-hour SLA and applies escalation if true
   * @param {object} complaint - Mongoose document or plain object
   * @returns {boolean} Whether the complaint was escalated
   */
  static checkAndApplyEscalation(complaint) {
    if (!complaint) return false;

    // Check if unresolved and not already escalated
    const isUnresolved = complaint.status !== 'Resolved' && complaint.status !== 'Rejected';
    if (!isUnresolved || complaint.escalated) return false;

    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    const timeDiffHours = (now - createdAt) / (1000 * 60 * 60);

    // Escalation trigger: > 48 hours
    if (timeDiffHours > 48) {
      complaint.escalated = true;
      complaint.escalatedAt = now;
      complaint.priority = 'critical';
      complaint.adminLevel = 'state'; // Promote administrative oversight to state

      const escalationRecord = {
        escalatedAt: now,
        reason: `Complaint unresolved for ${timeDiffHours.toFixed(1)} hours. Breach of 48-hour Smart City SLA.`,
        previousLevel: 'city',
        newLevel: 'state'
      };

      if (complaint.escalationHistory && typeof complaint.escalationHistory.push === 'function') {
        complaint.escalationHistory.push(escalationRecord);
      } else {
        complaint.escalationHistory = [escalationRecord];
      }

      return true;
    }

    return false;
  }
}

export default RoutingEngineService;
