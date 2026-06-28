import { BaseService } from './BaseService';
import { SecurityContext, SecurityManager } from '../../types/security';

export class SecurityService extends BaseService implements SecurityManager {
  constructor() {
    super('SecurityService');
  }

  public validateContext(context: SecurityContext): boolean {
    return context.isAuthenticated;
  }

  public hasRole(context: SecurityContext, role: string): boolean {
    if (!this.validateContext(context)) return false;
    return context.roles.includes(role);
  }
}
