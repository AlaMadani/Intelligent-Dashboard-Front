// ---- Imports ----
import axios from 'axios';
import { environment } from 'src/config/environment';

// ---- Helpers ----
export const isAuthEndpoint = (url: string | undefined) => url?.startsWith('/api/auth/') ?? false;

// ---- Axios Instance ----
export const api = axios.create({ baseURL: environment.apiBaseUrl });
