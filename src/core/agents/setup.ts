import { AgentRegistry } from '../registries/AgentRegistry';
import { PlannerAgent } from '../agents/PlannerAgent';
import { ExecutorAgent } from '../agents/ExecutorAgent';
import { ReviewerAgent } from '../agents/ReviewerAgent';

export function registerCoreAgents(registry: AgentRegistry): void {
  registry.register(new PlannerAgent('core-planner', 'Core Planner'));
  registry.register(new ExecutorAgent('core-executor', 'Core Executor'));
  registry.register(new ReviewerAgent('core-reviewer', 'Core Reviewer'));
}
