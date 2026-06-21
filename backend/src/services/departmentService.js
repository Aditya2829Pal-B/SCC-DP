/**
 * Department Service for Smart City routing and administration operations
 */
import { COMPLAINT_CATEGORIES, ALL_DEPARTMENTS, CITY_DEPARTMENTS, STATE_DEPARTMENTS } from '../constants/index.js';

export class DepartmentService {
  /**
   * Routes a complaint category to the correct department
   * @param {string} category 
   * @returns {object} Department routing information
   */
  static routeComplaintToDepartment(category) {
    // Default fallback to "Other" mapping if not explicitly found
    const mapping = COMPLAINT_CATEGORIES[category] || COMPLAINT_CATEGORIES['Other'];
    
    // Find department details
    const department = ALL_DEPARTMENTS.find(d => d.id === mapping.departmentId);
    
    if (!department) {
      return {
        department: 'Municipal Corporation',
        departmentId: 'mcd',
        adminLevel: 'city',
        assignedOfficer: 'MCD Commissioner',
        departmentContact: 'mcd@delhi.gov.in'
      };
    }

    return {
      department: department.name,
      departmentId: department.id,
      adminLevel: mapping.adminLevel,
      assignedOfficer: department.head,
      departmentContact: department.contact
    };
  }

  /**
   * Get department details by ID
   * @param {string} id 
   */
  static getDepartmentById(id) {
    return ALL_DEPARTMENTS.find(d => d.id === id) || null;
  }

  /**
   * Get departments by administration level
   * @param {string} level 'city' | 'state'
   */
  static getDepartmentsByLevel(level) {
    if (level === 'city') return CITY_DEPARTMENTS;
    if (level === 'state') return STATE_DEPARTMENTS;
    return ALL_DEPARTMENTS;
  }

  /**
   * Generate department stats based on an array of complaints
   * @param {Array} complaints 
   */
  static getDepartmentStats(complaints) {
    const statsMap = {};

    // Initialize all departments with zero values
    ALL_DEPARTMENTS.forEach(dept => {
      statsMap[dept.id] = {
        departmentId: dept.id,
        name: dept.name,
        head: dept.head,
        adminLevel: CITY_DEPARTMENTS.some(d => d.id === dept.id) ? 'city' : 'state',
        total: 0,
        resolved: 0,
        pending: 0,
        resolutionRate: 0
      };
    });

    // Populate counters
    complaints.forEach(complaint => {
      const deptId = complaint.departmentId || 'mcd'; // fallback to MCD if not routed
      
      // Ensure we have a placeholder for unmapped/custom departments
      if (!statsMap[deptId]) {
        statsMap[deptId] = {
          departmentId: deptId,
          name: complaint.department || 'Municipal Corporation',
          head: complaint.assignedOfficer || 'Commissioner',
          adminLevel: complaint.adminLevel || 'city',
          total: 0,
          resolved: 0,
          pending: 0,
          resolutionRate: 0
        };
      }

      const status = complaint.status;
      statsMap[deptId].total++;
      
      if (status === 'Resolved') {
        statsMap[deptId].resolved++;
      } else if (status !== 'Rejected') {
        statsMap[deptId].pending++;
      }
    });

    // Calculate rates and convert map to array
    return Object.values(statsMap).map(stat => {
      stat.resolutionRate = stat.total > 0 
        ? Math.round((stat.resolved / stat.total) * 100) 
        : 100; // 100% if no complaints
      return stat;
    });
  }
}

export default DepartmentService;
