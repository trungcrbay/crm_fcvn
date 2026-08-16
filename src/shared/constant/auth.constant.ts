export const REQUEST_USER_KEY = 'user';
export const REQUEST_ROLE_PERMISSIONS = 'role_permissions';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'permissions';

export const AuthType = {
  Bearer: 'Bearer',
  None: 'None',
} as const;

export type AuthTypeType = (typeof AuthType)[keyof typeof AuthType];

export const ConditionGuard = {
  And: 'and',
  Or: 'or',
} as const;

export type ConditionGuardType =
  (typeof ConditionGuard)[keyof typeof ConditionGuard];
