import axios from 'axios';
import { API_URL } from '../misc/const';
import type { AccursedTower, HistoryEntryInput, HistoryPage, HistoryType } from '../../interfaces';

const BASE = API_URL + '/clan-management';

export const getHistory = async (page: number = 1, type: HistoryType = 'all', characterId?: string, q?: string): Promise<HistoryPage> =>
  axios
    .get<HistoryPage>(`${BASE}/history`, { params: { page, type, characterId, q: q || undefined }, withCredentials: true })
    .then(r => r.data);

/** Registra manualmente una actividad pasada en el historial. */
export const createHistoryEntry = async (data: HistoryEntryInput): Promise<unknown> =>
  axios.post(`${BASE}/history`, data, { withCredentials: true }).then(r => r.data);

export const getAccursedTowerById = async (id: string, characterId?: string): Promise<AccursedTower> =>
  axios
    .get<AccursedTower>(`${BASE}/accursed-tower/${id}`, { params: { characterId }, withCredentials: true })
    .then(r => r.data);
