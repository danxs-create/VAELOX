import { WorkflowGraph } from './WorkflowGraph';
import { WorkflowStatus, WorkflowResult } from '../../types/workflow';
import { ExecutionContext } from '../../types/context';
import { WorkflowScheduler } from './WorkflowScheduler';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { EventBus } from '../events/EventBus';
import { AgentResult } from '../../types/agent';
import { RecoveryPolicy, RecoveryAction } from '../../types/error';

export interface WorkflowObservabilityHook {
  beforeWorkflow?(context: ExecutionContext): Promise<void>;
  afterWorkflow?(context: ExecutionContext, result: WorkflowResult): Promise<void>;
  beforeAgent?(nodeId: string, context: ExecutionContext): Promise<void>;
  afterAgent?(nodeId: string, context: ExecutionContext, result: AgentResult): Promise<void>;
}

export class WorkflowEngine {
  public status: WorkflowStatus = WorkflowStatus.IDLE;
  private currentContext?: ExecutionContext;
  private pauseResolver?: () => void;
  private results = new Map<string, AgentResult>();
  private hooks: WorkflowObservabilityHook[] = [];

  constructor(
    private scheduler: WorkflowScheduler,
    private orchestrator: AgentOrchestrator,
    private eventBus: EventBus
  ) {}

  public addHook(hook: WorkflowObservabilityHook): void {
    this.hooks.push(hook);
  }

  public async execute(context: ExecutionContext): Promise<WorkflowResult> {
    this.currentContext = context;
    this.status = WorkflowStatus.INITIALIZING;
    this.results.clear();

    const startTime = Date.now();
    this.status = WorkflowStatus.RUNNING;
    
    this.eventBus.publish('workflow.started', {
      id: context.executionId,
      name: 'workflow.started',
      timestamp: Date.now(),
      payload: { workflowId: context.executionId },
      source: 'WorkflowEngine',
    });

    for (const hook of this.hooks) {
      if (hook.beforeWorkflow) await hook.beforeWorkflow(context);
    }

    const queue = this.scheduler.schedule(context.workflow);
    
    try {
      while (!queue.isEmpty) {
        if (context.cancellationToken.isCancellationRequested) {
          this.status = WorkflowStatus.CANCELLED;
          break;
        }

        if ((this.status as WorkflowStatus) === WorkflowStatus.PAUSED) {
          await new Promise<void>(resolve => {
            this.pauseResolver = resolve;
          });
        }

        const node = queue.dequeue();
        if (!node) continue;

        for (const hook of this.hooks) {
          if (hook.beforeAgent) await hook.beforeAgent(node.id, context);
        }

        const result = await this.orchestrator.executeNode(node, context.agentContext);
        this.results.set(node.id, result);

        for (const hook of this.hooks) {
          if (hook.afterAgent) await hook.afterAgent(node.id, context, result);
        }
      }
    } catch (error) {
      this.status = WorkflowStatus.FAILED;
      const wfResult = this.orchestrator.aggregateResults(this.results, Date.now() - startTime);
      wfResult.status = WorkflowStatus.FAILED;
      wfResult.errors.push(error instanceof Error ? error : new Error(String(error)));
      return this.finalize(context, wfResult);
    }

    if (this.status === WorkflowStatus.CANCELLED) {
      const wfResult = this.orchestrator.aggregateResults(this.results, Date.now() - startTime);
      wfResult.status = WorkflowStatus.CANCELLED;
      return this.finalize(context, wfResult);
    }

    this.status = WorkflowStatus.COMPLETED;
    const finalResult = this.orchestrator.aggregateResults(this.results, Date.now() - startTime);
    return this.finalize(context, finalResult);
  }

  private async finalize(context: ExecutionContext, result: WorkflowResult): Promise<WorkflowResult> {
    for (const hook of this.hooks) {
      if (hook.afterWorkflow) await hook.afterWorkflow(context, result);
    }
    
    if (result.status === WorkflowStatus.COMPLETED) {
      this.eventBus.publish('workflow.completed', {
        id: context.executionId,
        name: 'workflow.completed',
        timestamp: Date.now(),
        payload: { workflowId: context.executionId, result },
        source: 'WorkflowEngine',
      });
    } else if (result.status === WorkflowStatus.FAILED) {
      this.eventBus.publish('workflow.failed', {
        id: context.executionId,
        name: 'workflow.failed',
        timestamp: Date.now(),
        payload: { workflowId: context.executionId, error: result.errors[0] },
        source: 'WorkflowEngine',
      });
    }

    return result;
  }

  public async pause(): Promise<void> {
    if (this.status === WorkflowStatus.RUNNING) {
      this.status = WorkflowStatus.PAUSED;
      if (this.currentContext) {
        this.eventBus.publish('workflow.paused', {
          id: this.currentContext.executionId,
          name: 'workflow.paused',
          timestamp: Date.now(),
          payload: { workflowId: this.currentContext.executionId },
          source: 'WorkflowEngine',
        });
      }
    }
  }

  public async resume(): Promise<void> {
    if (this.status === WorkflowStatus.PAUSED) {
      this.status = WorkflowStatus.RUNNING;
      if (this.pauseResolver) {
        this.pauseResolver();
        this.pauseResolver = undefined;
      }
      if (this.currentContext) {
        this.eventBus.publish('workflow.resumed', {
          id: this.currentContext.executionId,
          name: 'workflow.resumed',
          timestamp: Date.now(),
          payload: { workflowId: this.currentContext.executionId },
          source: 'WorkflowEngine',
        });
      }
    }
  }

  public async cancel(): Promise<void> {
    if (this.status === WorkflowStatus.RUNNING || this.status === WorkflowStatus.PAUSED) {
      this.status = WorkflowStatus.CANCELLED;
      if (this.pauseResolver) {
        this.pauseResolver();
        this.pauseResolver = undefined;
      }
      if (this.currentContext) {
        this.eventBus.publish('workflow.cancelled', {
          id: this.currentContext.executionId,
          name: 'workflow.cancelled',
          timestamp: Date.now(),
          payload: { workflowId: this.currentContext.executionId },
          source: 'WorkflowEngine',
        });
      }
    }
  }

  public async restart(): Promise<WorkflowResult> {
    if (!this.currentContext) {
      throw new Error('No workflow to restart');
    }
    this.status = WorkflowStatus.IDLE;
    return this.execute(this.currentContext);
  }
}
