import { MemoryEntry, MemoryQuery } from '../../types/memory';
import { MemoryScorer } from './MemoryScorer';

export class HybridRetrieval {
  constructor(private scorer: MemoryScorer) {}

  public retrieve(entries: MemoryEntry[], query: MemoryQuery): MemoryEntry[] {
    let results = entries;

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.key) {
      results = results.filter(e => e.key === query.key);
    }

    if (query.tags && query.tags.length > 0) {
       results = results.filter(e => {
         return query.tags!.some(tag => e.metadata.tags && e.metadata.tags.includes(tag));
       });
    }

    if (query.keywords && query.keywords.length > 0) {
       results = results.filter(e => {
         const valueStr = typeof e.value === 'string' ? e.value : (JSON.stringify(e.value) || '');
         const str = valueStr.toLowerCase();
         return query.keywords!.some(kw => str.includes(kw.toLowerCase()));
       });
    }

    if (query.metadata) {
      results = results.filter(e => {
         for (const [k, v] of Object.entries(query.metadata!)) {
           if (e.metadata[k] !== v) return false;
         }
         return true;
      });
    }

    results.forEach(e => {
      e.score = this.scorer.score(e);
    });

    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }
}
