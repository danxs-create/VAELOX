import { ToolStatus } from '../core/constants';
import { ExecutionContext } from './context';

export interface ToolArgument {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  arguments: ToolArgument[];
}

export interface ToolResult<T = unknown> {
  status: ToolStatus;
  data?: T;
  error?: Error;
  executionTimeMs: number;
}

export interface Tool {
  getDefinition(): ToolDefinition;
  execute(args: Record<string, unknown>, context: ExecutionContext): Promise<ToolResult>;
}
