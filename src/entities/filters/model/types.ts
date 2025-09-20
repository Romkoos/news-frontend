export type UUID = string;
export type FilterAction = 'publish' | 'reject' | 'moderation';
export type MatchType = 'substring' | 'regex';

export interface Filter {
  id: UUID;
  keyword: string;           // Hebrew phrase
  action: FilterAction;      // final decision
  priority: number;          // bigger = more important
  matchType?: MatchType;     // default 'substring'
  active?: boolean;          // default true
  notes?: string;            // optional
  updatedAt: string;         // ISO
}

export interface Settings {
  defaultAction: FilterAction;   // if no filters matched
}

export type FilterInput = Omit<Filter, 'id' | 'updatedAt'>;
