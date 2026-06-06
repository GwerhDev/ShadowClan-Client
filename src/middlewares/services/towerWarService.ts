import axios from 'axios';
import { API_URL } from '../misc/const';

const BASE = API_URL + '/clan-management/accursed-tower';

export const getAccursedTowers = async (characterId?: string) =>
  axios.get(BASE, { params: { characterId }, withCredentials: true }).then(r => r.data);

export const getActiveAccursedTower = async (characterId?: string) =>
  axios.get(API_URL + '/accursed-tower/active', { params: { characterId }, withCredentials: true }).then(r => r.data);

export const createAccursedTower = async (towerNumber: number, date: string, enemyClan?: string | null, characterId?: string) =>
  axios.post(BASE, { towerNumber, date, enemyClan: enemyClan || null, characterId }, { withCredentials: true }).then(r => r.data);

export const updateAccursedTower = async (id: string, data: { towerNumber?: number; date?: string; roster?: any; finalRoster?: any; enemyClan?: string | null; result?: string; completed?: boolean }, characterId?: string) =>
  axios.patch(BASE + '/' + id, { ...data, ...(characterId ? { characterId } : {}) }, { withCredentials: true }).then(r => r.data);

export const deactivateAccursedTower = async (id: string, characterId?: string) =>
  axios.delete(BASE + '/' + id, { params: characterId ? { characterId } : {}, withCredentials: true }).then(r => r.data);

export const completeAccursedTower = async (id: string, characterId?: string) =>
  axios.patch(BASE + '/' + id, { completed: true, ...(characterId ? { characterId } : {}) }, { withCredentials: true }).then(r => r.data);

export const searchEnemyClans = async (q: string) =>
  axios.get(BASE + '/clans', { params: { q }, withCredentials: true }).then(r => r.data);

export const createEnemyClan = async (name: string, characterId?: string) =>
  axios.post(BASE + '/clans', { name, ...(characterId ? { characterId } : {}) }, { withCredentials: true }).then(r => r.data);

export const respondToTowerWar = async (towerId: string, characterId: string) =>
  axios.post(BASE + `/${towerId}/respond`, { characterId }, { withCredentials: true }).then(r => r.data);
