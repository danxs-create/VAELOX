import { Agent, AgentConfig, AgentContext, AgentResult, AgentState } from '../../types/agent';
import { AgentStatus } from '../constants';
import { ILifecycle, HealthStatus } from '../lifecycle/types';

export abstract class BaseAgent implements Agent, ILifecycle {
  public status: AgentStatus = AgentStatus.IDLE;
  public state: AgentState = AgentState.IDLE;
  protected _isInitialized = false;
  protected _startTime = 0;

  constructor(
    public readonly config: AgentConfig
  ) {}

  public abstract execute(task: string, context: AgentContext): Promise<AgentResult>;

  public async initialize(): Promise<void> {
    this.state = AgentState.INITIALIZING;
    this._isInitialized = true;
    this.state = AgentState.READY;
  }

  public async start(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error(`Agent ${this.config.id} must be initialized before starting.`);
    }
    this.status = AgentStatus.RUNNING;
    this.state = AgentState.RUNNING;
    this._startTime = Date.now();
  }

  public async stop(): Promise<void> {
    this.status = AgentStatus.IDLE;
    this.state = AgentState.IDLE;
  }

  public async dispose(): Promise<void> {
    this.state = AgentState.CANCELLING;
    await this.stop();
    this._isInitialized = false;
    this.state = AgentState.DISPOSED;
  }

  public async healthCheck(): Promise<HealthStatus> {
    return {
      service: `agent-${this.config.id}`,
      healthy: this._isInitialized && this.state !== AgentState.DISPOSED,
      uptime: this.status === AgentStatus.RUNNING ? Date.now() - this._startTime : 0,
      lastCheck: Date.now(),
    };
  }

  public async pause(): Promise<void> {
    if (this.status === AgentStatus.RUNNING) {
      this.status = AgentStatus.PAUSED;
      this.state = AgentState.WAITING;
    }
  }

  public async resume(): Promise<void> {
    if (this.status === AgentStatus.PAUSED) {
      this.status = AgentStatus.RUNNING;
      this.state = AgentState.RUNNING;
    }
  }
}
