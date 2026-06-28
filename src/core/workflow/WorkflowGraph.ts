import { WorkflowNode, WorkflowEdge } from '../../types/workflow';

export class WorkflowGraph {
  private _nodes: Map<string, WorkflowNode> = new Map();
  private _edges: WorkflowEdge[] = [];

  public get nodes(): Map<string, WorkflowNode> {
    return this._nodes;
  }

  public get edges(): WorkflowEdge[] {
    return this._edges;
  }

  public addNode(node: WorkflowNode): void {
    this._nodes.set(node.id, node);
  }

  public removeNode(id: string): boolean {
    this._edges = this._edges.filter(e => e.from !== id && e.to !== id);
    return this._nodes.delete(id);
  }

  public addEdge(edge: WorkflowEdge): void {
    if (!this._nodes.has(edge.from)) {
      throw new Error(`Source node ${edge.from} does not exist`);
    }
    if (!this._nodes.has(edge.to)) {
      throw new Error(`Target node ${edge.to} does not exist`);
    }
    
    const exists = this._edges.some(e => e.from === edge.from && e.to === edge.to);
    if (!exists) {
      this._edges.push(edge);
      // Ensure target node has dependency
      const targetNode = this._nodes.get(edge.to);
      if (targetNode && !targetNode.dependencies.includes(edge.from)) {
        targetNode.dependencies.push(edge.from);
      }
    }
  }

  public getTopologicalSort(): WorkflowNode[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: WorkflowNode[] = [];

    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(nodeId)) {
        return;
      }

      temp.add(nodeId);

      const node = this._nodes.get(nodeId);
      if (node) {
        // Visit all nodes that depend on this node
        const outgoingEdges = this._edges.filter(e => e.from === nodeId);
        for (const edge of outgoingEdges) {
          visit(edge.to);
        }
        
        temp.delete(nodeId);
        visited.add(nodeId);
        // Prepend because we want dependencies first
        order.unshift(node);
      }
    };

    // Find roots (nodes with no dependencies)
    for (const [id, node] of this._nodes.entries()) {
      if (node.dependencies.length === 0) {
        visit(id);
      }
    }

    // Check if there are unvisited nodes (disconnected components with circles)
    for (const id of this._nodes.keys()) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    return order;
  }
}
