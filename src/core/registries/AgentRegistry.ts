import { Agent } from '../../types';

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  public register(agent: Agent): void {
    this.agents.set(agent.config.id, agent);
  }

  public get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  public getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  public remove(id: string): boolean {
    return this.agents.delete(id);
  }
}
