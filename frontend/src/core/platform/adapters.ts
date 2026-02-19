export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface ConnectivityAdapter {
  isOnline(): boolean;
  onChange(handler: (online: boolean) => void): () => void;
}

export interface SyncQueueAdapter {
  enqueue(input: { idempotencyKey: string; action: string; payload: unknown }): Promise<void>;
  flush(): Promise<void>;
}
