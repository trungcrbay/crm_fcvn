import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '../types/jwt.type';
import {
  REQUEST_ROLE_PERMISSIONS,
  REQUEST_USER_KEY,
} from '../constant/auth.constant';
import { Permission } from '../constant/permission.constant';

export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);

export const ActiveUserPermissions = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Permission[] => {
    const request = context.switchToHttp().getRequest();
    return request[REQUEST_ROLE_PERMISSIONS] ?? [];
  },
);
