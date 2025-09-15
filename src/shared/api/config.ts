export function getApiBase(): string {
    return import.meta.env.VITE_API_BASE || '/api';
}

export function isProd(): boolean {
    return import.meta.env.MODE === 'prod';
}
