import { MemoryManager, MemoryQuery, MemoryEntry, IMemoryStore } from '../../types/memory';
import { EventBus } from '../events/EventBus';
import { WorkingMemory } from './WorkingMemory';
import { SessionMemory } from './SessionMemory';
import { ProjectMemory } from './ProjectMemory';
import { GlobalMemory } from './GlobalMemory';
import { HybridRetrieval } from './HybridRetrieval';
import { MemoryScorer } from './MemoryScorer';

export class MemoryManagerImpl implements MemoryManager {
  public working: IMemoryStore;
  public session: IMemoryStore;
  public project: IMemoryStore;
  public global: IMemoryStore;

  constructor(private eventBus: EventBus) {
    const scorer = new MemoryScorer();
    const retrieval = new HybridRetrieval(scorer);

    this.working = new WorkingMemory(this.eventBus, retrieval);
    this.session = new SessionMemory(this.eventBus, retrieval);
    this.project = new ProjectMemory(this.eventBus, retrieval);
    this.global = new GlobalMemory(this.eventBus, retrieval);
  }

  public async set(key: string, value: unknown, tags?: string[]): Promise<void> {
    await this.working.set(key, value, tags);
  }

  public async get<T>(key: string): Promise<T | null> {
    const w = await this.working.get<T>(key);
    if (w) return w;
    const s = await this.session.get<T>(key);
    if (s) return s;
    const p = await this.project.get<T>(key);
    if (p) return p;
    return this.global.get<T>(key);
  }

  public async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    const all = await Promise.all([
      this.working.search(query),
      this.session.search(query),
      this.project.search(query),
      this.global.search(query)
    ]);
    return all.flat().sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  public async delete(key: string): Promise<void> {
    await Promise.all([
      this.working.delete(key),
      this.session.delete(key),
      this.project.delete(key),
      this.global.delete(key)
    ]);
  }

  public async clear(): Promise<void> {
    await Promise.all([
      this.working.clear(),
      this.session.clear(),
      this.project.clear(),
      this.global.clear()
    ]);
  }
}
