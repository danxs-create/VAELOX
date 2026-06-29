import { MemoryType } from '../../types/memory';
import { EventBus } from '../events/EventBus';
import { HybridRetrieval } from './HybridRetrieval';
import { BaseMemory } from './BaseMemory';

export class WorkingMemory extends BaseMemory {
  constructor(eventBus: EventBus, retrieval: HybridRetrieval) {
    super(MemoryType.WORKING, eventBus, retrieval);
  }
}
