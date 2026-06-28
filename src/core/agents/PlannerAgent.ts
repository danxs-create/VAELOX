import { BaseAgent } from './BaseAgent';
import { AgentContext, AgentResult, AgentCapability } from '../../types/agent';
import { AgentStatus } from '../constants';

export class PlannerAgent extends BaseAgent {
  constructor(id: string, name: string) {
    super({
      id,
      name,
      description: 'Responsible for breaking down complex tasks into smaller, actionable steps.',
      capabilities: [AgentCapability.PLANNING],
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
      output: { plan: [`Step 1 for ${task}`] },
      duration,
      tokenUsage: { input: 0, output: 0, total: 0 },
      cost: 0,
    };
  }
}
