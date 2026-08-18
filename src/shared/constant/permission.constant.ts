/**
 * Permissions Enum
 * Format: {resource}.{action}
 * Example: user.read, user.create, user.update, user.delete, user.manage
 */
export enum Permission {
  // User Module
  USER_READ = 'user.read',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_MANAGE = 'user.manage',

  // Customer Module
  CUSTOMER_READ = 'customer.read',
  CUSTOMER_CREATE = 'customer.create',
  CUSTOMER_UPDATE = 'customer.update',
  CUSTOMER_DELETE = 'customer.delete',
  CUSTOMER_MANAGE = 'customer.manage',

  // Department Module
  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_READ_FACILITY = 'department.readFacility',
  DEPARTMENT_CREATE = 'department.create',
  DEPARTMENT_UPDATE = 'department.update',
  DEPARTMENT_DELETE = 'department.delete',
  DEPARTMENT_MANAGE = 'department.manage',

  // Facility Module
  FACILITY_READ = 'facility.read',
  FACILITY_CREATE = 'facility.create',
  FACILITY_UPDATE = 'facility.update',
  FACILITY_DELETE = 'facility.delete',
  FACILITY_MANAGE = 'facility.manage',

  // Permission Module
  PERMISSION_READ = 'permission.read',
  PERMISSION_CREATE = 'permission.create',
  PERMISSION_UPDATE = 'permission.update',
  PERMISSION_DELETE = 'permission.delete',
  PERMISSION_MANAGE = 'permission.manage',

  // Supplier Module
  SUPPLIER_READ = 'supplier.read',
  SUPPLIER_CREATE = 'supplier.create',
  SUPPLIER_UPDATE = 'supplier.update',
  SUPPLIER_DELETE = 'supplier.delete',
  SUPPLIER_MANAGE = 'supplier.manage',
  SUPPLIER_CHANGE_STATUS = 'supplier.changeStatus',
  SUPPLIER_ASSIGN_SUPPLIERS = 'supplier.assignSuppliers',

  // Supplier Group Module
  SUPPLIER_GROUP_READ = 'supplierGroup.read',
  SUPPLIER_GROUP_CREATE = 'supplierGroup.create',
  SUPPLIER_GROUP_UPDATE = 'supplierGroup.update',
  SUPPLIER_GROUP_DELETE = 'supplierGroup.delete',
  SUPPLIER_GROUP_MANAGE = 'supplierGroup.manage',
}

/**
 * Super Permissions - Manage permissions include all permissions in the module
 */
export const MANAGE_PERMISSIONS: Record<string, Permission[]> = {
  [Permission.USER_MANAGE]: [
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
  ],
  [Permission.CUSTOMER_MANAGE]: [
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_DELETE,
  ],

  [Permission.DEPARTMENT_MANAGE]: [
    Permission.DEPARTMENT_READ,
    Permission.DEPARTMENT_CREATE,
    Permission.DEPARTMENT_UPDATE,
    Permission.DEPARTMENT_DELETE,
  ],
  [Permission.FACILITY_MANAGE]: [
    Permission.FACILITY_READ,
    Permission.FACILITY_CREATE,
    Permission.FACILITY_UPDATE,
    Permission.FACILITY_DELETE,
  ],

  [Permission.SUPPLIER_MANAGE]: [
    Permission.SUPPLIER_READ,
    Permission.SUPPLIER_CREATE,
    Permission.SUPPLIER_UPDATE,
    Permission.SUPPLIER_DELETE,
  ],

  [Permission.SUPPLIER_GROUP_MANAGE]: [
    Permission.SUPPLIER_GROUP_READ,
    Permission.SUPPLIER_GROUP_CREATE,
    Permission.SUPPLIER_GROUP_UPDATE,
    Permission.SUPPLIER_GROUP_DELETE,
  ],
};

export function normalizePermissionCode(permission?: string): string {
  if (!permission) return '';

  const isNegative = permission.startsWith('-');
  const rawPermission = isNegative ? permission.slice(1) : permission;
  const normalized = rawPermission;

  return isNegative ? `-${normalized}` : normalized;
}

export function normalizePermissionList<T extends string>(
  permissions: T[] = [],
): T[] {
  return [
    ...new Set(
      permissions
        .map((permission) => normalizePermissionCode(String(permission)))
        .filter(Boolean),
    ),
  ] as T[];
}

/**
 * Permission priority config
 * Dùng để xác định quyền nào "cao hơn" trong cùng một nhóm,
 * ví dụ:
 * - department.manage  > department.readFacility > department.read
 * - user.manage        > user.readFacility / user.readDepartment > user.read
 *
 * Số càng nhỏ thì quyền càng cao (1 > 2 > 3).
 * Có thể mở rộng dần cho các module khác khi cần.
 */
export const PERMISSION_PRIORITY: Partial<Record<Permission, number>> = {
  // User
  [Permission.USER_READ]: 1,
  [Permission.USER_MANAGE]: 1,

  // Customer
  [Permission.CUSTOMER_READ]: 1,
  [Permission.CUSTOMER_MANAGE]: 1,

  // Department
  [Permission.DEPARTMENT_READ]: 1,
  [Permission.DEPARTMENT_READ_FACILITY]: 2,
  [Permission.DEPARTMENT_MANAGE]: 1,

  // Facility
  [Permission.FACILITY_READ]: 1,
  [Permission.FACILITY_MANAGE]: 1,
};

/**
 * Lấy quyền cao nhất của user trong một nhóm các permission ứng viên.
 * @param userPermissions Danh sách quyền của user (thường là `user.permissions`)
 * @param candidates Danh sách các permission cần so sánh (cùng một nhóm chức năng)
 * @returns Permission có priority cao nhất mà user sở hữu, hoặc null nếu không có quyền nào
 */
export function getHighestPermission(
  userPermissions: Permission[] | undefined,
  candidates: Permission[],
): Permission | null {
  if (
    !userPermissions ||
    userPermissions.length === 0 ||
    candidates.length === 0
  ) {
    return null;
  }

  const owned = candidates.filter((candidate) =>
    hasPermissionCandidate(userPermissions, candidate),
  );

  if (!owned.length) {
    return null;
  }

  return owned.reduce((best, curr) => {
    const bestScore = PERMISSION_PRIORITY[best] ?? Infinity;
    const currScore = PERMISSION_PRIORITY[curr] ?? Infinity;

    return currScore < bestScore ? curr : best;
  });
}

function hasPermissionCandidate(
  userPermissions: Permission[],
  candidate: Permission,
): boolean {
  if (userPermissions.includes(candidate)) {
    return true;
  }

  const namespaceManagePermissions = getNamespaceManagePermissions(candidate);

  if (
    namespaceManagePermissions.some((permission) =>
      userPermissions.includes(permission),
    )
  ) {
    return true;
  }

  const managePermissions = userPermissions.filter(
    (perm) => MANAGE_PERMISSIONS[perm],
  );

  return managePermissions.some((managePerm) =>
    MANAGE_PERMISSIONS[managePerm]?.includes(candidate),
  );
}

function getNamespaceManagePermissions(
  requiredPermission: Permission,
): Permission[] {
  const segments = String(requiredPermission).split('.');

  if (segments.length <= 2) {
    return [];
  }

  const namespaceManagePermissions: Permission[] = [];

  for (let index = 1; index < segments.length - 1; index++) {
    const namespace = segments.slice(0, index).join('.');

    namespaceManagePermissions.push(`${namespace}.manage` as Permission);
  }

  return namespaceManagePermissions;
}
