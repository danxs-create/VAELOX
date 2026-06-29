import { BaseEvent } from '../../types/event';
import { MemoryEntry, MemoryType } from '../../types/memory';

export interface MemoryCreatedEvent extends BaseEvent<{
  entry: MemoryEntry;
}> {}

export interface MemoryUpdatedEvent extends BaseEvent<{
  entry: MemoryEntry;
}> {}

export interface MemoryDeletedEvent extends BaseEvent<{
  id: string;
  type: MemoryType;
}> {}

export interface MemoryArchivedEvent extends BaseEvent<{
  entry: MemoryEntry;
}> {}

export interface MemoryCompressedEvent extends BaseEvent<{
  originalTokens: number;
  compressedTokens: number;
}> {}
