import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  REQUEST_ROLE_PERMISSIONS,
} from '../constant/auth.constant';
import {
  MANAGE_PERMISSIONS,
  Permission,
} from '../constant/permission.constant';
import { AuthenticatedRequest } from '../types/request.type';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions: Permission[] =
      request[REQUEST_ROLE_PERMISSIONS] ?? [];

    const hasPermission = requiredPermissions.some((permission) =>
      this.hasPermission(userPermissions, permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này',
      );
    }

    return true;
  }

  private hasPermission(
    userPermissions: Permission[],
    required: Permission,
  ): boolean {
    if (userPermissions.includes(required)) {
      return true;
    }

    return Object.keys(MANAGE_PERMISSIONS).some((manageKey) => {
      const manage = manageKey as Permission;

      return (
        userPermissions.includes(manage) &&
        MANAGE_PERMISSIONS[manage]?.includes(required)
      );
    });
  }
}
