import { randomUUID } from 'crypto';
import { MemoryEntry, MemoryType, MemoryQuery, MemoryMetadata, IMemoryStore } from '../../types/memory';
import { EventBus } from '../events/EventBus';
import { HybridRetrieval } from './HybridRetrieval';

export abstract class BaseMemory implements IMemoryStore {
  protected entries: Map<string, MemoryEntry> = new Map();

  constructor(
    protected type: MemoryType,
    protected eventBus: EventBus,
    protected retrieval: HybridRetrieval
  ) {}

  public async set(key: string, value: unknown, tags: string[] = [], metadataOverrides?: Partial<MemoryMetadata>): Promise<MemoryEntry> {
    const existing = this.entries.get(key);
    const now = Date.now();
    
    const metadata: MemoryMetadata = {
      importance: 0.5,
      ...(existing ? existing.metadata : {}),
      tags,
      frequency: existing ? existing.metadata.frequency + 1 : 1,
      lastAccessed: now,
      ...metadataOverrides
    };

    const entry: MemoryEntry = {
      id: existing ? existing.id : randomUUID(),
      type: this.type,
      key,
      value,
      metadata,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.entries.set(key, entry);

    if (existing) {
       this.eventBus.publish('memory.updated', {
         id: entry.id,
         name: 'memory.updated',
         timestamp: now,
         source: this.type,
         payload: { entry }
       });
    } else {
       this.eventBus.publish('memory.created', {
         id: entry.id,
         name: 'memory.created',
         timestamp: now,
         source: this.type,
         payload: { entry }
       });
    }

    return entry;
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;

    entry.metadata.lastAccessed = Date.now();
    entry.metadata.frequency += 1;
    
    return entry.value as T;
  }

  public async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    return this.retrieval.retrieve(Array.from(this.entries.values()), { ...query, type: this.type });
  }

  public async delete(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.delete(key);
      this.eventBus.publish('memory.deleted', {
         id: entry.id,
         name: 'memory.deleted',
         timestamp: Date.now(),
         source: this.type,
         payload: { id: entry.id, type: this.type }
      });
    }
  }

  public async archive(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (entry) {
      entry.metadata.archived = true;
      this.eventBus.publish('memory.archived', {
         id: entry.id,
         name: 'memory.archived',
         timestamp: Date.now(),
         source: this.type,
         payload: { entry }
      });
    }
  }

  public async clear(): Promise<void> {
    this.entries.clear();
  }
}
