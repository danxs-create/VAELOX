import { KnowledgeEntry, KnowledgeSource, KnowledgeCategory } from '../../types/memory';

export class KnowledgeLayer {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private sources: Map<string, KnowledgeSource> = new Map();
  private categories: Map<string, KnowledgeCategory> = new Map();

  public addCategory(category: KnowledgeCategory): void {
    this.categories.set(category.id, category);
  }

  public addSource(source: KnowledgeSource): void {
    this.sources.set(source.id, source);
  }

  public addEntry(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);
  }

  public async search(query: string): Promise<KnowledgeEntry[]> {
    const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) {
      return [];
    }
    const results = Array.from(this.entries.values()).filter(entry => {
       const content = entry.content.toLowerCase();
       return keywords.some(kw => content.includes(kw));
    });
    return results;
  }
}
