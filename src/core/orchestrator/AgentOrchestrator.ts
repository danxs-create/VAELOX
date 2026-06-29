import { Agent, AgentContext, AgentResult, AgentCapability } from '../../types/agent';
import { WorkflowNode, WorkflowNodeType, WorkflowResult, WorkflowStatus } from '../../types/workflow';
import { CapabilityRouter } from '../agents/CapabilityRouter';

export class AgentOrchestrator {
  constructor(private router: CapabilityRouter) {}

  public async executeNode(node: WorkflowNode, context: AgentContext): Promise<AgentResult> {
    const requiredCaps = node.requiredCapabilities || this.inferCapabilities(node.type);
    const agent = this.router.route(requiredCaps);

    if (!agent) {
      throw new Error(`No agent found for node ${node.id} with capabilities ${requiredCaps.join(',')}`);
    }

    return agent.execute(node.id, context);
  }

  private inferCapabilities(type: WorkflowNodeType): AgentCapability[] {
    switch (type) {
      case WorkflowNodeType.PLANNER: return [AgentCapability.PLANNING];
      case WorkflowNodeType.EXECUTOR: return [AgentCapability.EXECUTION];
      case WorkflowNodeType.REVIEWER: return [AgentCapability.REVIEW];
      default: return [];
    }
  }

  public aggregateResults(results: Map<string, AgentResult>, duration: number): WorkflowResult {
    const finalResults: Record<string, AgentResult> = {};
    const errors: Error[] = [];
    const tokenUsage = { input: 0, output: 0, total: 0 };
    let cost = 0;

    for (const [nodeId, result] of results.entries()) {
      finalResults[nodeId] = result;
      if (result.error) errors.push(result.error);
      tokenUsage.input += result.tokenUsage.input;
      tokenUsage.output += result.tokenUsage.output;
      tokenUsage.total += result.tokenUsage.total;
      cost += result.cost;
    }

    return {
      status: errors.length > 0 ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED,
      duration,
      agentResults: finalResults,
      errors,
      warnings: [],
      tokenUsage,
      cost,
    };
  }
}
