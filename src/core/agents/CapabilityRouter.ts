import { Agent, AgentCapability } from '../../types/agent';
import { AgentRegistry } from '../registries/AgentRegistry';

export class CapabilityRouter {
  constructor(private registry: AgentRegistry) {}

  public route(requiredCapabilities: AgentCapability[]): Agent | undefined {
    const allAgents = this.registry.getAll();
    
    for (const agent of allAgents) {
      const hasAllCapabilities = requiredCapabilities.every(cap => 
        agent.config.capabilities.includes(cap)
      );
      
      if (hasAllCapabilities) {
        return agent;
      }
    }
    
    return undefined;
  }
}
