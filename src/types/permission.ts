import { Permission } from '../core/constants';

export interface PermissionRequest {
  permission: Permission;
  reason: string;
  resource?: string;
}

export interface PermissionGrant {
  permission: Permission;
  granted: boolean;
  expiresAt?: number;
}
