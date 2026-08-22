export const CACHE_KEY_ROLES_LIST = 'roles:list';

export const CACHE_TTL_ROLES_LIST = 1000 * 60 * 5;

export const CACHE_TTL_ROLE_PERMISSIONS = 1000 * 60 * 5;

export function getRolePermissionsCacheKey(roleId: number): string {
  return `roles:permissions:${roleId}`;
}
