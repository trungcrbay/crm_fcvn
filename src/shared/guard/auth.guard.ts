import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  IS_PUBLIC_KEY,
  REQUEST_ROLE_PERMISSIONS,
  REQUEST_USER_KEY,
} from '../constant/auth.constant';
import { Permission } from '../constant/permission.constant';
import { TokenService } from '../services/token.service';
import { RolesRepository } from 'src/modules/roles/roles.repository';
import { AuthenticatedRequest } from '../types/request.type';
import { AccessTokenPayload } from '../types/jwt.type';
import { CacheService } from 'src/modules/cache/cache.service';
import {
  CACHE_TTL_ROLE_PERMISSIONS,
  getRolePermissionsCacheKey,
} from '../constant/cache.constant';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly rolesRepository: RolesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.getTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.tokenService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    const rolePermissions = await this.loadRolePermissions(payload.roleId);

    request[REQUEST_USER_KEY] = payload;
    request[REQUEST_ROLE_PERMISSIONS] = rolePermissions;

    return true;
  }

  private async loadRolePermissions(roleId?: number): Promise<Permission[]> {
    if (!roleId) {
      throw new UnauthorizedException('Vai trò không hợp lệ');
    }

    const cacheKey = getRolePermissionsCacheKey(roleId);

    try {
      const cachedPermissions =
        await this.cacheService.get<Permission[]>(cacheKey);

      if (cachedPermissions !== undefined) {
        return cachedPermissions;
      }
    } catch {
      // Cache is an optimization; auth should fall back to DB if Redis is down.
    }

    try {
      const role = await this.rolesRepository.findOne(roleId);
      const permissions = role?.permissions ?? [];

      await this.cacheService
        .set(cacheKey, permissions, CACHE_TTL_ROLE_PERMISSIONS)
        .catch(() => {});

      return permissions;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Không thể xác thực quyền truy cập');
    }
  }

  private getTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
