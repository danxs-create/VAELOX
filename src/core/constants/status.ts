export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
}

export enum ToolStatus {
  IDLE = 'IDLE',
  EXECUTING = 'EXECUTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}
