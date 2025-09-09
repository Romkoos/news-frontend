export function getApiBase(): string {
  return (import.meta as any).env?.VITE_API_BASE || '/api';
}
