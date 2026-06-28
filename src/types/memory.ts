export interface MemoryEntry {
  id: string;
  key: string;
  value: unknown;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MemoryQuery {
  key?: string;
  tags?: string[];
  limit?: number;
}

export interface MemoryManager {
  set(key: string, value: unknown, tags?: string[]): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  search(query: MemoryQuery): Promise<MemoryEntry[]>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
