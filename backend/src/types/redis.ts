export interface RedisClient {
  isOpen: boolean;
  connect(): Promise<void>;
  zAdd(key: string, members: Array<{ score: number; value: string }>): Promise<number>;
  zRangeWithScores(key: string, min: number, max: number): Promise<Array<{ score: number; value: string }>>;
  zRemRangeByRank(key: string, start: number, stop: number): Promise<number>;
  zCard(key: string): Promise<number>;
  zRange(key: string, min: number, max: number, options?: { REV?: boolean }): Promise<string[]>;
  zRangeByScore(key: string, min: number, max: number): Promise<string[]>;
}
