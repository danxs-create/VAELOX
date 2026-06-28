import { BaseAgent } from './BaseAgent';
import { AgentContext, AgentResult, AgentCapability } from '../../types/agent';
import { AgentStatus } from '../constants';

export class ExecutorAgent extends BaseAgent {
  constructor(id: string, name: string, capabilities: AgentCapability[] = [AgentCapability.EXECUTION]) {
    super({
      id,
      name,
      description: 'Responsible for executing tasks and using tools.',
      capabilities,
      modelId: 'default',
      tools: [],
    });
  }

  public async execute(task: string, context: AgentContext): Promise<AgentResult> {
    context.metrics.startTime = Date.now();
    
    // Stub implementation
    
    const duration = Date.now() - context.metrics.startTime;
    return {
      status: AgentStatus.COMPLETED,
      output: { result: `Executed ${task}` },
      duration,
      tokenUsage: { input: 0, output: 0, total: 0 },
      cost: 0,
    };
  }
}
