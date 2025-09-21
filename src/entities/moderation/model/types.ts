export type UUID = string;

export interface ModerationItem {
  id: UUID;
  textHe: string;
  createdAt: string; // ISO UTC
  filterId: UUID;
  media?: string | null;
}
