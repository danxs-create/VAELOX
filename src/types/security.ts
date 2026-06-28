export interface SecurityContext {
  userId?: string;
  roles: string[];
  isAuthenticated: boolean;
}

export interface SecurityManager {
  validateContext(context: SecurityContext): boolean;
  hasRole(context: SecurityContext, role: string): boolean;
}
