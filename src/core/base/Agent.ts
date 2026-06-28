import { Agent, AgentConfig, AgentResult, ExecutionContext, MemoryManager } from '../../types';
import { AgentStatus } from '../constants';

export abstract class BaseAgent implements Agent {
  public status: AgentStatus = AgentStatus.IDLE;
  
  constructor(
    public readonly config: AgentConfig,
    public readonly memory: MemoryManager,
  ) {}

  public abstract execute(task: string, context: ExecutionContext): Promise<AgentResult>;

  public async pause(): Promise<void> {
    if (this.status === AgentStatus.RUNNING) {
      this.status = AgentStatus.PAUSED;
    }
  }

  public async resume(): Promise<void> {
    if (this.status === AgentStatus.PAUSED) {
      this.status = AgentStatus.RUNNING;
    }
  }

  public async stop(): Promise<void> {
    this.status = AgentStatus.IDLE;
  }
}
