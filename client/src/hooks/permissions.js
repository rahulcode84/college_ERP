export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Student management
  STUDENT_READ: 'student.read',
  STUDENT_UPDATE: 'student.update',
  STUDENT_ATTENDANCE: 'student.attendance',
  STUDENT_GRADES: 'student.grades',
  
  // Faculty management
  FACULTY_READ: 'faculty.read',
  FACULTY_UPDATE: 'faculty.update',
  FACULTY_CLASSES: 'faculty.classes',
  
  // Department management
  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',
  
  // System administration
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_REPORTS: 'system.reports',
  SYSTEM_ANALYTICS: 'system.analytics'
};

export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.FACULTY_READ,
    PERMISSIONS.FACULTY_UPDATE,
    PERMISSIONS.DEPARTMENT_CREATE,
    PERMISSIONS.DEPARTMENT_READ,
    PERMISSIONS.DEPARTMENT_UPDATE,
    PERMISSIONS.DEPARTMENT_DELETE,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_REPORTS,
    PERMISSIONS.SYSTEM_ANALYTICS
  ],
  faculty: [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_ATTENDANCE,
    PERMISSIONS.STUDENT_GRADES,
    PERMISSIONS.FACULTY_READ,
    PERMISSIONS.FACULTY_UPDATE,
    PERMISSIONS.FACULTY_CLASSES,
    PERMISSIONS.DEPARTMENT_READ
  ],
  student: [
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.FACULTY_READ,
    PERMISSIONS.DEPARTMENT_READ
  ]
};

export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};
