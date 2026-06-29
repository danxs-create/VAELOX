import { MemoryType } from '../../types/memory';
import { EventBus } from '../events/EventBus';
import { HybridRetrieval } from './HybridRetrieval';
import { BaseMemory } from './BaseMemory';

export class GlobalMemory extends BaseMemory {
  constructor(eventBus: EventBus, retrieval: HybridRetrieval) {
    super(MemoryType.GLOBAL, eventBus, retrieval);
  }
}
