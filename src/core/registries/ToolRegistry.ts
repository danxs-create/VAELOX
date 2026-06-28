import { Tool } from '../../types';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  public register(tool: Tool): void {
    this.tools.set(tool.getDefinition().name, tool);
  }

  public get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  public remove(name: string): boolean {
    return this.tools.delete(name);
  }
}
