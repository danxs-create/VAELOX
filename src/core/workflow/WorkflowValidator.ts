import { WorkflowGraph } from './WorkflowGraph';
import { ValidationReport, ValidationIssue, ValidationSeverity } from '../../types/workflow';

export class WorkflowValidator {
  public validate(graph: WorkflowGraph): ValidationReport {
    const errors: string[] = [];
    const issues: ValidationIssue[] = [];

    // Check for Duplicate Nodes (handled by Map implicitly, but checking valid IDs)
    const nodeIds = new Set<string>();
    for (const id of graph.nodes.keys()) {
      if (nodeIds.has(id)) {
        errors.push(`Duplicate node ID found: ${id}`);
        issues.push({ severity: ValidationSeverity.ERROR, message: `Duplicate node ID found: ${id}`, nodeId: id });
      }
      nodeIds.add(id);
    }

    // Check for Missing Dependencies
    for (const node of graph.nodes.values()) {
      for (const depId of node.dependencies) {
        if (!graph.nodes.has(depId)) {
          errors.push(`Node ${node.id} has missing dependency: ${depId}`);
          issues.push({ severity: ValidationSeverity.ERROR, message: `Missing dependency: ${depId}`, nodeId: node.id });
        }
      }
    }

    // Check for Circular Graphs
    try {
      graph.getTopologicalSort();
    } catch (err) {
      if (err instanceof Error) {
        errors.push(err.message);
        issues.push({ severity: ValidationSeverity.ERROR, message: err.message });
      } else {
        errors.push('Circular dependency detected');
        issues.push({ severity: ValidationSeverity.ERROR, message: 'Circular dependency detected' });
      }
    }

    // Check for capabilities mismatch would be done at runtime when assigning agents to nodes
    // but we can check if agentId exists or requiredCapabilities are provided for Execution nodes
    for (const node of graph.nodes.values()) {
      if (!node.agentId && (!node.requiredCapabilities || node.requiredCapabilities.length === 0)) {
        // Just a warning, not strictly an error unless it's an agent node
        if (['PLANNER', 'EXECUTOR', 'REVIEWER'].includes(node.type)) {
          // Changed to warning for backward compatibility on valid flag, or keep as error.
          // Let's keep in errors array for backward compatibility, but in issues as WARNING.
          errors.push(`Node ${node.id} of type ${node.type} requires either an agentId or requiredCapabilities`);
          issues.push({ severity: ValidationSeverity.WARNING, message: `Node ${node.id} of type ${node.type} requires either an agentId or requiredCapabilities`, nodeId: node.id });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      issues
    };
  }
}
