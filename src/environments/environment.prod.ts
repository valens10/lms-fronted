export const API_URL = (window as any).__env?.API_URL || 'http://localhost:8080';

export const environment = {
    production: true,
    apiUrl: API_URL,
    version: '1.0.0'
}; 