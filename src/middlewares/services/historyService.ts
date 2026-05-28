import axios from 'axios';
import { API_URL } from '../misc/const';

const BASE = API_URL + '/clan-management';

export const getHistory = async (page: number = 1, type: 'all' | 'shadow_war' | 'accursed_tower' = 'all', characterId?: string) =>
  axios
    .get(`${BASE}/history`, { params: { page, type, characterId }, withCredentials: true })
    .then(r => r.data);

export const getAccursedTowerById = async (id: string, characterId?: string) =>
  axios
    .get(`${BASE}/accursed-tower/${id}`, { params: { characterId }, withCredentials: true })
    .then(r => r.data);
