import { MemoryEntry } from '../../types/memory';

export class MemoryScorer {
  public score(entry: MemoryEntry, currentTime: number = Date.now()): number {
    const recency = this.calculateRecency(entry.metadata.lastAccessed, currentTime);
    const frequency = this.calculateFrequency(entry.metadata.frequency);
    const importance = entry.metadata.importance;
    
    return (recency * 0.4) + (frequency * 0.3) + (importance * 0.3);
  }

  private calculateRecency(lastAccessed: number, currentTime: number): number {
    const ageMs = currentTime - lastAccessed;
    if (ageMs < 0) return 1;
    const halfLife = 3600000;
    return Math.pow(0.5, ageMs / halfLife);
  }

  private calculateFrequency(frequency: number): number {
    return Math.min(1, Math.log10(frequency + 1) / 3);
  }
}
