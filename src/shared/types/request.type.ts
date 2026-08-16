import { Request } from 'express';
import { Permission } from '../constant/permission.constant';
import {
  REQUEST_ROLE_PERMISSIONS,
  REQUEST_USER_KEY,
} from '../constant/auth.constant';
import { AccessTokenPayload } from './jwt.type';

export interface AuthenticatedRequest extends Request {
  [REQUEST_USER_KEY]?: AccessTokenPayload;
  [REQUEST_ROLE_PERMISSIONS]?: Permission[];
}
