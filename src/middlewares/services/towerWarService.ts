import axios from 'axios';
import { API_URL } from '../misc/const';
import type { AccursedTower, AccursedTowerUpdate, EnemyClanRef, RespondAction } from '../../interfaces';

const BASE = API_URL + '/clan-management/accursed-tower';
const opts = { withCredentials: true };

/** Agrega `characterId` solo si viene definido. */
const actor = (characterId?: string | null) => (characterId ? { characterId } : {});

// ── Gestión (líder/oficial) ──────────────────────────────────────────────────

export const getAccursedTowers = async (characterId?: string): Promise<AccursedTower[]> =>
  axios.get<AccursedTower[]>(BASE, { params: { characterId }, ...opts }).then(r => r.data);

export const getAccursedTowerManagement = async (id: string, characterId?: string): Promise<AccursedTower> =>
  axios.get<AccursedTower>(BASE + '/' + id, { params: actor(characterId), ...opts }).then(r => r.data);

export const createAccursedTower = async (towerNumber: number, date: string, enemyClan?: string | null, characterId?: string): Promise<AccursedTower> =>
  axios.post<AccursedTower>(BASE, { towerNumber, date, enemyClan: enemyClan || null, characterId }, opts).then(r => r.data);

export const updateAccursedTower = async (id: string, data: AccursedTowerUpdate, characterId?: string | null): Promise<AccursedTower> =>
  axios.patch<AccursedTower>(BASE + '/' + id, { ...data, ...actor(characterId) }, opts).then(r => r.data);

/** Elimina (desactiva) una instancia. */
export const deactivateAccursedTower = async (id: string, characterId?: string | null): Promise<unknown> =>
  axios.delete(BASE + '/' + id, { params: actor(characterId), ...opts }).then(r => r.data);

export const completeAccursedTower = async (id: string, characterId?: string | null): Promise<AccursedTower> =>
  axios.patch<AccursedTower>(BASE + '/' + id, { completed: true, ...actor(characterId) }, opts).then(r => r.data);

export const searchEnemyClans = async (q: string): Promise<EnemyClanRef[]> =>
  axios.get<EnemyClanRef[]>(BASE + '/clans', { params: { q }, ...opts }).then(r => r.data);

export const createEnemyClan = async (name: string, characterId?: string): Promise<EnemyClanRef> =>
  axios.post<EnemyClanRef>(BASE + '/clans', { name, ...actor(characterId) }, opts).then(r => r.data);

export const respondToTowerWar = async (towerId: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
  axios.post(BASE + `/${towerId}/respond`, { characterId, action }, opts).then(r => r.data);

// ── Público (miembros) ───────────────────────────────────────────────────────

export const getActiveAccursedTower = async (characterId?: string): Promise<AccursedTower[] | AccursedTower | null> =>
  axios.get(API_URL + '/accursed-tower/active', { params: { characterId }, ...opts }).then(r => r.data);

export const respondToPublicTowerWar = async (towerId: string, characterId: string, action: RespondAction = 'confirm'): Promise<unknown> =>
  axios.post(API_URL + `/accursed-tower/${towerId}/respond`, { characterId, action }, opts).then(r => r.data);
