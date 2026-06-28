export interface ConfigData {
  [key: string]: unknown;
}

export enum ConfigLevel {
  DEFAULT = 'DEFAULT',
  ENVIRONMENT = 'ENVIRONMENT',
  USER = 'USER',
  RUNTIME = 'RUNTIME',
}
