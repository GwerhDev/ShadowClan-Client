import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './misc/const';

// Sesión con refresh token: el access token (cookie u_tkn) dura minutos y el refresh
// token (cookie u_rtkn, httpOnly) mantiene viva la sesión del dispositivo hasta 3 días
// desde la última conexión. Ante un 401 se intenta renovar UNA vez y se reintenta la request.

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _skipAuthRefresh?: boolean };

let refreshing: Promise<boolean> | null = null;

/** Renueva la sesión. Varias llamadas simultáneas comparten la misma petición. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true, _skipAuthRefresh: true } as RetriableConfig)
      .then(() => true)
      .catch(() => false)
      .finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  }
  return refreshing;
}

let installed = false;

/** Instala el interceptor global de axios (llamar una vez en main.ts). */
export function installAuthRefresh(): void {
  if (installed) return;
  installed = true;
  axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const cfg = error.config as RetriableConfig | undefined;
    if (!cfg || error.response?.status !== 401 || cfg._retried || cfg._skipAuthRefresh) throw error;
    if (cfg.url?.includes('/auth/refresh') || cfg.url?.includes('/logout')) throw error;
    const ok = await refreshSession();
    if (!ok) throw error;
    cfg._retried = true;
    return axios(cfg);
  });
}
