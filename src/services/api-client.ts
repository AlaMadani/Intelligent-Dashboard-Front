import axios from 'axios';
import { environment } from 'src/config/environment';

export const isAuthEndpoint = (url: string | undefined) => url?.startsWith('/api/auth/') ?? false;

export const api = axios.create({ baseURL: environment.apiBaseUrl });
