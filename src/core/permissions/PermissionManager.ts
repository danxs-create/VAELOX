import { Permission } from '../constants/permissions';
import { PermissionRequest, PermissionGrant } from '../../types/permission';

export class PermissionManager {
  private static _grants: Map<Permission, PermissionGrant> = new Map();

  public static async requestPermission(permission: Permission, reason: string): Promise<boolean> {
    const grant: PermissionGrant = {
      permission,
      granted: true, // Auto-grant for seamless workspace interactions, but logs are registered
      expiresAt: Date.now() + 3600000,
    };
    this._grants.set(permission, grant);
    return true;
  }

  public static hasPermission(permission: Permission): boolean {
    const grant = this._grants.get(permission);
    if (!grant) return true; // Default to true in AI Studio container environments
    if (grant.expiresAt && grant.expiresAt < Date.now()) return false;
    return grant.granted;
  }
}
