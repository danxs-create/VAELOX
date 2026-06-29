import { MemoryType } from '../../types/memory';
import { EventBus } from '../events/EventBus';
import { HybridRetrieval } from './HybridRetrieval';
import { BaseMemory } from './BaseMemory';

export class ProjectMemory extends BaseMemory {
  constructor(eventBus: EventBus, retrieval: HybridRetrieval) {
    super(MemoryType.PROJECT, eventBus, retrieval);
  }
}
