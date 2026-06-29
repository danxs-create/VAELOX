export enum MemoryType {
  WORKING = 'WORKING',
  SESSION = 'SESSION',
  PROJECT = 'PROJECT',
  GLOBAL = 'GLOBAL',
}

export interface MemoryMetadata {
  tags: string[];
  importance: number;
  frequency: number;
  lastAccessed: number;
  archived?: boolean;
  [key: string]: unknown;
}

export interface MemoryEntry<T = unknown> {
  id: string;
  type: MemoryType;
  key: string;
  value: T;
  metadata: MemoryMetadata;
  score?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface MemoryQuery {
  key?: string;
  tags?: string[];
  keywords?: string[];
  type?: MemoryType;
  limit?: number;
  metadata?: Record<string, unknown>;
}

export interface IMemoryStore {
  set(key: string, value: unknown, tags?: string[], metadataOverrides?: Partial<MemoryMetadata>): Promise<MemoryEntry>;
  get<T>(key: string): Promise<T | null>;
  search(query: MemoryQuery): Promise<MemoryEntry[]>;
  delete(key: string): Promise<void>;
  archive(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface MemoryManager {
  working: IMemoryStore;
  session: IMemoryStore;
  project: IMemoryStore;
  global: IMemoryStore;
  
  set(key: string, value: unknown, tags?: string[]): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  search(query: MemoryQuery): Promise<MemoryEntry[]>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
}

export interface KnowledgeSource {
  id: string;
  type: string;
  uri: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  sourceId: string;
  categoryId: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface ContextBudget {
  maxTokens: number;
  reservedTokens: number;
}

export interface IVectorDatabase {
  upsert(id: string, vector: number[], metadata: Record<string, unknown>): Promise<void>;
  query(vector: number[], topK: number): Promise<Array<{id: string; score: number}>>;
  delete(id: string): Promise<void>;
}

export interface IEmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ISemanticSearch {
  search(query: string, limit?: number): Promise<unknown[]>;
}

export interface IContextCompressor {
  compress(context: string, budget: ContextBudget): Promise<string>;
  estimateTokens(text: string): number;
}
