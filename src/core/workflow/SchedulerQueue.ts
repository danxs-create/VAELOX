import { WorkflowNode } from '../../types/workflow';

export enum QueueType {
  FIFO = 'FIFO',
  PRIORITY = 'PRIORITY',
}

export class SchedulerQueue {
  private items: WorkflowNode[] = [];

  constructor(private type: QueueType = QueueType.FIFO) {}

  public enqueue(node: WorkflowNode): void {
    this.items.push(node);
    if (this.type === QueueType.PRIORITY) {
      this.items.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
  }

  public dequeue(): WorkflowNode | undefined {
    return this.items.shift();
  }

  public peek(): WorkflowNode | undefined {
    return this.items[0];
  }

  public get isEmpty(): boolean {
    return this.items.length === 0;
  }

  public get size(): number {
    return this.items.length;
  }

  public clear(): void {
    this.items = [];
  }
}
