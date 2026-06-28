import { Tool, ToolDefinition, ToolResult, ExecutionContext } from '../../types';
import { ToolExecutionError } from '../errors';

export abstract class BaseTool implements Tool {
  constructor(protected readonly definition: ToolDefinition) {}

  public getDefinition(): ToolDefinition {
    return this.definition;
  }

  public abstract execute(args: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult>;

  protected validateArgs(args: Record<string, unknown>): void {
    for (const argDef of this.definition.arguments) {
      if (argDef.required && args[argDef.name] === undefined) {
        throw new ToolExecutionError(`Missing required argument: ${argDef.name}`);
      }
    }
  }
}
