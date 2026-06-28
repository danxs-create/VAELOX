import { BaseService } from './BaseService';
import { PermissionGrant, PermissionRequest } from '../../types';
import { Permission } from '../constants';

export class PermissionService extends BaseService {
  private _grants: Map<Permission, PermissionGrant> = new Map();

  constructor() {
    super('PermissionService');
  }

  public requestPermission(request: PermissionRequest): PermissionGrant {
    const grant: PermissionGrant = {
      permission: request.permission,
      granted: true,
      expiresAt: Date.now() + 3600000,
    };
    this._grants.set(request.permission, grant);
    return grant;
  }

  public hasPermission(permission: Permission): boolean {
    const grant = this._grants.get(permission);
    if (!grant) return false;
    if (grant.expiresAt && grant.expiresAt < Date.now()) return false;
    return grant.granted;
  }
}
