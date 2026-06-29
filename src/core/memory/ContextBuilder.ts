import { MemoryManagerImpl } from './MemoryManagerImpl';
import { KnowledgeLayer } from './KnowledgeLayer';

export class ContextBuilder {
  constructor(private memoryManager: MemoryManagerImpl, private knowledgeLayer: KnowledgeLayer) {}

  public async buildContext(request: string): Promise<string[]> {
     const working = await this.memoryManager.working.search({ limit: 10 });
     const session = await this.memoryManager.session.search({ limit: 10 });
     const project = await this.memoryManager.project.search({ limit: 10 });
     const globalMem = await this.memoryManager.global.search({ limit: 10 });
     const knowledge = await this.knowledgeLayer.search(request);

     const contextParts = [
       ...working.map(w => typeof w.value === 'string' ? w.value : JSON.stringify(w.value)),
       ...session.map(s => typeof s.value === 'string' ? s.value : JSON.stringify(s.value)),
       ...project.map(p => typeof p.value === 'string' ? p.value : JSON.stringify(p.value)),
       ...globalMem.map(g => typeof g.value === 'string' ? g.value : JSON.stringify(g.value)),
       ...knowledge.map(k => k.content)
     ];

     return contextParts;
  }
}
