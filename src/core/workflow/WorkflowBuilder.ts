import { WorkflowGraph } from './WorkflowGraph';
import { WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../../types/workflow';

export class WorkflowBuilder {
  private graph: WorkflowGraph;

  constructor() {
    this.graph = new WorkflowGraph();
  }

  public addNode(node: WorkflowNode): this {
    this.graph.addNode(node);
    return this;
  }

  public removeNode(id: string): this {
    this.graph.removeNode(id);
    return this;
  }

  public connect(fromId: string, toId: string, condition?: (result: unknown) => boolean): this {
    this.graph.addEdge({ from: fromId, to: toId, condition });
    return this;
  }

  public build(): WorkflowGraph {
    return this.graph;
  }
}
