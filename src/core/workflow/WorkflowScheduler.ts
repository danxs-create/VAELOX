import { WorkflowGraph } from './WorkflowGraph';
import { WorkflowNode, ExecutionStrategy } from '../../types/workflow';
import { SchedulerQueue, QueueType } from './SchedulerQueue';

export class WorkflowScheduler {
  constructor(private strategy: ExecutionStrategy = ExecutionStrategy.SEQUENTIAL) {}

  public schedule(graph: WorkflowGraph): SchedulerQueue {
    const queue = new SchedulerQueue(
      this.strategy === ExecutionStrategy.PARALLEL ? QueueType.PRIORITY : QueueType.FIFO
    );

    // Simple scheduling: Topological sort for sequential
    try {
      const sorted = graph.getTopologicalSort();
      for (const node of sorted) {
        queue.enqueue(node);
      }
    } catch (e) {
      // Handle circular dependency error
      throw e;
    }

    return queue;
  }
}
